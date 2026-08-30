from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from geoalchemy2.functions import ST_Distance, ST_MakePoint, ST_SetSRID
from pydantic import BaseModel

from app.database import get_db
from app.models.listing import Listing, Crop
from app.models.user import User
from app.schemas.listing_schema import CropResponse, ListingCreate, ListingResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


class InventoryUpdateSchema(BaseModel):
    add_quantity: float
    price_per_unit: Optional[float] = None
    is_active: Optional[bool] = True


# Helper to attach crop_name to listing response
def format_listing_response(listing: Listing, db: Session) -> ListingResponse:
    crop = db.query(Crop).filter(Crop.cid == listing.cid).first()
    return ListingResponse(
        lid=listing.lid,
        fid=listing.fid,
        cid=listing.cid,
        quantity_available=listing.quantity_available,
        price_per_unit=listing.price_per_unit,
        listing_type=listing.listing_type,
        harvested_at=listing.harvested_at,
        expiry_date=listing.expiry_date,
        is_active=listing.is_active,
        crop_name=crop.name if crop else f"Crop #{listing.cid}"
    )


# 1. Crops Catalog
@router.get("/crops", response_model=List[CropResponse])
def get_all_crops(db: Session = Depends(get_db)):
    return db.query(Crop).all()


# 2. Get All Active Produce Listings (For Buyers & Marketplace)
@router.get("/", response_model=List[ListingResponse])
def get_all_listings(
    crop_name: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Listing).filter(Listing.is_active == True)
    if crop_name:
        clean_name = crop_name.strip().lower()
        crop = db.query(Crop).filter(
            or_(
                Crop.name.ilike(f"%{clean_name}%"),
                func.lower(func.array_to_string(Crop.aliases, ',')).contains(clean_name)
            )
        ).first()
        if crop:
            query = query.filter(Listing.cid == crop.cid)

    listings = query.order_by(Listing.lid.desc()).limit(limit).all()
    return [format_listing_response(l, db) for l in listings]


# 2b. Get Current Farmer's Own Listings
@router.get("/my-listings", response_model=List[ListingResponse])
def get_my_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listings = db.query(Listing).filter(Listing.fid == current_user.uid).order_by(Listing.lid.desc()).all()
    return [format_listing_response(l, db) for l in listings]


# 3. Spatial Listing Search (Case-insensitive & Alias enabled)
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

    return [format_listing_response(l, db) for l in listings]


# 4. Create Produce Listing
@router.post("/", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    listing_in: ListingCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Resolve crop ID
    cid = listing_in.cid
    if not cid and listing_in.crop_name:
        clean_name = listing_in.crop_name.strip().lower()
        crop = db.query(Crop).filter(
            or_(
                Crop.name.ilike(clean_name),
                func.lower(func.array_to_string(Crop.aliases, ',')).contains(clean_name)
            )
        ).first()
        if not crop:
            # Create standard crop entry if not present
            crop = Crop(
                name=listing_in.crop_name.strip().title(),
                aliases=[listing_in.crop_name.strip().lower()],
                sample_img_url="/placeholder.jpg"
            )
            db.add(crop)
            db.commit()
            db.refresh(crop)
        cid = crop.cid

    if not cid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either cid or a valid crop_name must be provided."
        )

    # Resolve coordinates
    lat = listing_in.lat or (listing_in.location.latitude if listing_in.location else 19.9975)
    lon = listing_in.lon or (listing_in.location.longitude if listing_in.location else 73.7898)
    point = ST_SetSRID(ST_MakePoint(lon, lat), 4326)
    
    now = datetime.now(timezone.utc)
    harvested_at = listing_in.harvested_at or now
    expiry_date = listing_in.expiry_date or (now + timedelta(days=7))

    listing = Listing(
        fid=current_user.uid,
        cid=cid,
        quantity_available=listing_in.quantity_available,
        price_per_unit=listing_in.price_per_unit,
        listing_type=listing_in.listing_type or "Standard",
        harvested_at=harvested_at,
        expiry_date=expiry_date,
        location=point,
        is_active=True
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return format_listing_response(listing, db)


# 5. Restock or Edit Inventory
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
    return format_listing_response(listing, db)


# 6. Take down or toggle active status
@router.patch("/{lid}/toggle-active", response_model=ListingResponse)
def toggle_listing_active(
    lid: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.lid == lid).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing record not found.")

    if listing.fid != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You can only take down or edit your own listings."
        )

    listing.is_active = not listing.is_active
    db.commit()
    db.refresh(listing)
    return format_listing_response(listing, db)


# 7. Delete listing completely
@router.delete("/{lid}")
def delete_listing(
    lid: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.lid == lid).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing record not found.")

    if listing.fid != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You can only delete your own listings."
        )

    db.delete(listing)
    db.commit()
    return {"success": True, "message": f"Listing #{lid} removed successfully."}