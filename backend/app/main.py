from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from app.api.v1.router import api_router
from app.config import settings
from pathlib import Path
import os
import firebase_admin
from firebase_admin import credentials
import json

firebase_json_env = os.getenv("FIREBASE_CREDENTIALS_JSON")
if firebase_json_env:
    try:
        cred_dict = json.loads(firebase_json_env)
        cred = credentials.Certificate(cred_dict)
    except Exception as e:
        raise RuntimeError(f"Failed to parse FIREBASE_CREDENTIALS_JSON environment variable: {str(e)}")

else:
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "firebase-credentials.json")
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
    else:
        raise FileNotFoundError(
            f"Firebase credentials not found. Set FIREBASE_CREDENTIALS_JSON env var or place '{cred_path}' in the root directory."
        )

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

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