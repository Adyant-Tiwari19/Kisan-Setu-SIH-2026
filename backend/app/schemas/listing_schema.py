from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LocationPoint(BaseModel):
    latitude: float
    longitude: float

class ListingCreate(BaseModel):
    fid: int
    cid: int
    quantity_available: float
    price_per_unit: float
    listing_type: Optional[str] = "Standard"
    harvested_at: datetime
    expiry_date: datetime
    location: LocationPoint

class ListingResponse(BaseModel):
    lid: int
    fid: int
    cid: int
    quantity_available: float
    price_per_unit: float
    listing_type: Optional[str]
    harvested_at: datetime
    expiry_date: datetime
    is_active: bool

    class Config:
        from_attributes = True