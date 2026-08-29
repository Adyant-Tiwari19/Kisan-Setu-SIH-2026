from typing import Dict,List
import numpy as np
from sklearn.cluster import DBSCAN

def cluster_orders_for_delivery(
    order_locations: List[Dict[str, float]],
    eps_km: float = 10.0
) -> Dict:
    if not order_locations:
        return {
            "total_orders": 0,
            "cluster_count": 0,
            "allocations": [],
            "estimated_route_savings": "0%"
        }

    coords = np.array([[loc["lat"], loc["lon"]] for loc in order_locations])
    coords_km = coords * 111.0

    clustering = DBSCAN(eps=eps_km, min_samples=1).fit(coords_km)

    allocations = []
    for idx,label in enumerate(clustering.labels_):
        item = order_locations[idx]
        allocations.append({
            "oid": item.get("oid", item.get("order_id", idx+1)),
            "cluster_id": int(label),
            "lat": item["lat"],
            "lon": item["lon"]
        })

    total_clusters = len(set(clustering.labels_))
    total_orders = len(order_locations)

    savings_pct = (
        0
        if total_orders == 0
        else round(((total_orders - total_clusters) / total_orders) * 100 , 1)
    )

    return {
        "total_orders": total_orders,
        "clusters_count": total_clusters,
        "allocations": allocations,
        "estimated_route_savings": f"{savings_pct}% distance reduction via consolidation"
    }