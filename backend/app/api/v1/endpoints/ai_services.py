from datetime import datetime, timezone
from typing import Dict, List
from app.database import get_db
from app.models.listing import Crop, Listing
from app.services.ranking_engine import calculate_seller_score
from app.services.routing import cluster_orders_for_delivery
from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2.functions import ST_Distance, ST_MakePoint, ST_SetSRID
from geoalchemy2.types import Geography
from pydantic import BaseModel
from sqlalchemy import func, or_, cast
from sqlalchemy.orm import Session

router = APIRouter()

class RecommendationRequest(BaseModel):
    crop_name: str
    buyer_lat: float
    buyer_lon: float

class RouteClusterRequest(BaseModel):
    orders: List[Dict[str, float]]

@router.post("/rank-sellers")
def rank_sellers_for_buyer(
    req: RecommendationRequest, db: Session = Depends(get_db)
):
    clean_name = req.crop_name.strip().lower()

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
    buyer_point = ST_SetSRID(ST_MakePoint(req.buyer_lon, req.buyer_lat), 4326)

    # 2. Cast both geometries to Geography to measure distance accurately in meters
    distance_in_meters = func.ST_Distance(
        cast(Listing.location, Geography),
        cast(buyer_point, Geography)
    )

    listings = db.query(
        Listing,
        (distance_in_meters / 1000.0).label("distance_km")
    ).filter(
        Listing.cid == crop.cid,
        Listing.is_active == True,
        Listing.quantity_available > 0
    ).all()

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