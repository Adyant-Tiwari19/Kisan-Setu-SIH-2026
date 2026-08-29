from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.order import OrderStatus

class OrderCreate(BaseModel):
    bid: int
    lid: int
    quantity: float

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    dispute_reason: Optional[str] = Field(
        None,
        max_length=255,
        description="Reason for raising a dispute (required if status is DISPUTED)"
    )

class PaymentVerifyRequest(BaseModel):
    oid: int
    razorpay_order_id: str
    razorpay_payment_id: str

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