/**
 * Kisan Setu - Listing Service
 * Centralizes search requests and keeps the marketplace live-data mapping isolated.
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
  sample_img_url?: string | null
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

export interface MarketplaceListing {
  id: number | string
  farmer_id?: number | string | null
  sample_img_url?: string | null
  crop_name: string
  farmer_name: string
  farmer_address?: string | null
  farmer_phone?: string | null
  origin: string
  quantity_available: number | null
  price_per_unit: number | null
  estimated_landed_price: number | null
  distance_km: number | null
  freshness_score: number | null
  trust_score: number | null
  relevance_score: number | null
  listing_type: string
  harvested_at: string | null
  created_at?: string | null
  is_active: boolean
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

export interface SearchListingsParams {
  crop_name: string
  lat: number
  lon: number
  radius_km?: number
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

const toText = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number') return String(value)
  return 'Not available'
}

const toDateText = (value: unknown): string | null => {
  if (!value) return null
  const text = toText(value)
  if (text === 'Not available') return null
  return text
}

/**
 * TODO: replace this mapping as soon as the backend JSON contract is shared.
 * The backend search response may return a different field layout.
 */
export function mapSearchResponseItem(raw: Record<string, unknown>): MarketplaceListing {
  const idValue: string | number =
    typeof raw.id === 'string' || typeof raw.id === 'number'
      ? raw.id
      : typeof raw.lid === 'string' || typeof raw.lid === 'number'
        ? raw.lid
        : typeof raw.listing_id === 'string' || typeof raw.listing_id === 'number'
          ? raw.listing_id
          : typeof raw.listingId === 'string' || typeof raw.listingId === 'number'
            ? raw.listingId
            : typeof raw.uuid === 'string' || typeof raw.uuid === 'number'
              ? raw.uuid
              : typeof raw._id === 'string' || typeof raw._id === 'number'
                ? raw._id
                : 'not-available'

  const cropName =
    toText(raw.crop_name ?? raw.crop ?? raw.cropName ?? raw.name ?? raw.title)

  const farmerName =
    toText(raw.farmer_name ?? raw.farmerName ?? raw.farm_name ?? raw.seller_name ?? raw.sellerName)

  const originText =
    toText(raw.origin ?? raw.location ?? raw.area ?? raw.region ?? raw.city)

  return {
    id: idValue,
    farmer_id: toNumber(raw.fid ?? raw.farmer_id ?? raw.farmerId ?? raw.seller_id ?? raw.sellerId) ?? null,
    sample_img_url: typeof raw.sample_img_url === 'string' ? raw.sample_img_url : null,
    crop_name: cropName,
    farmer_name: farmerName,
    farmer_address: typeof raw.farmer_address === 'string' ? raw.farmer_address : null,
    farmer_phone: typeof raw.farmer_phone === 'string' ? raw.farmer_phone : null,
    origin: originText,
    quantity_available: toNumber(raw.quantity_available ?? raw.qty ?? raw.stock_kg ?? raw.available_quantity),
    price_per_unit: toNumber(raw.price_per_unit ?? raw.unit_price ?? raw.price_per_kg ?? raw.price),
    estimated_landed_price: toNumber(raw.estimated_landed_price ?? raw.delivered_price ?? raw.landed_price),
    distance_km: toNumber(raw.distance_km ?? raw.distance ?? raw.radius_km),
    freshness_score: toNumber(raw.freshness_score ?? raw.freshness ?? raw.freshness_pct),
    trust_score: toNumber(raw.trust_score ?? raw.trust ?? raw.rating),
    relevance_score: toNumber(raw.ai_score ?? raw.relevance_score ?? raw.relevance),
    listing_type: toText(raw.listing_type ?? raw.category ?? raw.grade ?? raw.variant),
    harvested_at: toDateText(raw.harvested_at ?? raw.harvest_date ?? raw.harvestedAt),
    created_at: toDateText(raw.created_at ?? raw.createdAt),
    is_active: Boolean(raw.is_active ?? raw.active ?? true),
    badge: toText(raw.badge ?? raw.tag ?? raw.label),
  }
}

