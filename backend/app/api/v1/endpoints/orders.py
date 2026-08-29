from app.database import get_db
from app.models.listing import Listing
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.schemas.order_schema import OrderCreate, OrderResponse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter()


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