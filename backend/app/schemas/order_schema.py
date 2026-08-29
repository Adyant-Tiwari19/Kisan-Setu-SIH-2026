from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.order import OrderStatus

class OrderCreate(BaseModel):
    bid: int
    lid: int
    quantity: float

class OrderResponse(BaseModel):
    oid: int
    bid: int
    lid: int
    quantity: float
    produce_price: float
    logistics_price: float
    landed_price: float
    status: OrderStatus
    ordered_at: datetime

    class Config:
        from_attributes = True