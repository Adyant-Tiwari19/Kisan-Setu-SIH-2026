from datetime import datetime, timedelta, timezone
import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, cast, literal
from sqlalchemy.exc import IntegrityError
from geoalchemy2.functions import ST_Distance, ST_MakePoint, ST_SetSRID
from geoalchemy2.types import Geography, Geometry
from pydantic import BaseModel

from app.database import get_db
from app.models.listing import Listing, Crop
from app.models.user import User
from app.schemas.listing_schema import CropResponse, ListingCreate, ListingResponse, ListingUpdate
from app.api.v1.endpoints.auth import get_current_user
from app.api.v1.endpoints.location import geocode_address

router = APIRouter()
DEFAULT_BUYER_COORDINATES = (28.6139, 77.2090)


class InventoryUpdateSchema(BaseModel):
    add_quantity: float
    price_per_unit: Optional[float] = None
    is_active: Optional[bool] = True


class ListingDeleteResponse(BaseModel):
    success: bool
    message: str


# Helper to attach crop_name to listing response
def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_km = 6371.0
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(delta_lon / 2) ** 2
    )
    return earth_radius_km * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def get_geometry_coordinates(db: Session, location: object) -> Optional[tuple[float, float]]:
    if location is None:
        return None

    latitude = db.scalar(func.ST_Y(cast(location, Geometry)))
    longitude = db.scalar(func.ST_X(cast(location, Geometry)))
    if latitude is None or longitude is None:
        return None

    return float(latitude), float(longitude)


def resolve_buyer_coordinates(current_user: User, db: Session) -> tuple[float, float]:
    if current_user.address and current_user.address.strip():
        try:
            geo_res = geocode_address(address=current_user.address)
            return float(geo_res.latitude), float(geo_res.longitude)
        except (HTTPException, TypeError, ValueError):
            pass

    stored_coordinates = get_geometry_coordinates(db, current_user.location)
    if stored_coordinates:
        return stored_coordinates

    return DEFAULT_BUYER_COORDINATES


def format_listing_response(
    listing: Listing,
    db: Session,
    distance_km: Optional[float] = None,
) -> ListingResponse:
    crop = db.query(Crop).filter(Crop.cid == listing.cid).first()

    lat = db.scalar(func.ST_Y(cast(listing.location , Geometry))) or 0.0
    lon = db.scalar(func.ST_X(cast(listing.location , Geometry))) or 0.0

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
        crop_name=crop.name if crop else f"Crop #{listing.cid}",
        sample_img_url=crop.sample_img_url if crop else None,
        latitude= round(float(lat), 6),
        longitude= round(float(lon), 6),
        distance_km=round(distance_km, 2) if distance_km is not None else None,
        created_at=listing.created_at,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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

    buyer_lat, buyer_lon = resolve_buyer_coordinates(current_user, db)
    listings = (
        query
        .order_by(Listing.lid.desc())
        .limit(limit)
        .all()
    )

    responses = []
    for listing in listings:
        seller_coordinates = get_geometry_coordinates(db, listing.location)
        if seller_coordinates is None:
            seller = db.query(User).filter(User.uid == listing.fid).first()
            seller_coordinates = get_geometry_coordinates(db, seller.location) if seller else None

        distance_km = 0.0
        if seller_coordinates:
            distance_km = haversine_distance_km(
                buyer_lat,
                buyer_lon,
                seller_coordinates[0],
                seller_coordinates[1],
            )

        responses.append(format_listing_response(listing, db, distance_km))

    return responses


# 2b. Get Current Farmer's Own Listings
@router.get("/my-listings", response_model=List[ListingResponse])
def get_my_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listings = db.query(Listing).filter(
        Listing.fid == current_user.uid
    ).order_by(Listing.lid.desc()).all()
    return [format_listing_response(l, db) for l in listings]


