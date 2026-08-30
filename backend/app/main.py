from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from app.api.v1.router import api_router
from app.config import settings
from pathlib import Path

app = FastAPI(
    title= settings.PROJECT_NAME,
    version = "1.0.0",
    description=(
        "Backend API for SIH 2026 Farm Direct - Intelligence Layer & Marketplace"
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(api_router , prefix="/api/v1")

@app.get("/")
def root():
    return {
        "message":"Welcome to Farm Direct API!"
    }

BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_PATH = BASE_DIR / "frontend" / "deliveryapp.html"

@app.get("/delivery", response_class=HTMLResponse)
def serve_delivery_app():
    return FileResponse(FRONTEND_PATH)