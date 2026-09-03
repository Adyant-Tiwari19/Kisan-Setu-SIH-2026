import os
import requests
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# Cleans up quotation marks or accidental whitespace from .env
MAPPLS_REST_KEY = os.getenv("MAPPLS_REST_KEY", "").strip("\"' ")

class GeocodeResponse(BaseModel):
    latitude: float
    longitude: float
    display_name: str
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    wkt_point: str

@router.get("/geocode", response_model=GeocodeResponse)
def geocode_address_mappls(
    address: str = Query(..., description="House/Apartment, Street, Landmark, or Sector")
):
    """
    Converts Indian address text into precise (lat, lon) coordinates via Mappls REST API.
    """
    if not MAPPLS_REST_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="MAPPLS_REST_KEY not found in environment variables."
        )

    # Correct Mappls Geocoding Endpoint
    geocode_url = "https://atlas.mappls.com/api/places/geocode"
    
    # Static key passed as access_token parameter
    params = {
        "address": address,
        "access_token": MAPPLS_REST_KEY
    }

    try:
        response = requests.get(geocode_url, params=params, timeout=5)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Mappls geocoding service returned status code {response.status_code}."
            )

        data = response.json()
        
        # Mappls copResults contains place metadata
        cop_results = data.get("copResults", {})
        if isinstance(cop_results, list):
            if not cop_results:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No coordinates found for the provided address."
                )
            match = cop_results[0]
        elif isinstance(cop_results, dict) and cop_results:
            match = cop_results
        else:
            # Fallback to 'results' key if copResults is absent
            results_list = data.get("results", [])
            if not results_list:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No coordinates found for the provided address."
                )
            match = results_list[0]

        lat = float(match.get("lat") or match.get("latitude"))
        lon = float(match.get("lng") or match.get("longitude"))
        formatted_address = match.get("formattedAddress", address)
        city = match.get("city") or match.get("district")
        state = match.get("state")
        pincode = match.get("pincode")

        return GeocodeResponse(
            latitude=lat,
            longitude=lon,
            display_name=formatted_address,
            city=city,
            state=state,
            pincode=pincode,
            wkt_point=f"SRID=4326;POINT({lon} {lat})"
        )

    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Geocoding request failed: {str(e)}"
        )