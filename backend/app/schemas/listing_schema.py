from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LocationPoint(BaseModel):
    latitude: float
    longitude: float

class CropResponse(BaseModel):
    cid: int
    name: str
    aliases: Optional[list[str]] = None
    sample_img_url: Optional[str] = None

    class Config:
        from_attributes = True

class ListingCreate(BaseModel):
    fid: Optional[int] = None
    cid: Optional[int] = None
    crop_name: Optional[str] = None
    quantity_available: float
    price_per_unit: float
    listing_type: Optional[str] = "Standard"
    harvested_at: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    address: Optional[str] = None


class ListingResponse(BaseModel):
    lid: int
    fid: int
    cid: int
    quantity_available: float
    price_per_unit: float
    listing_type: Optional[str] = None
    harvested_at: datetime
    expiry_date: datetime
    is_active: bool
    crop_name: Optional[str] = None

    latitude: float
    longitude: float

    class Config:
        from_attributes = True