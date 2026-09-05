from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus
from app.models.listing import Listing
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

class RecentPayoutSchema(BaseModel):
    oid: int
    crop_name: Optional[str] = None
    quantity_sold: float
    amount_earned: float
    settled_at: Optional[datetime] = None

class FarmerIncomeDashboardSchema(BaseModel):
    total_earnings: float
    monthly_earnings: float
    pending_escrow: float
    total_quantity_sold: float
    total_completed_orders: int
    reliability_score: float
    recent_payouts: List[RecentPayoutSchema]

@router.get("/farmer-dashboard", response_model=FarmerIncomeDashboardSchema)
def get_farmer_income_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.FARMER_FPO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Farmers and FPOs."
        )

    farmer_listing_ids = select(Listing.lid).where(Listing.fid == current_user.uid)

    delivered_query = db.query(
        func.coalesce(func.sum(Order.produce_price), 0.0).label("total_earnings"),
        func.coalesce(func.sum(Order.quantity), 0.0).label("total_quantity"),
        func.count(Order.oid).label("total_orders")
    ).filter(
        Order.lid.in_(farmer_listing_ids),
        Order.status == OrderStatus.DELIVERED
    ).first()

    total_earnings = float(delivered_query.total_earnings)
    total_quantity_sold = float(delivered_query.total_quantity)
    total_completed_orders = int(delivered_query.total_orders)

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    next_month = (
        month_start.replace(year=month_start.year + 1, month=1)
        if month_start.month == 12
        else month_start.replace(month=month_start.month + 1)
    )
    monthly_earnings = db.query(
        func.coalesce(func.sum(Order.produce_price), 0.0)
    ).filter(
        Order.lid.in_(farmer_listing_ids),
        Order.ordered_at >= month_start,
        Order.ordered_at < next_month,
    ).scalar()

    pending_query = db.query(
        func.coalesce(func.sum(Order.produce_price), 0.0)
    ).filter(
        Order.lid.in_(farmer_listing_ids),
        Order.status.in_([
            OrderStatus.PLACED,
            OrderStatus.CLUSTERED,
            OrderStatus.OUT_FOR_DELIVERY,
        ])
    ).scalar()

    pending_escrow = float(pending_query) if pending_query else 0.0

    recent_orders = db.query(Order).filter(
        Order.lid.in_(farmer_listing_ids),
        Order.status == OrderStatus.DELIVERED
    ).order_by(Order.ordered_at.desc()).limit(5).all()

    recent_payouts = []
    for ord_item in recent_orders:
        listing = db.query(Listing).filter(Listing.lid == ord_item.lid).first()
        recent_payouts.append(
            RecentPayoutSchema(
                oid = ord_item.oid,
                crop_name= f"Listing #{ord_item.lid}",
                quantity_sold= ord_item.quantity,
                amount_earned= ord_item.produce_price,
                settled_at= ord_item.delivered_at or ord_item.ordered_at
            )
        )

    return FarmerIncomeDashboardSchema(
        total_earnings= round(total_earnings, 2),
        monthly_earnings= round(float(monthly_earnings or 0.0), 2),
        pending_escrow= round(pending_escrow, 2),
        total_quantity_sold= round(total_quantity_sold, 2),
        total_completed_orders= total_completed_orders,
        reliability_score= current_user.reliability_score or 0.9,
        recent_payouts= recent_payouts
    )