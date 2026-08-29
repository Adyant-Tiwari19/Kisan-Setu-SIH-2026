from typing import List
from app.database import get_db
from app.models.listing import Crop, Listing
from app.models.user import User, UserRole
from app.schemas.listing_schema import ListingCreate, ListingResponse
from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2.functions import ST_Distance, ST_MakePoint, ST_SetSRID
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

router = APIRouter()


@router.post(
    "/", response_model=ListingResponse, status_code=status.HTTP_201_CREATED
)
def create_listing(listing_in: ListingCreate, db: Session = Depends(get_db)):
  user = db.query(User).filter(User.uid == listing_in.fid).first()
  if not user:
    raise HTTPException(status_code=404, detail="User not found.")

  if user.role not in [UserRole.FARMER_FPO, UserRole.ADMIN]:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied. Only verified Farmers/FPOs can create listings.",
    )

  point = ST_SetSRID(
      ST_MakePoint(
          listing_in.location.longitude, listing_in.location.latitude
      ),
      4326,
  )

  listing = Listing(
      fid=listing_in.fid,
      cid=listing_in.cid,
      quantity_available=listing_in.quantity_available,
      price_per_unit=listing_in.price_per_unit,
      listing_type=listing_in.listing_type,
      harvested_at=listing_in.harvested_at,
      expiry_date=listing_in.expiry_date,
      location=point,
  )
  db.add(listing)
  db.commit()
  db.refresh(listing)
  return listing


@router.get("/search", response_model=list[ListingResponse])
def search_listings(
    crop_name: str,
    buyer_lat: float,
    buyer_lon: float,
    max_distance_km: float = 50.0,
    db: Session = Depends(get_db)
):
    clean_name = crop_name.strip().lower()

    # 1. Match crop by name (case-insensitive) OR search within the aliases PostgreSQL array
    crop = db.query(Crop).filter(
        or_(
            Crop.name.ilike(clean_name),
            func.lower(func.array_to_string(Crop.aliases, ',')).contains(clean_name)
        )
    ).first()

    # Python memory fallback if exact database function mapping varies
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

    # 2. Perform Spatial Distance Filtering using PostGIS
    buyer_point = ST_SetSRID(ST_MakePoint(buyer_lon, buyer_lat), 4326)

    listings = db.query(Listing).filter(
        Listing.cid == crop.cid,
        Listing.is_active == True,
        (ST_Distance(Listing.location, buyer_point, use_spheroid=True) / 1000.0) <= max_distance_km
    ).all()

    return listings