from app.database import get_db
from app.models.listing import Listing, Crop
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.schemas.order_schema import OrderCreate, OrderResponse, OrderStatusUpdate
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from pydantic import BaseModel,Field
from datetime import datetime, timezone
from typing import List, Optional
from app.api.v1.endpoints.auth import get_current_user


router = APIRouter()

class OrderRatingRequest(BaseModel):
  rating: float = Field(..., ge=1.0,le=5.0)
  feedback:Optional[str] = None


def format_order_response(order: Order, db: Session) -> OrderResponse:
    listing = db.query(Listing).filter(Listing.lid == order.lid).first()
    crop_name = None
    farmer_name = None
    if listing:
        crop = db.query(Crop).filter(Crop.cid == listing.cid).first()
        crop_name = crop.name if crop else f"Produce #{listing.cid}"
        farmer = db.query(User).filter(User.uid == listing.fid).first()
        farmer_name = farmer.name if farmer else f"Producer #{listing.fid}"
    
    buyer = db.query(User).filter(User.uid == order.bid).first()
    buyer_name = buyer.name if buyer else f"Buyer #{order.bid}"

    return OrderResponse(
        oid=order.oid,
        bid=order.bid,
        lid=order.lid,
        quantity=order.quantity,
        produce_price=order.produce_price,
        logistics_price=order.logistics_price,
        landed_price=order.landed_price,
        status=order.status,
        crop_name=crop_name,
        farmer_name=farmer_name,
        buyer_name=buyer_name,
        ordered_at=order.ordered_at,
        delivered_at=order.delivered_at,
    )


@router.post(
    "/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED
)
def place_order(
    order_in: OrderCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    buyer_id = order_in.bid if order_in.bid is not None else current_user.uid
    buyer = db.query(User).filter(User.uid == buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer user not found.")

    listing = db.query(Listing).filter(Listing.lid == order_in.lid).first()
    if not listing or not listing.is_active:
        raise HTTPException(
            status_code=404, detail="Listing is no longer active or available."
        )

    # If requested quantity is larger than single listing, fulfill maximum available stock
    actual_quantity = order_in.quantity
    if listing.quantity_available < order_in.quantity:
        if listing.quantity_available > 0:
            actual_quantity = listing.quantity_available
        else:
            raise HTTPException(
                status_code=400, detail="Insufficient stock available for this order."
            )

    produce_price = listing.price_per_unit * actual_quantity
    logistics_price = round(actual_quantity * 1.5, 2)  
    landed_price = produce_price + logistics_price

    listing.quantity_available -= actual_quantity
    if listing.quantity_available <= 0:
        listing.is_active = False

    order = Order(
        bid=buyer_id,
        lid=order_in.lid,
        quantity=actual_quantity,
        produce_price=produce_price,
        logistics_price=logistics_price,
        landed_price=landed_price,
        status=OrderStatus.PLACED,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return format_order_response(order, db)


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
    return format_order_response(order, db)


@router.get("/my-orders", response_model=List[OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    orders = db.query(Order).join(Listing, Order.lid == Listing.lid).filter(
        (Order.bid == current_user.uid) | (Listing.fid == current_user.uid)
    ).order_by(Order.oid.desc()).all()
    return [format_order_response(o, db) for o in orders]

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

@router.put("/{oid}/deliver", response_model=OrderResponse)
def mark_order_delivered(oid: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.oid == oid).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Order not found"
        )
    
    order.status = OrderStatus.DELIVERED
    order.delivered_at = datetime.now(timezone.utc)
    
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