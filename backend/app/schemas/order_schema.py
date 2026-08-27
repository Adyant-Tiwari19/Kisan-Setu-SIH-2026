from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.order import OrderStatus

class OrderCreate(BaseModel):
    buyer_id: int
    listing_id: int
    quantity: float

class OrderResponse(BaseModel):
    id: int
    buyer_id: int
    listing_id: int
    quantity: float
    produce_price: float
    logistics_price: float
    landed_price: float
    status: OrderStatus
    ordered_at: datetime

    class Config:
        from_attributes = True