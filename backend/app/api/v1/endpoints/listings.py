# app/api/v1/endpoints/listings.py

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from geoalchemy2.functions import ST_Distance, ST_MakePoint, ST_SetSRID
from pydantic import BaseModel

from app.database import get_db
from app.models.listing import Listing, Crop
from app.models.user import User
from app.schemas.listing_schema import ListingCreate, ListingResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


class InventoryUpdateSchema(BaseModel):
    add_quantity: float
    price_per_unit: Optional[float] = None
    is_active: Optional[bool] = True


# 1. Spatial Listing Search (Case-insensitive & Alias enabled)
@router.get("/search", response_model=List[ListingResponse])
def search_listings(
    crop_name: str,
    buyer_lat: float,
    buyer_lon: float,
    max_distance_km: float = 50.0,
    db: Session = Depends(get_db)
):
    clean_name = crop_name.strip().lower()

    crop = db.query(Crop).filter(
        or_(
            Crop.name.ilike(clean_name),
            func.lower(func.array_to_string(Crop.aliases, ',')).contains(clean_name)
        )
    ).first()

    if not crop:
        all_crops = db.query(Crop).all()
        for c in all_crops:
            if c.name.lower() == clean_name:
                crop = c
                break
            if c.aliases and any(clean_name in alias.lower() for alias in c.aliases):
                crop = c
                break

    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No crop matching '{crop_name}' found in catalog."
        )

    buyer_point = ST_SetSRID(ST_MakePoint(buyer_lon, buyer_lat), 4326)

    listings = db.query(Listing).filter(
        Listing.cid == crop.cid,
        Listing.is_active == True,
        (ST_Distance(Listing.location, buyer_point, use_spheroid=True) / 1000.0) <= max_distance_km
    ).all()

    return listings


# 2. Create Produce Listing
@router.post("/", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    listing_in: ListingCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    point = ST_SetSRID(ST_MakePoint(listing_in.lon, listing_in.lat), 4326)
    
    listing = Listing(
        fid=current_user.uid,  # Set directly from JWT
        cid=listing_in.cid,
        quantity_available=listing_in.quantity_available,
        price_per_unit=listing_in.price_per_unit,
        listing_type=listing_in.listing_type,
        harvested_at=listing_in.harvested_at,
        expiry_date=listing_in.expiry_date,
        location=point,
        is_active=True
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing



@router.patch("/{lid}/inventory", response_model=ListingResponse)
def restock_inventory(
    lid: int, 
    inventory_in: InventoryUpdateSchema, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.lid == lid).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing record not found.")

    if listing.fid != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You can only edit or restock your own listings."
        )

    listing.quantity_available += inventory_in.add_quantity
    
    if inventory_in.price_per_unit is not None:
        listing.price_per_unit = inventory_in.price_per_unit
        
    if inventory_in.is_active is not None:
        listing.is_active = inventory_in.is_active
    elif listing.quantity_available > 0:
        listing.is_active = True

    db.commit()
    db.refresh(listing)
    return listing