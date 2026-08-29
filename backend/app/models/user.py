import enum
from sqlalchemy import Column, DateTime, Enum, Float, Integer, String
from app.database import Base


class UserRole(str, enum.Enum):
  FARMER_FPO = "FARMER_FPO"
  RETAIL_BUYER = "RETAIL_BUYER"
  BULK_BUYER = "BULK_BUYER"
  ADMIN = "ADMIN"


class User(Base):
  __tablename__ = "users"

  uid = Column(Integer, primary_key=True, index=True)
  name = Column(String(100), nullable=False)
  phone = Column(String(10), unique=True, index=True, nullable=False)

  hashed_password = Column(String(255), nullable=False)

  reset_otp = Column(String(6), nullable=True)
  reset_otp_expiry = Column(DateTime(timezone=True), nullable=True)

  role = Column(Enum(UserRole), nullable=False, default=UserRole.FARMER_FPO)
  address = Column(String(255), nullable=True)
  pincode = Column(String(6), nullable=True)
  reliability_score = Column(Float, default=0.9)

  account_num = Column(String(18), nullable=True)
  ifsc = Column(String(11), nullable=True)