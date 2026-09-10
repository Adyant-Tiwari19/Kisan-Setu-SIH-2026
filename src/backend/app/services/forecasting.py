import os
import joblib
import pandas as pd
from typing import Dict, Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "demand_forecaster.pkl")

class DemandForecasterService:
    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                print(f"[FORECAST SERVICE] Successfully loaded XGBoost model from {MODEL_PATH}")
            except Exception as e:
                print(f"[FORECAST SERVICE ERROR] Failed to load model: {str(e)}")
                self.model = None
        else:
            print(f"[FORECAST SERVICE WARNING] Model file missing at {MODEL_PATH}. Operating in fallback mode.")

    def predict_demand(
        self,
        crop_id: int,
        latitude: float,
        longitude: float,
        day_of_week: int,
        month: int,
        historical_demand_7d_avg: float,
        local_active_supply_kg: float,
        avg_price_per_unit: float
    ) -> Dict[str, Any]:
        if not self.model:
            return {
                "predicted_demand_kg": max(0.0, round(float(historical_demand_7d_avg), 2)),
                "status": "fallback_no_model"
            }

        input_df = pd.DataFrame([{
            'crop_id': crop_id,
            'latitude': latitude,
            'longitude': longitude,
            'day_of_week': day_of_week,
            'month': month,
            'historical_demand_7d_avg': historical_demand_7d_avg,
            'local_active_supply_kg': local_active_supply_kg,
            'avg_price_per_unit': avg_price_per_unit
        }])

        try:
            raw_prediction = float(self.model.predict(input_df)[0])
            predicted_demand = max(0.0, round(raw_prediction, 2))
            return {
                "predicted_demand_kg": predicted_demand,
                "status": "success"
            }
        except Exception as e:
            return {
                "predicted_demand_kg": max(0.0, round(float(historical_demand_7d_avg), 2)),
                "status": f"error: {str(e)}"
            }

demand_forecaster = DemandForecasterService()