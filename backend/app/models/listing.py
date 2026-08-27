from sqlalchemy import Column , Integer , String , Float , DateTime, ForeignKey, Boolean, func
from sqlalchemy.dialects.postgresql import ARRAY
from geoalchemy2 import Geometry
from app.database import Base

class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer , primary_key=True , index=True)
    name = Column(String(100), nullable= False , unique=True, index=True)
    aliases = Column(ARRAY(String), nullable=True)
    sample_img_url = Column(String(255), nullable=False)

class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer , primary_key=True)
    farmer_id = Column(Integer, ForeignKey("users.id" , ondelete="CASCADE") , nullable=False)
    crop_id = Column(Integer , ForeignKey("crops.id" , ondelete="RESTRICT") , nullable=False)

    quantity_available = Column(Float , nullable=False)
    price_per_unit = Column(Float , nullable=False)
    listing_type = Column(String(50), nullable=True)

    harvested_at = Column(DateTime(timezone=True) , nullable=False)
    expiry_date = Column(DateTime(timezone=True) , nullable=False)

    location = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())