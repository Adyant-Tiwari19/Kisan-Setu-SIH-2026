/**
 * Kisan Setu - Order Service
 * Communicates with FastAPI /api/v1/orders endpoints.
 */

import { apiClient } from './apiClient'

export type OrderStatus =
  | 'placed'
  | 'clustered'
  | 'out_for_delivery'
  | 'delivered'
  | 'disputed'
  | 'settled'

export interface Order {
  oid: number
  bid: number
  lid: number
  crop_name?: string
  farmer_name?: string
  buyer_name?: string
  quantity: number
  produce_price: number
  logistics_price: number
  landed_price: number
  status: OrderStatus
  rating?: number
  ordered_at: string
  delivered_at?: string
}

export interface PlaceOrderPayload {
  lid: number
  quantity: number
  bid?: number | string
}

export interface OrderEstimateItem {
  lid: number
  quantity: number
}

export interface OrderStatusUpdatePayload {
  status: OrderStatus
  dispute_reason?: string
}

export interface RateOrderPayload {
  rating: number
  feedback?: string
}

// Local mock storage for offline mode
const LOCAL_ORDERS_KEY = 'farm_direct_local_orders'

function getStoredLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return []
}

function saveStoredLocalOrders(orders: Order[]) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders))
  } catch {
    // ignore
  }
}

class OrderService {
  /**
   * Place a new purchase order
   */
  async placeOrder(payload: PlaceOrderPayload): Promise<Order> {
    try {
      const order = await apiClient.post<Order>('/orders/', payload)
      return order
    } catch {
      console.warn('[OrderService] Backend offline - placing order in simulated session.')
      const producePrice = payload.quantity * 35
      const logisticsPrice = round(payload.quantity * 1.5, 2)
      const mockOrder: Order = {
        oid: Math.floor(Math.random() * 9000) + 1000,
        bid: payload.bid && Number.isFinite(Number(payload.bid)) ? Number(payload.bid) : 1,
        lid: payload.lid,
        quantity: payload.quantity,
        produce_price: producePrice,
        logistics_price: logisticsPrice,
        landed_price: producePrice + logisticsPrice,
        status: 'placed',
        ordered_at: new Date().toISOString(),
      }
      const existing = getStoredLocalOrders()
      saveStoredLocalOrders([mockOrder, ...existing])
      return mockOrder
    }
  }

  async estimateLogistics(items: OrderEstimateItem[]): Promise<number> {
    const response = await apiClient.post<{ logistics_price: number }>('/orders/estimate', { items })
    return response.logistics_price
  }

  /**
   * Get orders relevant to the current user (as buyer or farmer)
   */
  async getMyOrders(): Promise<Order[]> {
    try {
      const orders = await apiClient.get<Order[]>('/orders/my-orders')
      if (Array.isArray(orders)) return orders
    } catch {
      // Backend offline
    }
    return getStoredLocalOrders()
  }

  /**
   * Track order lifecycle & delivery timeline
   */
  async trackOrder(oid: number): Promise<Order> {
    try {
      return await apiClient.get<Order>(`/orders/${oid}/track`)
    } catch {
      const all = getStoredLocalOrders()
      const found = all.find((o) => o.oid === oid)
      if (found) return found
      throw new Error(`Order #${oid} not found`)
    }
  }

  /**
   * Update order status (Confirm, Cluster, Deliver, Settle, Dispute)
   */
  async updateOrderStatus(oid: number, payload: OrderStatusUpdatePayload): Promise<Order> {
    try {
      return await apiClient.patch<Order>(`/orders/${oid}/status`, payload)
    } catch {
      const all = getStoredLocalOrders()
      const updated = all.map((o) => (o.oid === oid ? { ...o, status: payload.status } : o))
      saveStoredLocalOrders(updated)
      return updated.find((o) => o.oid === oid) as Order
    }
  }

  /**
   * Rate fulfilled order and farmer reliability score
   */
  async rateOrder(oid: number, rating: number, feedback?: string): Promise<Order> {
    try {
      return await apiClient.post<Order>(`/orders/${oid}/rate`, { rating, feedback })
    } catch {
      const all = getStoredLocalOrders()
      const updated = all.map((o) => (o.oid === oid ? { ...o, rating } : o))
      saveStoredLocalOrders(updated)
      return updated.find((o) => o.oid === oid) as Order
    }
  }
}

function round(val: number, decimals: number): number {
  return Number(Math.round(Number(val + 'e' + decimals)) + 'e-' + decimals)
}

export const orderService = new OrderService()
