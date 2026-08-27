import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from app.database import Base

class UserRole(str , enum.Enum):
    FARMER_FPO = "farmer_fpo"
    RETAIL_BUYER = "retail_buyer"
    BULK_BUYER = "bulk_buyer"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer , primary_key=True , index=True)
    name = Column(String(100) , nullable=False)
    phone = Column(String(15) , unique=True , nullable=False, index= True)
    role = Column(Enum(UserRole) , nullable=False)
    address = Column(String(255) , nullable=True)
    pincode = Column(String(10) , nullable=True)

    account_num = Column(String(30) , nullable=True)
    ifsc = Column(String(15) , nullable=True)

    created_at = Column(DateTime(timezone=True) , server_default=func.now())