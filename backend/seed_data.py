"""
Farm-Direct Database Seed Script
Populates initial Crops, Users, and Sample Listings.
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from app.database import Base, SessionLocal, engine
from app.models.listing import Crop, Listing
from app.models.user import User, UserRole
from app.api.v1.endpoints.auth import get_password_hash
from geoalchemy2.functions import ST_MakePoint, ST_SetSRID

def seed():
    print("Starting database seeding...")
    db = SessionLocal()
    try:
        # Create extension if Postgres
        try:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.commit()
        except Exception as e:
            print(f"Notice (PostGIS): {e}")

        Base.metadata.create_all(bind=engine)

        # 1. Seed Crops
        crop_data = [
            {"name": "Tomato", "aliases": ["tomatoes", "tamatar"], "sample_img_url": "/crops/tomato.jpg"},
            {"name": "Onion", "aliases": ["onions", "pyaz"], "sample_img_url": "/crops/onion.jpg"},
            {"name": "Potato", "aliases": ["potatoes", "aloo"], "sample_img_url": "/crops/potato.jpg"},
            {"name": "Banana", "aliases": ["bananas", "kela"], "sample_img_url": "/crops/banana.jpg"},
            {"name": "Rice", "aliases": ["paddy", "chawal"], "sample_img_url": "/crops/rice.jpg"},
            {"name": "Chili", "aliases": ["green chili", "mirchi"], "sample_img_url": "/crops/chili.jpg"},
        ]

        crops = {}
        for item in crop_data:
            existing = db.query(Crop).filter(Crop.name == item["name"]).first()
            if not existing:
                c = Crop(name=item["name"], aliases=item["aliases"], sample_img_url=item["sample_img_url"])
                db.add(c)
                db.flush()
                crops[item["name"]] = c.cid
            else:
                crops[item["name"]] = existing.cid

        # 2. Seed Users
        users_data = [
            {
                "name": "Ravi Kumar (Farmer)",
                "phone": "9845012345",
                "password": "password123",
                "role": UserRole.FARMER_FPO,
                "address": "Nashik Agri Valley",
                "pincode": "422001",
                "reliability_score": 0.96
            },
            {
                "name": "Priya Sharma (Retailer)",
                "phone": "9876543210",
                "password": "password123",
                "role": UserRole.RETAIL_BUYER,
                "address": "Indiranagar, Bengaluru",
                "pincode": "560038",
                "reliability_score": 0.94
            },
            {
                "name": "Metro Agro Procurements (Bulk Buyer)",
                "phone": "9765432100",
                "password": "password123",
                "role": UserRole.BULK_BUYER,
                "address": "Kurnool Cold Logistics Hub",
                "pincode": "518001",
                "reliability_score": 0.98
            },
        ]

        farmer_uid = None
        retailer_uid = None
        buyer_uid = None
        for u_data in users_data:
            user = db.query(User).filter(User.phone == u_data["phone"]).first()
            if not user:
                user = User(
                    name=u_data["name"],
                    phone=u_data["phone"],
                    hashed_password=get_password_hash(u_data["password"]),
                    role=u_data["role"],
                    address=u_data["address"],
                    pincode=u_data["pincode"],
                    reliability_score=u_data["reliability_score"]
                )
                db.add(user)
                db.flush()
            if u_data["role"] == UserRole.FARMER_FPO:
                farmer_uid = user.uid
            elif u_data["role"] == UserRole.RETAIL_BUYER:
                retailer_uid = user.uid
            elif u_data["role"] == UserRole.BULK_BUYER:
                buyer_uid = user.uid

        # 3. Seed Sample Produce Listings
        created_listings = []
        if farmer_uid:
            sample_listings = [
                {"cid": crops.get("Tomato", 1), "qty": 1500.0, "price": 32.0, "lat": 19.9975, "lon": 73.7898, "type": "Hybrid Grade A"},
                {"cid": crops.get("Tomato", 1), "qty": 800.0, "price": 35.0, "lat": 20.0120, "lon": 73.8150, "type": "Export Selection"},
                {"cid": crops.get("Banana", 4), "qty": 1200.0, "price": 28.0, "lat": 11.0168, "lon": 76.9558, "type": "Fresh G9 Harvest"},
                {"cid": crops.get("Rice", 5), "qty": 2500.0, "price": 24.0, "lat": 15.8281, "lon": 78.0373, "type": "Organic Sona Masoori"},
                {"cid": crops.get("Onion", 2), "qty": 1800.0, "price": 22.0, "lat": 20.0110, "lon": 73.8010, "type": "Nashik Red Export Grade"},
                {"cid": crops.get("Potato", 3), "qty": 1400.0, "price": 20.0, "lat": 18.5204, "lon": 73.8567, "type": "Grade A Jyoti"},
            ]
            now = datetime.now(timezone.utc)
            for sl in sample_listings:
                existing_l = db.query(Listing).filter(Listing.fid == farmer_uid, Listing.cid == sl["cid"], Listing.listing_type == sl["type"]).first()
                if not existing_l:
                    listing = Listing(
                        fid=farmer_uid,
                        cid=sl["cid"],
                        quantity_available=sl["qty"],
                        price_per_unit=sl["price"],
                        listing_type=sl["type"],
                        harvested_at=now - timedelta(hours=3),
                        expiry_date=now + timedelta(days=6),
                        location=ST_SetSRID(ST_MakePoint(sl["lon"], sl["lat"]), 4326),
                        is_active=True
                    )
                    db.add(listing)
                    db.flush()
                    created_listings.append(listing)
                else:
                    existing_l.quantity_available = max(existing_l.quantity_available, sl["qty"])
                    existing_l.is_active = True
                    created_listings.append(existing_l)

        # 4. Seed Sample Orders (Connecting Sample Farmer, Retailer, and Bulk Buyer)
        if created_listings and retailer_uid and buyer_uid:
            from app.models.order import Order, OrderStatus
            existing_orders = db.query(Order).filter((Order.bid == retailer_uid) | (Order.bid == buyer_uid)).all()
            if not existing_orders:
                now = datetime.now(timezone.utc)
                # Order 1: Retailer purchase (Settled payout for farmer)
                o1 = Order(
                    bid=retailer_uid,
                    lid=created_listings[0].lid,
                    quantity=120.0,
                    produce_price=120.0 * created_listings[0].price_per_unit,
                    logistics_price=180.0,
                    landed_price=(120.0 * created_listings[0].price_per_unit) + 180.0,
                    status=OrderStatus.SETTLED,
                    ordered_at=now - timedelta(days=2),
                    delivered_at=now - timedelta(days=1)
                )
                # Order 2: Retailer purchase (In transit)
                o2 = Order(
                    bid=retailer_uid,
                    lid=created_listings[1].lid if len(created_listings) > 1 else created_listings[0].lid,
                    quantity=80.0,
                    produce_price=80.0 * 28.0,
                    logistics_price=120.0,
                    landed_price=(80.0 * 28.0) + 120.0,
                    status=OrderStatus.OUT_FOR_DELIVERY,
                    ordered_at=now - timedelta(hours=5)
                )
                # Order 3: Bulk Buyer purchase (Clustered)
                o3 = Order(
                    bid=buyer_uid,
                    lid=created_listings[2].lid if len(created_listings) > 2 else created_listings[0].lid,
                    quantity=400.0,
                    produce_price=400.0 * 24.0,
                    logistics_price=600.0,
                    landed_price=(400.0 * 24.0) + 600.0,
                    status=OrderStatus.CLUSTERED,
                    ordered_at=now - timedelta(hours=8)
                )
                db.add_all([o1, o2, o3])

        db.commit()
        print("Database seeded successfully with test crops, users, listings, and demo sample orders!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
