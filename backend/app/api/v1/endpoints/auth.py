import random
from typing import Any, Optional
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import jwt
from pydantic import BaseModel,Field
from app.database import get_db
from app.models.user import User, UserRole
from app.api.v1.endpoints.location import geocode_address
from app.schemas.user_schema import UserCreate, UserResponse
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from psycopg2.errors import UniqueViolation
from sqlalchemy.exc import IntegrityError
from app.core.config import settings
from geoalchemy2.functions import ST_SetSRID, ST_MakePoint
import bcrypt
from firebase_admin import auth

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

    address: str

class ForgotPasswordRequest(BaseModel):
    phone: str

class LoginCredentialsRequest(BaseModel):
    phone: str
    password: str

class ResetPasswordRequest(BaseModel):
    phone: str
    otp: str
    new_password: str = Field(..., min_length=4)

class OtpRequest(BaseModel):
    phone: str

class OtpLoginVerifyRequest(BaseModel):
    phone: str
    otp: str

class OtpRegisterVerifyRequest(BaseModel):
    name: str
    phone: str
    password: str = Field(..., min_length=4)
    role: UserRole
    address: Optional[str] = None
    pincode: Optional[str] = None
    otp: str

PENDING_REGISTER_OTPS: dict[str, dict] = {}

import json
import os

OTP_CACHE_FILE = os.path.join(os.path.dirname(__file__), ".pending_otps.json")

def get_pending_otps() -> dict:
    if os.path.exists(OTP_CACHE_FILE):
        try:
            with open(OTP_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_pending_otps(data: dict):
    try:
        with open(OTP_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f)
    except Exception:
        pass

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse



def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        # Fallback if plain match
        return plain_password == hashed_password

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
        sub: str = payload.get("sub")
        if sub is None:
            raise credentials_exception
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if str(sub).isdigit():
        user = db.query(User).filter((User.phone == str(sub)) | (User.uid == int(sub))).first()
    else:
        user = db.query(User).filter(User.phone == sub).first()

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
def register_user(user_in: UserRegisterSchema, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.phone == user_in.phone).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this phone number is already registered."
        )

    geo_res = geocode_address(address= user_in.address)
    lat = geo_res.latitude
    lon = geo_res.longitude

    location_point = ST_SetSRID(ST_MakePoint(lon,lat), 4326)
    try:
        user = User(
            name = user_in.name,
            phone= user_in.phone,
            hashed_password= get_password_hash(user_in.password),
            role= user_in.role,
            address= user_in.address,
            pincode= user_in.pincode,
            account_num= user_in.account_num,
            ifsc= user_in.ifsc,
            location= location_point
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


# 3. Two-Factor (Password + OTP) Login Endpoints
@router.post("/login-validate-credentials")
def validate_credentials_and_send_otp(req: LoginCredentialsRequest, db: Session = Depends(get_db)):
    clean_phone = req.phone.strip()
    user = db.query(User).filter(User.phone == clean_phone).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password. Please verify your credentials."
        )

    otp = f"{random.randint(100000, 999999)}"
    user.reset_otp = otp
    user.reset_otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()

    print("\n" + "=" * 50)
    print(f"[SMS 2FA LOGIN OTP] Phone : {user.phone} | OTP: {otp}")
    print("=" * 50 + "\n")

    return {
        "success": True,
        "message": f"Password verified! 6-digit OTP sent to {user.phone}."
    }


@router.post("/request-login-otp")
def request_login_otp(req: OtpRequest, db: Session = Depends(get_db)):
    clean_phone = req.phone.strip()
    user = db.query(User).filter(User.phone == clean_phone).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not registered. Please create an account first."
        )

    otp = f"{random.randint(100000, 999999)}"
    user.reset_otp = otp
    user.reset_otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()

    print("\n" + "=" * 50)
    print(f"[SMS LOGIN OTP] Phone : {user.phone} | OTP: {otp}")
    print("=" * 50 + "\n")

    return {
        "success": True,
        "message": f"OTP sent to {user.phone}."
    }


@router.post("/verify-login-otp", response_model=Token)
def verify_login_otp(req: OtpLoginVerifyRequest, db: Session = Depends(get_db)):
    clean_phone = req.phone.strip()
    user = db.query(User).filter(User.phone == clean_phone).first()
    if not user or not user.reset_otp or not user.reset_otp_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP found. Please request a login OTP."
        )

    if datetime.now(timezone.utc) > user.reset_otp_expiry.replace(tzinfo=timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new OTP."
        )

    if user.reset_otp != req.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect OTP. Please enter the valid 6-digit code."
        )

    user.reset_otp = None
    user.reset_otp_expiry = None
    db.commit()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.phone, "uid": user.uid, "role": user.role.value},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}


# 4. Phone Registration & Verification Endpoints
@router.get("/check-phone/{phone}")
def check_phone_registered(phone: str, db: Session = Depends(get_db)):
    clean_phone = phone.strip().replace(" ", "").replace("-", "")[-10:]
    user = db.query(User).filter(User.phone == clean_phone).first()
    if user:
        return {
            "registered": True,
            "role": user.role.value,
            "name": user.name,
            "message": f"This mobile number is already registered as a {user.role.value}."
        }
    return {
        "registered": False,
        "role": None,
        "name": None,
        "message": "Mobile number is available for registration."
    }


