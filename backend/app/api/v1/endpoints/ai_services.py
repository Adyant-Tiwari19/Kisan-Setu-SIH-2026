from datetime import datetime, timezone
from typing import Dict, List, Optional
from app.database import get_db
from app.models.listing import Crop, Listing
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.services.ranking_engine import calculate_seller_score
from app.services.routing import cluster_orders_for_delivery
from app.api.v1.endpoints.location import geocode_address
from app.services.forecasting import demand_forecaster
from fastapi import APIRouter, Depends, HTTPException, status, Query
from geoalchemy2.functions import ST_Distance, ST_MakePoint, ST_SetSRID, ST_DWithin
from geoalchemy2.types import Geography
from pydantic import BaseModel
from sqlalchemy import func, or_, cast
from sqlalchemy.orm import Session

router = APIRouter()

class RouteClusterRequest(BaseModel):
    orders: List[Dict[str, float]]

@router.post("/rank-sellers")
def rank_sellers_for_buyer(
    crop_name: str = Query(..., description="Crop to be ranked for."), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    geo_res = geocode_address(address=current_user.address)
    lat = geo_res.latitude
    lon = geo_res.longitude

    if lat is None or lon is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide valid buyer coordinates or a resolvable address. "
        )
    
    clean_name = crop_name.strip().lower()

    crop = (
        db.query(Crop)
        .filter(
            or_(
                Crop.name.ilike(f"%{clean_name}%"),
                func.lower(func.array_to_string(Crop.aliases, ",")).contains(clean_name)
            )
        ).first()
    )

    if not crop:
        return []

    # 1. Construct buyer coordinate point in SRID 4326
    buyer_point = ST_SetSRID(ST_MakePoint(lon,lat), 4326)

    # 2. Cast both geometries to Geography to measure distance accurately in meters
    distance_in_meters = func.ST_Distance(
        cast(Listing.location, Geography),
        cast(buyer_point, Geography)
    )

    listings = (db.query(
            Listing,
            (distance_in_meters / 1000.0).label("distance_km")
        ).filter(
            Listing.cid == crop.cid,
            Listing.is_active == True,
            Listing.quantity_available > 0
        ).all()
    )

    if not listings:
        return []

    prices = [item[0].price_per_unit for item in listings]
    distances = [item[1] if item[1] is not None else 10.0 for item in listings]

    min_p, max_p = min(prices), max(prices)
    max_d = max(distances) if max(distances) > 0 else 50.0

    now = datetime.now(timezone.utc)
    ranked_results = []

    for listing, dist in listings:
        dist_val = float(dist) if dist is not None else 12.0
        harvest_time = listing.harvested_at
        if harvest_time.tzinfo is None:
            harvest_time = harvest_time.replace(tzinfo=timezone.utc)

        age_hours = max(0.1, (now - harvest_time).total_seconds() / 3600.0)
        landed_price_est = listing.price_per_unit + (dist_val * 1.5)

        score_data = calculate_seller_score(
            landed_price=landed_price_est,
            min_price=min_p,
            max_price=max_p,
            distance_km=dist_val,
            max_distance=max_d,
            hours_since_harvest=age_hours,
            max_hours=72.0
        )

        from app.models.user import User
        farmer = db.query(User).filter(User.uid == listing.fid).first()
        crop_obj = db.query(Crop).filter(Crop.cid == listing.cid).first()

        ranked_results.append({
            "lid": listing.lid,
            "fid": listing.fid,
            "cid": listing.cid,
            "crop_name": crop_obj.name if crop_obj else f"Crop #{listing.cid}",
            "farmer_name": farmer.name if farmer else f"Producer #{listing.fid}",
            "quantity_available": listing.quantity_available,
            "price_per_unit": listing.price_per_unit,
            "estimated_landed_price": round(landed_price_est, 2),
            "distance_km": round(dist_val, 2),
            "harvest_age_hours": round(age_hours, 1),
            "ai_score": score_data["composite_score"],
            "transparency_reasons": score_data["transparency_reasons"]
        })

    ranked_results.sort(key=lambda x: x["ai_score"], reverse=True)
    return ranked_results

@router.post("/optimize-routes")
def optimize_delivery_routes(req: RouteClusterRequest):
    if not req.orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order locations list cannot be empty."
        )
    return cluster_orders_for_delivery(order_locations=req.orders)

@router.post("/predict-demand")
def predict_crop_demand(
    crop_id: int = Query(..., description="Crop ID [1 , 50]"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    crop = db.query(Crop).filter(Crop.cid == crop_id).first()
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop #{crop_id} was not found."
        )

    address = current_user.address
    geo_res = geocode_address(address=address)
    lat = geo_res.latitude
    lon = geo_res.longitude

    target_point = ST_SetSRID(ST_MakePoint(lon,lat), 4326)
    radius_meters = 50 * 1000.0

    active_supply_kg = db.query(
        func.coalesce(func.sum(Listing.quantity_available), 0.0)
    ).filter(
        Listing.cid == crop_id,
        Listing.is_active == True,
        func.ST_DWithin(
            cast(Listing.location, Geography),
            cast(target_point, Geography),
            radius_meters
        )
    ).scalar()

    avg_price = db.query(
        func.coalesce(func.avg(Listing.price_per_unit), 35.0)
    ).filter(
        Listing.cid == crop_id,
        Listing.is_active == True,
        func.ST_DWithin(
            cast(Listing.location, Geography),
            cast(target_point, Geography),
            radius_meters
        )
    ).scalar()

    now = datetime.now(timezone.utc)

    forecast = demand_forecaster.predict_demand(
        crop_id=crop_id,
        latitude=lat,
        longitude=lon,
        day_of_week=now.weekday(),
        month=now.month,
        historical_demand_7d_avg=float(active_supply_kg) * 1.15,
        local_active_supply_kg=float(active_supply_kg),
        avg_price_per_unit=float(avg_price)
    )

    predicted_demand = forecast["predicted_demand_kg"]
    supply_gap = round(predicted_demand - float(active_supply_kg) , 2)

    return {
        "crop_id" : crop_id,
        "crop_name" : crop.name,
        "location" : {"latitude": lat , "longitude": lon},
        "search_radius_km": 50,
        "current_active_supply_kg": round(float(active_supply_kg) , 2),
        "avg_market_price" : round(float(avg_price) , 2),
        "predicted_demand_kg": predicted_demand,
        "supply_gap_kg" : supply_gap,
        "model_status" : forecast["status"]
    }