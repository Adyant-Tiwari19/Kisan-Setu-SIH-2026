import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.models.user import UserRole


class UserCreate(BaseModel):
  name: str
  phone: str
  password: str = Field(..., min_length=4)
  role: UserRole
  address: Optional[str] = None
  pincode: Optional[str] = None
  account_num: Optional[str] = None
  ifsc: Optional[str] = None

  # 1. Constraint: Name (Alphabets, dot, space, apostrophe, hyphen)
  @field_validator("name")
  @classmethod
  def validate_name(cls, v: str) -> str:
    v = v.strip()
    regex = r"^[a-zA-Z\s\.\'\-]+$"
    if not re.match(regex, v):
      raise ValueError(
          "Name can only contain alphabets, spaces, dots, apostrophes, and"
          " hyphens."
      )
    return v

  # 2. Constraint: Phone Number (Exactly 10 digits)
  @field_validator("phone")
  @classmethod
  def validate_phone(cls, v: str) -> str:
    v = v.strip()
    if not (v.isdigit() and len(v) == 10):
      raise ValueError("Phone number must be exactly 10 numeric digits.")
    return v

  # 3. Constraint: Pincode (Exactly 6 digits)
  @field_validator("pincode")
  @classmethod
  def validate_pincode(cls, v: Optional[str]) -> Optional[str]:
    if v is None or v.strip() == "":
      return None
    v = v.strip()
    if not (v.isdigit() and len(v) == 6):
      raise ValueError("Pincode must be exactly 6 numeric digits.")
    return v

  # 4. Constraint: Account Number (9-18 numeric digits)
  @field_validator("account_num")
  @classmethod
  def validate_account_num(cls, v: Optional[str]) -> Optional[str]:
    if v is None or v.strip() == "":
      return None
    v = v.strip()
    if not (v.isdigit() and 9 <= len(v) <= 18):
      raise ValueError("Account number must be between 9 and 18 digits.")
    return v

  # 5. Constraint: IFSC (11 chars: 4 alphabets, 5th is 0, last 6 alphanumeric)
  @field_validator("ifsc")
  @classmethod
  def validate_ifsc(cls, v: Optional[str]) -> Optional[str]:
    if v is None or v.strip() == "":
      return None
    v = v.strip().upper()
    regex = r"^[A-Z]{4}0[A-Z0-9]{6}$"
    if not re.match(regex, v):
      raise ValueError(
          "Invalid IFSC code format. (Must be 11 characters: 4 alphabets,"
          " 5th character '0', last 6 alphanumeric)."
      )
    return v


class UserResponse(BaseModel):
  uid: int
  name: str
  phone: str
  role: UserRole
  address: Optional[str] = None
  pincode: Optional[str] = None
  reliability_score: float
  account_num: Optional[str] = None
  ifsc: Optional[str] = None

  class Config:
    from_attributes = True