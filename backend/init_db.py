from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url
from app.config import settings
from app.database import Base, engine, ensure_database_and_tables
from app.models.listing import Crop, Listing
from app.models.order import Order
from app.models.user import User

def create_tables():
    print("Ensuring database and PostGIS extension...")
    ensure_database_and_tables()
    print("Database tables initialized successfully!")

if __name__ == "__main__":
    create_tables()