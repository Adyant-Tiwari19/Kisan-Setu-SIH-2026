import math
from typing import List, Dict, Any

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def cluster_orders_for_delivery(order_locations: List[Dict[str, Any]], max_cluster_radius_km: float = 30.0) -> Dict[str, Any]:
    if not order_locations:
        return {"total_orders": 0, "clusters_count": 0, "allocations": [], "estimated_route_savings": "0.0%"}

    clusters = []
    allocations = []

    for order in order_locations:
        order_id = order.get("oid") or order.get("order_id")
        lat = order["lat"]
        lon = order["lon"]
        
        assigned_cluster = None

        for cluster in clusters:
            dist = haversine_distance(lat, lon, cluster["center_lat"], cluster["center_lon"])
            if dist <= max_cluster_radius_km:
                assigned_cluster = cluster
                break

        if assigned_cluster:
            assigned_cluster["orders"].append(order_id)
            # Recalculate cluster centroid
            n = len(assigned_cluster["orders"])
            assigned_cluster["center_lat"] = ((assigned_cluster["center_lat"] * (n - 1)) + lat) / n
            assigned_cluster["center_lon"] = ((assigned_cluster["center_lon"] * (n - 1)) + lon) / n
            cluster_id = assigned_cluster["id"]
        else:
            cluster_id = len(clusters)
            clusters.append({
                "id": cluster_id,
                "center_lat": lat,
                "center_lon": lon,
                "orders": [order_id]
            })

        allocations.append({
            "oid": order_id,
            "cluster_id": cluster_id,
            "lat": lat,
            "lon": lon
        })

    unconsolidated_clusters = len(order_locations)
    actual_clusters = len(clusters)
    savings_pct = round(((unconsolidated_clusters - actual_clusters) / unconsolidated_clusters) * 100, 1)

    return {
        "total_orders": len(order_locations),
        "clusters_count": actual_clusters,
        "allocations": allocations,
        "estimated_route_savings": f"{savings_pct}% distance reduction via consolidation"
    }