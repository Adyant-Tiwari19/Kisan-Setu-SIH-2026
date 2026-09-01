/**
 * Fresh Ferme - Listing Service
 * Communicates with FastAPI /api/v1/listings endpoints for crop catalog & produce inventory.
 */

import { apiClient } from './apiClient'

export interface Crop {
  cid: number
  name: string
  aliases?: string[]
  sample_img_url?: string
}

export interface Listing {
  lid: number
  fid: number
  cid: number
  crop_name?: string
  farmer_name?: string
  origin?: string
  quantity_available: number
  price_per_unit: number
  listing_type?: string
  harvested_at: string
  expiry_date: string
  is_active: boolean
  distance_km?: number
  estimated_landed_price?: number
  freshness_score?: number
  trust_score?: number
  badge?: string
}

export interface ListingCreatePayload {
  cid?: number
  crop_name?: string
  quantity_available: number
  price_per_unit: number
  listing_type?: string
  harvested_at?: string
  expiry_date?: string
  lat?: number
  lon?: number
}

export interface InventoryUpdatePayload {
  add_quantity: number
  price_per_unit?: number
  is_active?: boolean
}

// Fallback catalog if backend is not running
const MOCK_CROPS: Crop[] = [
  { cid: 1, name: 'Tomato', aliases: ['tomatoes', 'tamatar'] },
  { cid: 2, name: 'Onion', aliases: ['onions', 'pyaz'] },
  { cid: 3, name: 'Potato', aliases: ['potatoes', 'aloo'] },
  { cid: 4, name: 'Banana', aliases: ['bananas', 'kela'] },
  { cid: 5, name: 'Rice', aliases: ['paddy', 'chawal'] },
]

const MOCK_LISTINGS: Listing[] = [
  {
    lid: 101,
    fid: 1,
    cid: 1,
    crop_name: 'Tomatoes',
    farmer_name: 'Green Valley FPO',
    origin: 'Nashik',
    quantity_available: 180,
    price_per_unit: 38,
    listing_type: 'Grade A Hybrid',
    harvested_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    expiry_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    is_active: true,
    distance_km: 4.8,
    estimated_landed_price: 52,
    freshness_score: 96,
    trust_score: 4.9,
    badge: 'Best value',
  },
  {
    lid: 102,
    fid: 2,
    cid: 4,
    crop_name: 'Bananas',
    farmer_name: 'Sundaram Farms',
    origin: 'Coimbatore',
    quantity_available: 240,
    price_per_unit: 28,
    listing_type: 'G9 Cavendish',
    harvested_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    expiry_date: new Date(Date.now() + 4 * 86400000).toISOString(),
    is_active: true,
    distance_km: 7.2,
    estimated_landed_price: 39,
    freshness_score: 94,
    trust_score: 4.8,
    badge: 'Freshest',
  },
  {
    lid: 103,
    fid: 3,
    cid: 5,
    crop_name: 'Rice',
    farmer_name: 'Aaranya Collective',
    origin: 'Kurnool',
    quantity_available: 410,
    price_per_unit: 24,
    listing_type: 'Sona Masoori Single Polish',
    harvested_at: new Date().toISOString(),
    expiry_date: new Date(Date.now() + 90 * 86400000).toISOString(),
    is_active: true,
    distance_km: 12.4,
    estimated_landed_price: 32,
    freshness_score: 92,
    trust_score: 4.7,
    badge: 'Cheapest',
  },
]

class ListingService {
  /**
   * Get all registered crops in the catalog
   */
  async getCrops(): Promise<Crop[]> {
    try {
      return await apiClient.get<Crop[]>('/listings/crops')
    } catch {
      return MOCK_CROPS
    }
  }

  /**
   * Get all active listings across marketplace
   */
  async getAllListings(cropName?: string): Promise<Listing[]> {
    try {
      const endpoint = cropName ? `/listings/?crop_name=${encodeURIComponent(cropName)}` : '/listings/'
      const res = await apiClient.get<Listing[]>(endpoint)
      if (Array.isArray(res)) return res
    } catch {
      // Backend offline
    }

    if (cropName) {
      return MOCK_LISTINGS.filter((l) =>
        l.crop_name?.toLowerCase().includes(cropName.toLowerCase())
      )
    }
    return MOCK_LISTINGS
  }

  /**
   * Get listings created specifically by the authenticated farmer
   */
  async getMyListings(): Promise<Listing[]> {
    try {
      const res = await apiClient.get<Listing[]>('/listings/my-listings')
      if (Array.isArray(res)) return res
    } catch {
      // Backend offline
    }
    return []
  }

  /**
   * Spatial search by crop name, coordinates, and maximum radius (km)
   */
  async searchListings(
    cropName: string,
    buyerLat = 19.9975,
    buyerLon = 73.7898,
    maxDistanceKm = 50.0
  ): Promise<Listing[]> {
    try {
      const params = new URLSearchParams({
        crop_name: cropName,
        buyer_lat: buyerLat.toString(),
        buyer_lon: buyerLon.toString(),
        max_distance_km: maxDistanceKm.toString(),
      })
      const results = await apiClient.get<Listing[]>(`/listings/search?${params.toString()}`)
      if (results && results.length > 0) return results
    } catch {
      // Fallback
    }

    return MOCK_LISTINGS.filter(
      (l) => !cropName || l.crop_name?.toLowerCase().includes(cropName.toLowerCase())
    )
  }

  /**
   * Create a new produce listing (Farmer)
   */
  async createListing(data: ListingCreatePayload): Promise<Listing> {
    try {
      return await apiClient.post<Listing>('/listings/', data)
    } catch (err: any) {
      console.warn('[ListingService] Backend offline - creating simulated listing')
      const mockListing: Listing = {
        lid: Date.now(),
        fid: 1,
        cid: data.cid || 1,
        crop_name: data.crop_name || 'Produce',
        farmer_name: 'My Farm',
        origin: 'Local Harvest',
        quantity_available: data.quantity_available,
        price_per_unit: data.price_per_unit,
        listing_type: data.listing_type || 'Standard',
        harvested_at: data.harvested_at || new Date().toISOString(),
        expiry_date: data.expiry_date || new Date(Date.now() + 5 * 86400000).toISOString(),
        is_active: true,
        freshness_score: 95,
        trust_score: 4.9,
      }
      return mockListing
    }
  }

  /**
   * Restock or edit inventory
   */
  async restockInventory(lid: number, payload: InventoryUpdatePayload): Promise<Listing> {
    return apiClient.patch<Listing>(`/listings/${lid}/inventory`, payload)
  }

  /**
   * Take down or reactivate a listing
   */
  async toggleListingActive(lid: number): Promise<Listing> {
    try {
      return await apiClient.patch<Listing>(`/listings/${lid}/toggle-active`, {})
    } catch {
      // Offline fallback
      return { lid, is_active: false } as Listing
    }
  }

  /**
   * Delete a listing completely
   */
  async deleteListing(lid: number): Promise<{ success: boolean; message: string }> {
    try {
      return await apiClient.delete<{ success: boolean; message: string }>(`/listings/${lid}`)
    } catch {
      return { success: true, message: `Listing #${lid} deleted.` }
    }
  }
}

export const listingService = new ListingService()

