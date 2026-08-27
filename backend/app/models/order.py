import enum
from sqlalchemy import Column , Integer , Float, String, Enum, DateTime, ForeignKey, func
from app.database import Base

class OrderStatus(str, enum.Enum):
    PLACED = "placed"
    CLUSTERED = "clustered"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    DISPUTED = "disputed"
    SETTLED = "settled"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer , primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)

    quantity = Column(Float , nullable=False)
    produce_price = Column(Float , nullable=False)
    logistics_price = Column(Float, nullable=False)
    landed_price = Column(Float , nullable=False)

    status = Column(Enum(OrderStatus) , default=OrderStatus.PLACED)
    delivery_cluster_id = Column(Integer, nullable=True, index=True)

    rating = Column(Float, nullable=True)
    ordered_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime(timezone=True), nullable=True)