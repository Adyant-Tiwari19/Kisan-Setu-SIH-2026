from fastapi import APIRouter
from app.api.v1.endpoints import ai_services , auth , listings, orders, users

api_router = APIRouter()
api_router.include_router(auth.router , prefix="/auth", tags = ["Authentication"])
api_router.include_router(
    listings.router, prefix="/listings", tags=["Listings"]
)
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(
    ai_services.router , prefix="/ai", tags=["AI & Optimization"]
)
api_router.include_router(users.router, prefix="/dashboard", tags=["Dashboard"])