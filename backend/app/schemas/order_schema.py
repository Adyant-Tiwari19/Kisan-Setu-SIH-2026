from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.order import OrderStatus

class OrderCreate(BaseModel):
    bid: Optional[int] = None
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
    crop_name: Optional[str] = None
    farmer_name: Optional[str] = None
    buyer_name: Optional[str] = None
    ordered_at: datetime
    delivered_at: Optional[datetime] = None

    class Config:
        from_attributes = True