from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine.url import make_url
from app.config import settings

Base = declarative_base()

def ensure_database_and_tables():
    db_url = settings.DATABASE_URL
    if "postgresql" in db_url:
        try:
            url_obj = make_url(db_url)
            target_db = url_obj.database or "farm_direct"
            
            # Connect to default postgres db to ensure target database exists
            root_url = url_obj.set(database="postgres")
            root_engine = create_engine(root_url, isolation_level="AUTOCOMMIT")
            
            with root_engine.connect() as conn:
                exists = conn.execute(
                    text("SELECT 1 FROM pg_database WHERE datname = :dbname"),
                    {"dbname": target_db}
                ).scalar()
                if not exists:
                    print(f"\n[Database Init] Creating missing database '{target_db}'...")
                    conn.execute(text(f'CREATE DATABASE "{target_db}"'))
                    print(f"[Database Init] Database '{target_db}' created successfully!\n")
            root_engine.dispose()
        except Exception as e:
            print(f"[Database Notice] ensure_database: {e}")

    # Initialize tables
    try:
        target_engine = create_engine(db_url)
        with target_engine.connect() as conn:
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.commit()
            except Exception:
                pass
        
        # Import models so Base.metadata knows about them
        from app.models.user import User
        from app.models.listing import Crop, Listing
        from app.models.order import Order
        Base.metadata.create_all(bind=target_engine)
        print("[Database Init] Tables initialized successfully!")
    except Exception as e:
        print(f"[Database Notice] table_init: {e}")

try:
    ensure_database_and_tables()
except Exception as e:
    print(f"[Database Notice] {e}")

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()