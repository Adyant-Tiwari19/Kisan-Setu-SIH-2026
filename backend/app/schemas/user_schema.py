from pydantic import BaseModel
from typing import Optional
from app.models.user import UserRole

class UserBase(BaseModel):
    name : str
    phone : str
    role : UserRole
    address: Optional[str] = None
    pincode: Optional[str] = None

class UserCreate(UserBase):
    account_num: Optional[str] = None
    ifsc: Optional[str] = None

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True