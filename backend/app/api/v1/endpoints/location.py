# app/api/v1/endpoints/location.py

import os
import re
import requests
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

LOCATIONIQ_KEY = os.getenv("LOCATIONIQ_KEY", "").strip("\"' ")

class GeocodeResponse(BaseModel):
    latitude: float
    longitude: float
    display_name: str
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    wkt_point: str

def clean_indian_address(address: str) -> str:
    cleaned = re.sub(r'sector\s*-\s*(\d+)', r'Sector \1', address, flags=re.IGNORECASE)
    return cleaned.strip()

@router.get("/geocode", response_model=GeocodeResponse)
def geocode_address(
    address: str = Query(..., description="House/Apartment, Street, Landmark, or Sector")
):
    if not LOCATIONIQ_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="LOCATIONIQ_KEY not configured."
        )

    cleaned_addr = clean_indian_address(address)

    url = "https://us1.locationiq.com/v1/search"
    params = {
        "key": LOCATIONIQ_KEY,
        "q": cleaned_addr,
        "format": "json",
        "countrycodes": "in",
        "addressdetails": 1,
        "limit": 1
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        
        if response.status_code != 200 or not response.json():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No coordinates found for the provided address."
            )

        match = response.json()[0]
        
        # PostGIS expects X=Longitude, Y=Latitude -> ST_MakePoint(lon, lat)
        lat = float(match.get("lat"))
        lon = float(match.get("lon"))

        address_details = match.get("address", {})
        city = (
            address_details.get("city")
            or address_details.get("town")
            or address_details.get("suburb")
        )

        return GeocodeResponse(
            latitude=lat,
            longitude=lon,
            display_name=match.get("display_name", address),
            city=city,
            state=address_details.get("state"),
            pincode=address_details.get("postcode"),
            wkt_point=f"SRID=4326;POINT({lon} {lat})"
        )

    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Geocoding request failed: {str(e)}"
        )