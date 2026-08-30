/**
 * Fresh Ferme - Dashboard Service
 * Communicates with FastAPI /api/v1/dashboard endpoints for farmer income & escrow metrics.
 */

import { apiClient } from './apiClient'

export interface RecentPayout {
  oid: number
  crop_name?: string
  quantity_sold: number
  amount_earned: number
  settled_at?: string
}

export interface FarmerIncomeDashboard {
  total_earnings: number
  pending_escrow: number
  total_quantity_sold: number
  total_completed_orders: number
  reliability_score: number
  recent_payouts: RecentPayout[]
}

const DEFAULT_FARMER_DASHBOARD: FarmerIncomeDashboard = {
  total_earnings: 0,
  pending_escrow: 0,
  total_quantity_sold: 0,
  total_completed_orders: 0,
  reliability_score: 0.95,
  recent_payouts: [],
}

class DashboardService {
  /**
   * Fetch authenticated Farmer dashboard stats & earnings
   */
  async getFarmerDashboard(): Promise<FarmerIncomeDashboard> {
    try {
      const data = await apiClient.get<FarmerIncomeDashboard>('/dashboard/farmer-dashboard')
      if (data) return data
    } catch {
      // Backend offline or user is new
    }
    return DEFAULT_FARMER_DASHBOARD
  }
}

export const dashboardService = new DashboardService()
