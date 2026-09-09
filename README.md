<div align="center">
	<img src="frontend/src/assets/logomain.png" alt="Kisan Setu logo" width="420" />
	<h1>Kisan Setu</h1>
	<p><strong>Connecting farmers directly with the people they serve.</strong></p>
	<p>A transparent digital marketplace for better agricultural trade.</p>
</div>

<p align="center">
	<img src="https://img.shields.io/badge/Farmer--first%20marketplace-4B7F3A?style=for-the-badge" alt="Farmer first marketplace" />
	<img src="https://img.shields.io/badge/Direct%20connections-C98B2E?style=for-the-badge" alt="Direct connections" />
	<img src="https://img.shields.io/badge/Web%20%2B%20Android-6B4F3A?style=for-the-badge" alt="Web and Android" />
</p>

## About

Kisan Setu is a digital agricultural marketplace that connects farmers directly with households, retailers, and bulk buyers. It helps reduce the distance between the people who grow food and the people who need it by making produce, pricing, availability, and seller information easier to discover.

Traditional supply chains can make it difficult for farmers to reach reliable markets and for buyers to verify the source, freshness, quantity, and price of produce. Kisan Setu provides a shared marketplace where farmers can present their products directly and buyers can make more informed purchasing decisions.

### Core capabilities

- **For farmers:** Create profiles, publish crop listings, update quantities and prices, and manage availability.
- **For buyers:** Discover produce, search by crop and location, compare sellers, add items to a cart, and place orders.
- **For the marketplace:** Support authentication, location-aware sourcing, seller ranking, delivery routing, and demand forecasting.

### Technology stack

- **Frontend:** React, TypeScript, Vite, React Router, Tailwind CSS, Framer Motion, and i18next
- **Backend:** Python, FastAPI, Pydantic, SQLAlchemy, and Uvicorn
- **Database:** PostgreSQL with PostGIS and GeoAlchemy2 for spatial data
- **Data and intelligence:** scikit-learn, XGBoost, Pandas, NumPy, and Joblib
- **Authentication:** JWT, OAuth2-compatible flows, Passlib, and bcrypt
- **Mobile:** Capacitor with Android support

## Repository structure

```text
Farm-Direct/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # Auth, listings, orders, users, AI, and location APIs
│   │   ├── models/             # Database models
│   │   ├── schemas/            # Pydantic request and response schemas
│   │   └── services/           # Forecasting, ranking, routing, and AI services
│   ├── init_db.py              # Database and table initialization
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # React UI components and dashboards
│   │   ├── services/            # API and domain services
│   │   └── context/             # Application state and authentication
│   ├── android/                # Capacitor Android project
│   ├── public/                 # Static assets and fonts
│   └── package.json
└── README.md
```

## Setup

### Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer and npm
- PostgreSQL with the PostGIS extension

### Backend

From the repository root:

```powershell
cd backend
python -m pip install -r requirements.txt
```


Initialize the database and start the API:

```powershell
python init_db.py
uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`. Interactive documentation is available at `/docs`.

### Frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Use the Vite URL shown in the terminal.
