/**
 * Kisan Setu - AI & Optimization Service
 * Communicates with FastAPI /api/v1/ai endpoints for seller ranking & cluster route optimization.
 */

import { apiClient } from './apiClient'

export interface SellerScoreBreakdown {
  lid: number
  fid: number
  cid: number
  crop_name?: string
  farmer_name?: string
  quantity_available?: number
  price_per_unit: number
  estimated_landed_price: number
  distance_km: number
  harvest_age_hours: number
  ai_score: number
  transparency_reasons?: {
    price_factor?: number
    distance_factor?: number
    freshness_factor?: number
    summary?: string
  }
}

export interface AiMatchCard {
  name: string
  landed: string
  distance: string
  freshness: string
  reliability: string
  recommendation: string
  value: string
  score: number
  lid?: number
  quantity_available?: number
  crop_name?: string
}

export interface DemandForecast {
  crop_id: number
  crop_name: string
  location: {
    latitude: number
    longitude: number
  }
  search_radius_km: number
  current_active_supply_kg: number
  avg_market_price: number
  predicted_demand_kg: number
  supply_gap_kg: number
  model_status: string
}

class AiService {
  /**
   * AI Multi-Factor Seller Ranking Engine
   * Evaluates produce price, distance, and harvest freshness
   */
  async rankSellers(
    cropName: string,
    buyerLat = 19.9975,
    buyerLon = 73.7898
  ): Promise<SellerScoreBreakdown[]> {
    try {
      const results = await apiClient.post<SellerScoreBreakdown[]>('/ai/rank-sellers', {
        crop_name: cropName,
        buyer_lat: buyerLat,
        buyer_lon: buyerLon,
      })
      if (results && results.length > 0) return results
    } catch {
      // Backend offline
    }

    return []
  }

  /**
   * Converts raw ranking data to UI-friendly bulk buyer cards
   */
  async getAiBuyerMatches(cropName = 'Tomato'): Promise<AiMatchCard[]> {
    const rawScores = await this.rankSellers(cropName)
    if (rawScores.length === 0) return []

    return rawScores.map((item, idx) => {
      const supplierName = item.farmer_name || `Verified Producer #${item.fid}`
      const isTop = idx === 0
      const isSecond = idx === 1

      return {
        name: supplierName,
        landed: `₹${item.estimated_landed_price}/kg`,
        distance: `${item.distance_km} km away`,
        freshness: item.harvest_age_hours < 8 ? 'Harvested today' : `${Math.round(item.harvest_age_hours)}h since harvest`,
        reliability: `${Math.round(item.ai_score)}% AI score`,
        recommendation: isTop
          ? 'Best value delivered rate'
          : isSecond
          ? 'Export quality grading'
          : 'Nearest transit hub',
        value: isTop ? 'Best fit' : isSecond ? 'Preferred' : 'Fastest',
        score: item.ai_score,
        lid: item.lid,
        quantity_available: item.quantity_available,
        crop_name: item.crop_name,
      }
    })
  }

  /**
   * Cluster routes for delivery optimization
   */
  async optimizeRoutes(orders: Array<{ lat: number; lon: number; [key: string]: any }>) {
    try {
      return await apiClient.post('/ai/optimize-routes', { orders })
    } catch {
      return { clusters: [{ cluster_id: 1, orders }] }
    }
  }

  async predictDemand(cropId: number): Promise<DemandForecast | null> {
    try {
      const params = new URLSearchParams({ crop_id: String(cropId) })
      return await apiClient.post<DemandForecast>(`/ai/predict-demand?${params.toString()}`)
    } catch {
      return null
    }
  }
}

export const aiService = new AiService()
