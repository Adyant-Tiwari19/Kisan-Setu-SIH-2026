from app.database import get_db
from app.models.listing import Listing
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.schemas.order_schema import OrderCreate, OrderResponse, OrderStatusUpdate
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from pydantic import BaseModel,Field
from datetime import datetime, timezone
from typing import List, Optional
from app.api.v1.endpoints.auth import get_current_user


router = APIRouter()

class OrderRatingRequest(BaseModel):
  rating: float = Field(..., ge=1.0,le=5.0)
  feedback:Optional[str] = None


@router.post(
    "/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED
)
def place_order(order_in: OrderCreate, db: Session = Depends(get_db)):
  buyer = db.query(User).filter(User.uid == order_in.bid).first()
  if not buyer:
    raise HTTPException(status_code=404, detail="Buyer user not found.")

  listing = (
      db.query(Listing).filter(Listing.lid == order_in.lid).first()
  )
  if not listing or not listing.is_active:
    raise HTTPException(
        status_code=404, detail="Listing is no longer active or available."
    )

  if listing.quantity_available < order_in.quantity:
    raise HTTPException(
        status_code=400, detail="Insufficient stock available for this order."
    )

  produce_price = listing.price_per_unit * order_in.quantity
  logistics_price = round(order_in.quantity * 1.5, 2)  
  landed_price = produce_price + logistics_price

  listing.quantity_available -= order_in.quantity
  if listing.quantity_available <= 0:
    listing.is_active = False

  order = Order(
      bid=order_in.bid,
      lid=order_in.lid,
      quantity=order_in.quantity,
      produce_price=produce_price,
      logistics_price=logistics_price,
      landed_price=landed_price,
      status=OrderStatus.PLACED,
  )
  db.add(order)
  db.commit()
  db.refresh(order)
  return order

@router.get("/{oid}/track", response_model=OrderResponse)
def track_order_lifecycle(
  oid: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  order = db.query(Order).filter(Order.oid == oid).first()
  if not order:
    raise HTTPException(
      status_code=404,
      detail="Order Not Found."
    )
  return order

@router.get("/my-orders", response_model=List[OrderResponse])
def get_my_orders(
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  orders = db.query(Order).join(Listing, Order.lid==Listing.lid).filter(
    (Order.bid == current_user.uid) | (Listing.lid == current_user.uid)
  ).all()
  return orders

@router.patch("/{oid}/status", response_model=OrderResponse)
def update_order_status(
  oid: int,
  status_update: OrderStatusUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  order = db.query(Order).filter(Order.oid == oid).first()
  if not order:
    raise HTTPException(
      status_code=404,
      detail="Order Not Found"
    )

  order.status = status_update.status

  if order.status == OrderStatus.DELIVERED:
    order.delivered_at = datetime.now(timezone.utc)

  elif status_update.status == OrderStatus.DISPUTED:
    order.payment_status = "HELD_FOR_REVIEW"
    if hasattr(status_update, "dispute_reason") and status_update.dispute_reason:
      order.dispute_reason = status_update.dispute_reason

  elif status_update.status == OrderStatus.SETTLED:
    order.payment_status = "RELEASED_TO_FARMER"

  db.commit()
  db.refresh(order)
  return order

@router.post("/{oid}/rate", response_model=OrderResponse)
def rate_order_and_seller(
  oid: int,
  rate_req: OrderRatingRequest,
  db:Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  order = db.query(Order).filter(Order.oid == oid, Order.bid == current_user.uid).first()
  if not order:
    raise HTTPException(status_code=404,detail="Order not found or authorization failed.")

  if order.status not in [OrderStatus.DELIVERED , OrderStatus.SETTLED]:
    raise HTTPException(status_code=400, detail="Cannot rate an undelivered order.")

  order.rating = rate_req.rating

  listing = db.query(Listing).filter(Listing.lid == order.lid).first()
  if listing:
    farmer = db.query(User).filter(User.uid == listing.fid).first()
    if farmer:
      current_score = farmer.reliability_score or 0.9
      new_score = (current_score * 0.8) + ((rate_req.rating / 5.0) * 0.2)
      farmer.reliability_score = round(new_score , 2)

  db.commit()
  db.refresh(order)
  return order