class ListingService {
  /**
   * Get all registered crops in the catalog
   */
  async getCrops(): Promise<Crop[]> {
    try {
      return await apiClient.get<Crop[]>('/listings/crops')
    } catch {
      return []
    }
  }

  /**
   * Get all active listings across marketplace.
   * No mocked marketplace catalogue is used.
   */
  async getAllListings(): Promise<Listing[]> {
    try {
      const res = await apiClient.get<Listing[]>('/listings/')
      if (Array.isArray(res)) return res
    } catch {
      // No fallback data is used for marketplace results.
    }
    return []
  }

  /**
   * Get all active marketplace listings in the same shape used by search cards.
   */
  async getAllMarketplaceListings(): Promise<MarketplaceListing[]> {
    const response = await apiClient.get<unknown>('/listings/')
    const payload = Array.isArray(response)
      ? response
      : response && typeof response === 'object' && Array.isArray((response as Record<string, unknown>).items)
        ? (response as Record<string, unknown>).items
        : []

    return (payload as Record<string, unknown>[])
      .map((entry) => mapSearchResponseItem(entry))
      .filter((listing) => listing.is_active && (listing.quantity_available ?? 0) > 0)
  }

  /**
   * Get listings created specifically by the authenticated farmer.
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
   * Search for nearby listings by crop using the required API contract.
   */
  async searchListings(
    cropName: string,
    lat: number | string,
    lon: number | string,
    radiusKm: number | null = 10
  ): Promise<MarketplaceListing[]> {
    const safeCropName = cropName.trim()
    if (!safeCropName || (radiusKm !== null && (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon)))) ) {
      return []
    }

    const params = new URLSearchParams({ crop_name: safeCropName })
    if (radiusKm !== null) {
      params.set('lat', String(lat))
      params.set('lon', String(lon))
      params.set('radius_km', radiusKm.toString())
    }

    const response = await apiClient.get<unknown>(`/listings/search?${params.toString()}`)
    const payload = Array.isArray(response)
      ? response
      : response && typeof response === 'object'
        ? Array.isArray((response as Record<string, unknown>).items)
          ? (response as Record<string, unknown>).items
          : Array.isArray((response as Record<string, unknown>).data)
            ? (response as Record<string, unknown>).data
            : []
        : []

    return (payload as Record<string, unknown>[]).map((entry) => mapSearchResponseItem(entry))
  }

  async rankListings(cropName: string): Promise<MarketplaceListing[]> {
    const response = await apiClient.post<unknown>(`/ai/rank-sellers?crop_name=${encodeURIComponent(cropName.trim())}`)
    const payload = Array.isArray(response)
      ? response
      : response && typeof response === 'object' && Array.isArray((response as Record<string, unknown>).items)
        ? (response as Record<string, unknown>).items
        : []

    return (payload as Record<string, unknown>[]).map((entry) => mapSearchResponseItem(entry))
  }

  /**
   * Create a new produce listing (Farmer)
   */
  async createListing(data: ListingCreatePayload): Promise<Listing> {
    return apiClient.post<Listing>('/listings/', data)
  }

  /**
   * Restock or edit inventory
   */
  async restockInventory(lid: number, payload: InventoryUpdatePayload): Promise<Listing> {
    return apiClient.patch<Listing>(`/listings/${lid}/inventory`, payload)
  }

  async updateListing(lid: number, payload: { quantity_available: number; price_per_unit: number }): Promise<Listing> {
    return apiClient.put<Listing>(`/listings/${lid}`, payload)
  }

  /**
   * Take down or reactivate a listing
   */
  async toggleListingActive(lid: number): Promise<Listing> {
    return apiClient.patch<Listing>(`/listings/${lid}/toggle-active`, {})
  }

  /**
   * Delete a listing completely
   */
  async deleteListing(lid: number): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/listings/${lid}`)
  }
}

export const listingService = new ListingService()
