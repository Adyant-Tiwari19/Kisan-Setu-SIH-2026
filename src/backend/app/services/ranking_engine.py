from typing import Dict, List
def calculate_seller_score(
    landed_price: float,
    min_price: float,
    max_price: float,
    distance_km: float,
    max_distance: float,
    hours_since_harvest: float,
    max_hours: float,
    reliability_score: float = 0.9,  ##Giving a default rating of 90% trust
    quality_score: float = 0.85,
    preference_match: float = 1.0
) -> Dict:

    price_denom = (max_price - min_price) if (max_price - min_price) > 0 else 1.0
    price_score = 1.0 - ((landed_price - min_price) / price_denom)

    dist_denom = max_distance if max_distance > 0 else 1.0
    distance_score = 1.0 - (distance_km/dist_denom)

    hours_denom = max_hours if max_hours > 0 else 1.0
    freshness_score = 1.0 - (hours_since_harvest/ hours_denom)

    price_score = max(0.0, min(1.0, price_score))
    distance_score = max(0.0 , min(1.0 , distance_score))
    freshness_score = max(0.0 , min(1.0,freshness_score))

    total_score = (
        (0.30 * price_score)
        + (0.20 * distance_score)
        + (0.20 * freshness_score)
        + (0.15 * reliability_score)
        + (0.10 * quality_score)
        + (0.05 * preference_match)
    )

    reasons = []
    if landed_price <= min_price:
        reasons.append("Best Landed Price")
    if hours_since_harvest <= 12:
        reasons.append(f"Harvested {int(hours_since_harvest)}h ago")
    if distance_km <= 15:
        reasons.append(f"Nearby Farm ({round(distance_km , 1)} km)")

    return {
        "composite_score": round(total_score * 100 , 2),
        "price_score": round(price_score* 100 , 2),
        "distance_score": round(distance_score * 100, 2),
        "freshness_score": round(freshness_score * 100 , 2),
        "transparency_reasons": reasons
    }