from sqlalchemy import text
from app.database import Base, engine
from app.models.listing import Crop, Listing
from app.models.order import Order
from app.models.user import User


def create_tables():
  print("Enabling PostGIS extension and creating database tables...")
  with engine.connect() as connection:
    connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
    connection.commit()

  Base.metadata.create_all(bind=engine)
  print("All database tables created successfully with PostGIS support!")


if __name__ == "__main__":
  create_tables()