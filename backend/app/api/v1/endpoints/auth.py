import random
from typing import Any, Optional
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import jwt
from pydantic import BaseModel,Field
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user_schema import UserCreate, UserResponse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from psycopg2.errors import UniqueViolation
from sqlalchemy.exc import IntegrityError
from app.core.config import settings

router = APIRouter()

ACCESS_TOKEN_EXPIRE_MINUTES = 60* 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated= "auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

class UserRegisterSchema(BaseModel):
    name: str
    phone: str
    password: str = Field(..., min_length=4)
    role: UserRole
    address: Optional[str] = None
    pincode: Optional[str] = None
    account_num: Optional[str] = None
    ifsc: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    phone: str

class ResetPasswordRequest(BaseModel):
    phone: str
    otp: str
    new_password: str = Field(..., min_length=4)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ProfileUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    pincode: str | None = None
    account_num: str | None = None
    ifsc: str | None = None

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm= settings.ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code= status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        phone: str = payload.get("sub")
        if phone is None:
            raise credentials_exception
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.query(User).filter(User.phone == phone).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.phone == user_in.phone).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this phone number is already registered."
        )
    try:
        user = User(
            name = user_in.name,
            phone= user_in.phone,
            hashed_password= get_password_hash(user_in.password),
            role= user_in.role,
            address= user_in.address,
            pincode= user_in.pincode,
            account_num= user_in.account_num,
            ifsc= user_in.ifsc
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError as e:
        db.rollback()
        if isinstance(e.orig, UniqueViolation):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already exists in the system."
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Database constraint violation. Please verify input formats."
        )

# Login Endpoint

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or user not registered.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data = {"sub": user.phone, "uid": user.uid, "role": user.role.value},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/forgot-password")
def request_password_reset_otp(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == req.phone).first()
    if not user:
        return {"message":"If this phone number is registered, an OTP has been sent."}

    otp = f"{random.randint(100000,999999)}"
    user.reset_otp = otp
    user.reset_otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()

    print("\n" + "=" * 50)
    print(f"[SMS OTP MOCK] Phone : {user.phone} | OTP: {otp}")
    print("=" * 50 + "\n")

    return {"message":"OTP sent successfully to your registered phone number."}

@router.post("/reset-password")
def reset_password_with_otp(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == req.phone).first()
    if not user or not user.reset_otp or not user.reset_otp_expiry:
        raise HTTPException(
            status_code=400,
            detail="Invalid password reset request."
        )
    if datetime.now(timezone.utc) > user.reset_otp_expiry.replace(tzinfo=timezone.utc):
        raise HTTPException(
            status_code=400,
            detail="OTP has expired. Please request a new OTP"
        )
    if user.reset_otp != req.otp:
        raise HTTPException(
            status_code=400,
            detail="Incorrect OTP"
        )

    user.hashed_password = get_password_hash(req.new_password)
    user.reset_otp = None
    user.reset_otp_expiry = None

    db.commit()
    return {"message": "Password Updated Successfully! You can now log in with your new password."}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_user_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_data = profile_in.model_dump(exclude_unset=True)
    for field,value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user