from datetime import datetime, timezone
from typing import Dict, List
from app.database import get_db
from app.models.listing import Crop,Listing
from app.services.ranking_engine import calculate_seller_score
from app.services.routing import cluster_orders_for_delivery
from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2.functions import ST_Distance, ST_MakePoint, ST_SetSRID
from pydantic import BaseModel
from sqlalchemy import func, or_, String
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
                Crop.name.ilike(clean_name),
                func.lower(func.array_to_string(Crop.aliases, ",")).contains(clean_name)
            )
        ).first()
    )

    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop Matching '{req.crop_name}' not found."
        )

    buyer_point = ST_SetSRID(ST_MakePoint(req.buyer_lon, req.buyer_lat), 4326)

    listings = (
        db.query(
            Listing,
            (
                ST_Distance(Listing.location , buyer_point, use_spheroid=True) / 1000.0
            ).label("distance_km")
        ).filter(Listing.cid == crop.cid, Listing.is_active == True).all()
    )

    if not listings:
        return []

    prices = [item.Listing.price_per_unit for item in listings]
    distances = [item.distance_km for item in listings]

    min_p , max_p = min(prices), max(prices)
    max_d = max(distances)

    now = datetime.now(timezone.utc)
    ranked_results = []

    for listing, dist in listings:
        harvest_time = listing.harvested_at
        if harvest_time.tzinfo is None:
            harvest_time = harvest_time.replace(tzinfo= timezone.utc)

        age_hours = max(0.1, (now - harvest_time).total_seconds() / 3600.0)
        landed_price_est = listing.price_per_unit + (dist * 1.5)

        score_data = calculate_seller_score(
            landed_price=landed_price_est,
            min_price=min_p,
            max_price=max_p,
            distance_km=dist,
            max_distance=max_d,
            hours_since_harvest=age_hours,
            max_hours=72.0
        )

        ranked_results.append({
            "lid": listing.lid,
            "fid": listing.fid,
            "cid": listing.cid,
            "price_per_unit": listing.price_per_unit,
            "estimated_landed_price": round(landed_price_est, 2),
            "distance_km": round(dist,2),
            "harvest_age_hours": round(age_hours , 1),
            "ai_score": score_data["composite_score"],
            "transparency_reasons": score_data["transparency_reasons"]
        })

    ranked_results.sort(key=lambda x: x["ai_score"], reverse=True)
    return ranked_results

@router.get("/optimize-routes")
def optimize_delivery_routes(req: RouteClusterRequest):
    if not req.orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order locations list cannot be empty."
        )
    return cluster_orders_for_delivery(order_locations=req.orders)