@router.post("/request-register-otp")
def request_register_otp(req: OtpRequest, db: Session = Depends(get_db)):
    clean_phone = req.phone.strip().replace(" ", "").replace("-", "")[-10:]
    existing_user = db.query(User).filter(User.phone == clean_phone).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This mobile number ({clean_phone}) is already registered. Please sign in instead."
        )

    otp = f"{random.randint(100000, 999999)}"
    otps = get_pending_otps()
    otps[clean_phone] = {
        "otp": otp,
        "expires": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    }
    save_pending_otps(otps)

    print("\n" + "=" * 50)
    print(f"[SMS REGISTER OTP] Phone : {clean_phone} | OTP: {otp}")
    print("=" * 50 + "\n")

    return {
        "success": True,
        "message": f"Verification OTP sent to {clean_phone}."
    }


@router.post("/verify-register-otp", response_model=Token)
def verify_register_otp(req: OtpRegisterVerifyRequest, db: Session = Depends(get_db)):
    clean_phone = req.phone.strip().replace(" ", "").replace("-", "")[-10:]
    clean_otp = req.otp.strip()

    # Reject if already registered
    existing_user = db.query(User).filter(User.phone == clean_phone).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This mobile number ({clean_phone}) is already registered. Please sign in instead."
        )

    otps = get_pending_otps()
    pending = otps.get(clean_phone)

    valid = False
    if pending:
        try:
            exp_str = pending.get("expires")
            if exp_str:
                exp = datetime.fromisoformat(exp_str)
                if exp.tzinfo is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                if datetime.now(timezone.utc) <= exp and pending.get("otp") == clean_otp:
                    valid = True
            elif pending.get("otp") == clean_otp:
                valid = True
        except Exception:
            if pending.get("otp") == clean_otp:
                valid = True

    # Master dev fallback for seamless testing
    if not valid and (clean_otp == "123456" or (pending and pending.get("otp") == clean_otp)):
        valid = True

    if not valid and not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending verification for this phone number. Please click Resend OTP."
        )

    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect OTP code. Please enter the valid 6-digit code."
        )

    # Clear pending
    if clean_phone in otps:
        del otps[clean_phone]
        save_pending_otps(otps)

    # Create User if not exists
    user = db.query(User).filter(User.phone == clean_phone).first()
    if not user:
        user = User(
            name=req.name,
            phone=clean_phone,
            hashed_password=get_password_hash(req.password),
            role=req.role,
            address=req.address,
            pincode=req.pincode
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.phone, "uid": user.uid, "role": user.role.value},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_user_profile(
    name: Optional[str] = Query(None,description="Name of the User"),
    address: Optional[str] = Query(None,description="Address of the User"),
    account_num: Optional[str] = Query(None,description="Account Number of the user"),
    ifsc: Optional[str] = Query(None,description="IFSC code of User's acc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if (current_user.name != name and name != None):
        current_user.name = name

    if (current_user.address != address and address != None):
        current_user.address = address

    if (current_user.account_num != account_num and account_num):
        current_user.account_num = account_num

    if (current_user.ifsc != ifsc and ifsc):
        current_user.ifsc = ifsc

    db.commit()
    db.refresh(current_user)
    return current_user

class FirebaseTokenRequest(BaseModel):
    id_token: str
    role: str 
    name: str | None = None

@router.post("/firebase-login")
def login_with_firebase(
    authorization: str = Header(
        ..., description="Bearer token sent automatically by app"
    ),
    phone_number: str = Query(..., description="10-digit mobile number"),
    role: str = Query(
        ..., description="Role selected on app"
    ),
    address: str | None = Query(None, description="Physical address"),
    name: str | None = Query(None , description="User Full Name"),
    db: Session = Depends(get_db)
):

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization header must start with 'Bearer '"
        )

    id_token = authorization.split("Bearer ")[1]
    
    try:
        decoded_token = auth.verify_id_token(id_token)
        firebase_phone = decoded_token.get("phone_number")

        if not firebase_phone:
            raise ValueError("No phone number found in token.")

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase Token : {str(e)}"
        )

    clean_name = name.strip() if name and name.strip() else None
    if clean_name in ("null", "undefined", ""):
        clean_name = None

    clean_address = address.strip() if address and address.strip() else None
    if clean_address in ("null", "undefined", ""):
        clean_address = None

    clean_phone = firebase_phone.replace("+91", "").strip()[-10:]

    user = db.query(User).filter(User.phone == clean_phone).first()

    if user:
        if clean_name and (not user.name or user.name.startswith("User_") or user.name == "User"):
            user.name = clean_name
            db.commit()
            db.refresh(user)
        if clean_address and not user.address:
            user.address = clean_address
            db.commit()
            db.refresh(user)

        role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
        access_token = create_access_token(data={"sub": user.phone, "uid": user.uid, "role": role_str})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.uid,
            "name": user.name,
            "phone": user.phone,
            "role": user.role,
            "address": user.address,
            "is_new_user": False
        }

    user = User(
        name=clean_name or "User",
        phone=clean_phone,
        role=role,
        address=clean_address,
        hashed_password="FIREBASE_EXTERNAL_AUTH",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
    access_token = create_access_token(data={"sub": user.phone, "uid": user.uid, "role": role_str})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_uid": user.uid,
        "user_id": user.uid,
        "name": user.name,
        "phone": user.phone,
        "role": user.role,
        "address": user.address,
        "is_new_user": True
    }