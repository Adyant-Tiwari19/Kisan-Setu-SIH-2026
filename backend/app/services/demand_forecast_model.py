import os
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

np.random.seed(42)
n_samples = 3000

data = {
    'crop_id': np.random.randint(1, 51, size=n_samples),
    'latitude': np.random.uniform(28.40, 28.80, size=n_samples),
    'longitude': np.random.uniform(76.90, 77.30, size=n_samples),
    'day_of_week': np.random.randint(0, 7, size=n_samples),
    'month': np.random.randint(1, 13, size=n_samples),
    'historical_demand_7d_avg': np.random.uniform(100, 2000, size=n_samples),
    'local_active_supply_kg': np.random.uniform(50, 1500, size=n_samples),
    'avg_price_per_unit': np.random.uniform(15, 80, size=n_samples),
}

df = pd.DataFrame(data)

df['predicted_demand_kg'] = (
    (df['historical_demand_7d_avg'] * 0.8) +
    (df['day_of_week'].isin([5, 6]) * 150) -
    (df['avg_price_per_unit'] * 1.5) +
    np.random.normal(0, 25, size=n_samples)
)

X = df.drop(columns=['predicted_demand_kg'])
y = df['predicted_demand_kg']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)


model = XGBRegressor(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_alpha=0.1,
    reg_lambda=1.0,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)


preds = model.predict(X_test)
print(f"XGBoost MAE: {mean_absolute_error(y_test, preds):.2f} kg")
print(f"XGBoost R2 Score: {r2_score(y_test, preds):.2f}")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

os.makedirs(MODELS_DIR, exist_ok=True)

model_path = os.path.join(MODELS_DIR, "demand_forecaster.pkl")
joblib.dump(model, model_path)

print(f"Model successfully saved to: {model_path}")