# 3. Spatial Listing Search (Case-insensitive & Alias enabled)
@router.get("/search")
def search_listings(
    crop_name: str = Query(..., description="Name or alias of the crop"),
    lat: Optional[float] = Query(None, description="Buyer Latitude"),
    lon: Optional[float] = Query(None, description="Buyer Longitude"),
    address: Optional[str] = Query(None, description="Buyer location address text"),
    radius_km: Optional[float] = Query(50.0, description="Search radius in kilometers; omit for all listings"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    buyer_lat, buyer_lon = lat,lon
    search_all_distances = radius_km is None

    if address == None:
        address = current_user.address

    if not search_all_distances and (buyer_lat is None or buyer_lon is None) and address:
        geo_res = geocode_address(address=address)
        buyer_lat = geo_res.latitude
        buyer_lon = geo_res.longitude

    if not search_all_distances and (buyer_lat is None or buyer_lon is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must Provide either(lat,lon) coords or a valid address."
        )

    
    clean_name = crop_name.strip().lower()

    # 1. Match Crop by name or aliases
    crop = (
        db.query(Crop)
        .filter(
            or_(
                Crop.name.ilike(f"%{clean_name}%"),
                func.lower(func.array_to_string(Crop.aliases, ",")).contains(clean_name)
            )
        )
        .first()
    )

    if not crop:
        return []

    # 2. Construct spatial point for the buyer (SRID 4326)
    buyer_point = (
        None
        if search_all_distances
        else ST_SetSRID(ST_MakePoint(buyer_lon, buyer_lat), 4326)
    )

    # Convert radius_km to meters for PostGIS Geography calculation
    radius_meters = radius_km * 1000.0 if radius_km is not None else None

    # 3. Calculate dynamic distance in km
    distance_km_col = (
        literal(None)
        if search_all_distances
        else (
            func.ST_Distance(
                cast(Listing.location, Geography),
                cast(buyer_point, Geography)
            ) / 1000.0
        )
    ).label("distance_km")

    # 4. Filter by crop, active status, AND spatial distance radius
    results = (
        db.query(
            Listing,
            Crop,
            User,
            distance_km_col,
            func.ST_Y(cast(Listing.location, Geometry)).label("listing_lat"),
            func.ST_X(cast(Listing.location, Geometry)).label("listing_lon")
        )
        .join(Crop, Crop.cid == Listing.cid)
        .join(User, User.uid == Listing.fid)
        .filter(
            Crop.cid == crop.cid,
            Listing.is_active == True,
            Listing.quantity_available > 0,
        )
    )
    if not search_all_distances:
        results = results.filter(
            func.ST_DWithin(
                cast(Listing.location, Geography),
                cast(buyer_point, Geography),
                radius_meters
            )
        ).order_by(distance_km_col)
    else:
        results = results.order_by(Listing.lid.desc())
    results = results.all()

    formatted_listings = []
    for listing, listing_crop, listing_farmer, dist, l_lat, l_lon in results:
        formatted_listings.append({
            "lid": listing.lid,
            "fid": listing.fid,
            "cid": listing.cid,
            "crop_name": listing_crop.name,
            "sample_img_url": listing_crop.sample_img_url,
            "farmer_name": listing_farmer.name,
            "farmer_address": listing_farmer.address,
            "farmer_phone": listing_farmer.phone,
            "quantity_available": listing.quantity_available,
            "price_per_unit": listing.price_per_unit,
            "listing_type": listing.listing_type,
            "distance_km": round(float(dist), 2) if dist is not None else 0.0,
            "longitude": round(float(l_lat),6) if l_lat else 0.0,
            "latitude": round(float(l_lon), 6) if l_lon else 0.0,
            "harvested_at": listing.harvested_at,
            "created_at": listing.created_at,
            "expiry_date": listing.expiry_date
        })

    return formatted_listings

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

    address_filled = listing_in.address

    if not address_filled:
        address_filled = current_user.address

    if not address_filled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your address is missing. Please update your profile with a valid address. "
        )


    geo_res = geocode_address(address=address_filled)
    lat = geo_res.latitude
    lon = geo_res.longitude

    if not geo_res or geo_res.latitude is None or geo_res.longitude is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to resolve spatial coordinates for address: '{address_filled}'"
        )

    if lat is None or lon is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide valid coordinates (lat/lon) or a resolvable address. "
        )

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

    seller_lat = db.scalar(func.ST_Y(listing.location)) or 0.0
    seller_lon = db.scalar(func.ST_X(listing.location)) or 0.0

    return {
        "lid" : listing.lid,
        "fid" : listing.fid,
        "cid" : listing.cid,
        "crop_name" : listing_in.crop_name,
        "quantity_available": listing.quantity_available,
        "price_per_unit" : listing.price_per_unit,
        "listing_type" : listing.listing_type,
        "harvested_at" : listing.harvested_at,
        "expiry_date" : listing.expiry_date,
        "is_active" : listing.is_active,
        "latitude" : round(float(seller_lat),6),
        "longitude": round(float(seller_lon),6)
    }


# 5. Restock or Edit Inventory
@router.put("/{lid}", response_model=ListingResponse)
def update_listing(
    lid: int,
    listing_in: ListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.lid == lid).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing record not found.")
    if listing.fid != current_user.uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own listings.")
    if listing_in.quantity_available < 0 or listing_in.price_per_unit <= 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative and price must be greater than zero.")

    listing.quantity_available = listing_in.quantity_available
    listing.price_per_unit = listing_in.price_per_unit
    if listing_in.harvested_at is not None:
        listing.harvested_at = listing_in.harvested_at
    listing.is_active = listing_in.quantity_available > 0
    db.commit()
    db.refresh(listing)
    return format_listing_response(listing, db)


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
@router.delete("/{lid}", response_model=ListingDeleteResponse)
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

    try:
        db.delete(listing)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This listing cannot be deleted because it has existing orders. "
                   "Set its quantity to zero or keep it inactive instead."
        )

    return {"success": True, "message": f"Listing #{lid} removed successfully."}