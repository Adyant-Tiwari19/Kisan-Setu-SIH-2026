from typing import Dict, List
import math

def cluster_orders_for_delivery(
    order_locations: List[Dict[str, float]],
    eps_km: float = 10.0
) -> Dict:
    if not order_locations:
        return {
            "total_orders": 0,
            "clusters_count": 0,
            "allocations": [],
            "estimated_route_savings": "0%"
        }

    # Try scikit-learn DBSCAN if installed, otherwise pure Python clustering
    try:
        import numpy as np
        from sklearn.cluster import DBSCAN
        coords = np.array([[loc["lat"], loc["lon"]] for loc in order_locations])
        coords_km = coords * 111.0
        clustering = DBSCAN(eps=eps_km, min_samples=1).fit(coords_km)
        labels = [int(lbl) for lbl in clustering.labels_]
    except Exception:
        # Pure Python greedy distance clustering (zero external compilation dependencies)
        labels = [-1] * len(order_locations)
        cluster_id = 0
        for i, loc1 in enumerate(order_locations):
            if labels[i] != -1:
                continue
            labels[i] = cluster_id
            for j, loc2 in enumerate(order_locations):
                if labels[j] == -1:
                    d_lat = (loc1["lat"] - loc2["lat"]) * 111.0
                    d_lon = (loc1["lon"] - loc2["lon"]) * 111.0
                    dist = math.sqrt(d_lat * d_lat + d_lon * d_lon)
                    if dist <= eps_km:
                        labels[j] = cluster_id
            cluster_id += 1

    allocations = []
    for idx, label in enumerate(labels):
        item = order_locations[idx]
        allocations.append({
            "oid": item.get("oid", item.get("order_id", idx + 1)),
            "cluster_id": label,
            "lat": item["lat"],
            "lon": item["lon"]
        })

    total_clusters = len(set(labels))
    total_orders = len(order_locations)

    savings_pct = (
        0
        if total_orders == 0
        else round(((total_orders - total_clusters) / total_orders) * 100, 1)
    )

    return {
        "total_orders": total_orders,
        "clusters_count": total_clusters,
        "allocations": allocations,
        "estimated_route_savings": f"{savings_pct}% distance reduction via consolidation"
    }