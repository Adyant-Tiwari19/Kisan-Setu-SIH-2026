from app.database import get_db
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserResponse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter()

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

    user = User(
        name = user_in.name,
        phone= user_in.phone,
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