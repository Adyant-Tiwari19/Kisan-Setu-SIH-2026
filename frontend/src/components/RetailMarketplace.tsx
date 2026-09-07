import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listingService, type MarketplaceListing } from '../services/listingService'
import { orderService, type Order } from '../services/orderService'
import { useAuth } from '../context/AuthContext'
import { authService, type User } from '../services/authService'
import { API_BASE_URL } from '../services/apiClient'

const navItems = ['Home', 'Marketplace', 'Cart', 'Orders', 'Profile']
const searchLatitude = '28.6139'
const searchLongitude = '77.2090'
type SortMode = 'relevance' | 'distance' | 'price-low-high' | 'price-high-low'

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Not available'
  return currencyFormatter.format(value)
}

const formatDistance = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Not available'
  return `${value} km`
}

const formatHarvestDate = (value: string | null | undefined, fallback?: string | null) => {
  const dateValue = value || fallback
  if (!dateValue) return 'Not available'
  const date = new Date(dateValue)
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString('en-IN')
}

const getUnitPrice = (listing: MarketplaceListing) => listing.estimated_landed_price ?? listing.price_per_unit
const getDisplayedPrice = (listing: MarketplaceListing) => listing.price_per_unit ?? Number.MAX_SAFE_INTEGER

const getCropImageUrl = (sampleImageUrl: string | null | undefined) => {
  if (!sampleImageUrl) return null
  if (/^https?:\/\//i.test(sampleImageUrl)) return sampleImageUrl
  if (sampleImageUrl.startsWith('/crops/')) {
    return `/images/${encodeURIComponent(sampleImageUrl.slice('/crops/'.length))}`
  }
  if (sampleImageUrl.startsWith('/uploads/') || sampleImageUrl.startsWith('/static/')) {
    return `${API_BASE_URL.replace(/\/api\/v1$/, '')}${sampleImageUrl}`
  }
  if (sampleImageUrl.startsWith('/')) return sampleImageUrl
  const filename = sampleImageUrl.split(/[\\/]/).pop()?.trim()
  return filename && filename !== '.' && filename !== '..' ? `/images/${encodeURIComponent(filename)}` : null
}

const getFallbackCropImageUrl = (cropName: string) => {
  const filename = cropName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return filename ? `/images/${encodeURIComponent(filename)}.jpg` : null
}

const formatLineTotal = (listing: MarketplaceListing, quantity: number) => {
  const unitPrice = getUnitPrice(listing)
  return formatCurrency(unitPrice === null ? null : unitPrice * quantity)
}

interface RetailMarketplaceProps {
  embedded?: boolean
  wholesale?: boolean
  hideProfile?: boolean
  onBackToFarmer?: () => void
}

export function RetailMarketplace({ embedded = false, wholesale = false, hideProfile = false, onBackToFarmer }: RetailMarketplaceProps) {
  const navigate = useNavigate()
  const { user, isProfileVisible, toggleProfile } = useAuth()
  const [profileUser, setProfileUser] = useState<User | null>(user)
  const [showCheckout, setShowCheckout] = useState(false)
  const [activeNav, setActiveNav] = useState('Marketplace')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [cropQuery, setCropQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('relevance')
  const [cart, setCart] = useState<Record<string | number, number>>({})
  const [dashboardMessage, setDashboardMessage] = useState('')
  const [allListings, setAllListings] = useState<MarketplaceListing[]>([])
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [logisticsCost, setLogisticsCost] = useState(0)
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'success' | 'empty' | 'apiError'>('loading')
  const [validationMessage, setValidationMessage] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const currentUserId = profileUser?.uid ?? user?.uid
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRequestRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    void authService.getCurrentUserProfile().then((profile) => {
      if (isMounted) setProfileUser(profile)
    }).catch(() => {
      // Keep the authenticated session values when the profile endpoint is unavailable.
    })
    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => {
    let isMounted = true
    void orderService.getMyOrders().then((myOrders) => {
      if (isMounted) setOrders(myOrders)
    })
    return () => {
      isMounted = false
    }
  }, [user?.uid])

  const loadCatalog = useCallback(async () => {
    setSearchStatus('loading')
    try {
      const catalog = await listingService.getAllMarketplaceListings()
      const visibleCatalog = catalog.filter((listing) => (
        currentUserId === undefined ||
        listing.farmer_id === null ||
        listing.farmer_id === undefined ||
        String(listing.farmer_id) !== String(currentUserId)
      ))
      setAllListings(visibleCatalog)
      setListings(visibleCatalog)
      setSearchStatus(visibleCatalog.length ? 'success' : 'empty')
    } catch {
      setAllListings([])
      setListings([])
      setSearchStatus('apiError')
    }
  }, [currentUserId])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCatalog()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadCatalog])

  useEffect(() => {
    if (hideProfile) return

    const timer = setTimeout(() => {
      if (isProfileVisible && activeNav !== 'Profile') {
        setActiveNav('Profile')
      } else if (!isProfileVisible && activeNav === 'Profile') {
        setActiveNav('Marketplace')
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [activeNav, hideProfile, isProfileVisible])

  const buyerOrders = useMemo(
    () => orders.filter((order) => currentUserId !== undefined && String(order.bid) === String(currentUserId)),
    [currentUserId, orders]
  )

  const visibleProducts = useMemo(() => {
    if (!listings.length) return []

    return [...listings].sort((first, second) => {
      const firstPrice = getDisplayedPrice(first)
      const secondPrice = getDisplayedPrice(second)
      const firstDistance = first.distance_km ?? Number.MAX_SAFE_INTEGER
      const secondDistance = second.distance_km ?? Number.MAX_SAFE_INTEGER
      const firstRelevance = first.relevance_score ?? -1
      const secondRelevance = second.relevance_score ?? -1
      const firstFreshness = first.freshness_score ?? 0
      const secondFreshness = second.freshness_score ?? 0

      if (sortMode === 'distance') {
        return firstDistance - secondDistance || firstPrice - secondPrice
      }

      if (sortMode === 'price-low-high') {
        return firstPrice - secondPrice || firstDistance - secondDistance
      }

      if (sortMode === 'price-high-low') {
        return secondPrice - firstPrice || firstDistance - secondDistance
      }

      if (firstRelevance >= 0 || secondRelevance >= 0) {
        return secondRelevance - firstRelevance || firstPrice - secondPrice
      }

      return firstPrice - secondPrice || firstDistance - secondDistance || secondFreshness - firstFreshness
    })
  }, [listings, sortMode])

  const bestMatchId = useMemo(() => {
    if (sortMode !== 'relevance') return null

    return visibleProducts.reduce<string | number | null>((bestId, listing) => {
      if (listing.relevance_score === null || listing.relevance_score === undefined) return bestId
      if (bestId === null) return listing.id

      const bestListing = visibleProducts.find((candidate) => String(candidate.id) === String(bestId))
      return !bestListing || (bestListing.relevance_score ?? -1) < listing.relevance_score
        ? listing.id
        : bestId
    }, null)
  }, [sortMode, visibleProducts])

  const cartCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0)
  const cartItems = useMemo(
    () => allListings.filter((product) => (cart[product.id] ?? 0) > 0),
    [allListings, cart]
  )
  const produceSubtotal = cartItems.every((product) => getUnitPrice(product) !== null)
    ? cartItems.reduce((total, product) => total + (getUnitPrice(product) ?? 0) * (cart[product.id] ?? 0), 0)
    : null
  const displayedLogisticsCost = cartItems.length ? logisticsCost : 0
  const orderTotal = produceSubtotal === null ? null : produceSubtotal + displayedLogisticsCost

  useEffect(() => {
    let isMounted = true
    if (!cartItems.length) {
      return () => {
        isMounted = false
      }
    }

    void orderService.estimateLogistics(cartItems.map((listing) => ({
      lid: Number(listing.id),
      quantity: cart[listing.id] ?? 0,
    }))).then((cost) => {
      if (isMounted) setLogisticsCost(cost)
    }).catch(() => {
      if (isMounted) setLogisticsCost(0)
    })

    return () => {
      isMounted = false
    }
  }, [cart, cartItems])

  const scrollToSection = (id: string) => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const updateQuantity = (listing: MarketplaceListing, quantity: number) => {
    const availableQuantity = listing.quantity_available ?? 0
    if (quantity > availableQuantity) {
      setDashboardMessage(`Only ${availableQuantity} kg of ${listing.crop_name} is available.`)
      return
    }
    setCart((current) => {
      const next = { ...current }
      if (quantity <= 0) delete next[listing.id]
      else next[listing.id] = quantity
      return next
    })
    setOrderPlaced(false)
  }

  const addToCart = (listing: MarketplaceListing) => {
    const nextQuantity = (cart[listing.id] ?? 0) + 1
    updateQuantity(listing, nextQuantity)
  }

  const handleSearch = async (query = cropQuery, selectedSortMode = sortMode) => {
    const requestId = ++searchRequestRef.current
    const trimmedCrop = query.trim()

    if (!trimmedCrop) {
      setValidationMessage('')
      setListings(allListings)
      setSearchStatus(allListings.length ? 'success' : 'empty')
      return
    }

    setSearchStatus('loading')
    setValidationMessage('')
    setDashboardMessage('')

    try {
      let sortedResults: MarketplaceListing[]
      const searchResults = await listingService.searchListings(trimmedCrop, searchLatitude, searchLongitude, null)
      if (requestId !== searchRequestRef.current) return

      if (selectedSortMode === 'relevance') {
        try {
          const rankedResults = await listingService.rankListings(trimmedCrop)
          if (requestId !== searchRequestRef.current) return
          const searchById = new Map(searchResults.map((listing) => [String(listing.id), listing]))
          sortedResults = rankedResults.map((rankedListing) => ({
            ...searchById.get(String(rankedListing.id)),
            ...rankedListing,
            sample_img_url: searchById.get(String(rankedListing.id))?.sample_img_url ?? rankedListing.sample_img_url,
            farmer_address: searchById.get(String(rankedListing.id))?.farmer_address ?? rankedListing.farmer_address,
            farmer_phone: searchById.get(String(rankedListing.id))?.farmer_phone ?? rankedListing.farmer_phone,
          }))
        } catch {
          sortedResults = searchResults
        }
      } else {
        sortedResults = searchResults
      }

      if (requestId !== searchRequestRef.current) return
      sortedResults = sortedResults.filter((listing) => (
        currentUserId === undefined ||
        listing.farmer_id === null ||
        listing.farmer_id === undefined ||
        String(listing.farmer_id) !== String(currentUserId)
      ))

      if (selectedSortMode === 'relevance' && !sortedResults.some((listing) => listing.relevance_score !== null)) {
        sortedResults = [...sortedResults].sort((first, second) => getDisplayedPrice(first) - getDisplayedPrice(second))
        setDashboardMessage('Seller relevance is unavailable, so results are sorted by price.')
      }

      setListings(sortedResults)

      if (!sortedResults.length) {
        setSearchStatus('empty')
        return
      }

      setSearchStatus('success')
      if (selectedSortMode !== 'relevance' || sortedResults.some((listing) => listing.relevance_score !== null)) {
        setDashboardMessage('Fresh produce results loaded for your selected location.')
      }
    } catch {
      if (requestId !== searchRequestRef.current) return
      setListings([])
      setSearchStatus('apiError')
    }
  }

  const retrySearch = () => {
    void handleSearch()
  }

  const resetMarketplace = () => {
    searchRequestRef.current += 1
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    setCropQuery('')
    setSortMode('relevance')
    setValidationMessage('')
    setDashboardMessage('')
    void loadCatalog()
  }

  const placeOrder = async () => {
    if (isPlacingOrder || cartItems.length === 0) return
    setIsPlacingOrder(true)

    try {
      const createdOrders = await Promise.all(
        cartItems
          .filter((listing) => typeof listing.id === 'number' && (cart[listing.id] ?? 0) > 0)
          .map((listing) =>
            orderService.placeOrder({
              lid: listing.id as number,
              quantity: cart[listing.id] ?? 0,
              bid: currentUserId,
            })
          )
      )
      setOrders((current) => [...createdOrders, ...current])
      setCart({})
      setOrderPlaced(true)
      setShowCheckout(false)
      setActiveNav('Orders')
    } catch (error) {
      setIsPlacingOrder(false)
      setDashboardMessage(error instanceof Error ? error.message : 'Unable to place order with the requested quantity.')
    }
  }

  return (
    <section className={embedded ? 'w-full' : 'section-shell py-16'}>
      <div className="mx-auto max-w-6xl rounded-4xl border border-emerald-100/60 bg-white p-4 shadow-xl shadow-emerald-950/5 md:p-6">
        <div className="rounded-3xl bg-linear-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">{wholesale ? 'Wholesale User' : 'Retail Consumer'}</div>
              <h2 className="mt-2 text-2xl font-black tracking-tighter text-slate-900 md:text-3xl">{wholesale ? 'Fresh picks at best prices' : 'Fresh picks near you'}</h2>
            </div>
            <div className="flex items-center gap-2">
              {onBackToFarmer && (
                <button type="button" onClick={onBackToFarmer} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
                  Back to Farmer Dashboard 🌾
                </button>
              )}
              <button type="button" onClick={() => setActiveNav('Cart')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Cart ({cartCount})
              </button>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 md:gap-3">
            {navItems.filter((item) => !hideProfile || item !== 'Profile').map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (item === 'Profile') {
                    if (!isProfileVisible) toggleProfile()
                    setActiveNav('Profile')
                    return
                  }
                  if (item === 'Home') {
                    if (isProfileVisible) toggleProfile()
                    resetMarketplace()
                    setActiveNav('Home')
                    scrollToSection('retail-products')
                    return
                  }
                  if (isProfileVisible) toggleProfile()
                  setActiveNav(item)
                  setDashboardMessage('')
                  const target = item === 'Marketplace' ? 'retail-products' : item === 'Cart' ? 'retail-cart' : item === 'Orders' ? 'retail-orders' : null
                  if (target) scrollToSection(target)
                }}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition ${item === (isProfileVisible ? 'Profile' : activeNav) ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
              >
                {item}
              </button>
            ))}
          </div>

          {activeNav === 'Profile' && (
            <div id="retail-profile" className="mt-5 scroll-mt-24 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                    {wholesale ? 'Bulk buyer profile' : 'Customer profile'}
                  </div>
                  <h3 className="mt-1 text-xl font-black text-slate-900">{profileUser?.name || 'My profile'}</h3>
                </div>
                <button type="button" onClick={toggleProfile} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-emerald-300 hover:text-emerald-700">
                  Hide profile
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: 'Mobile number', value: profileUser?.phone },
                  { label: 'Address', value: profileUser?.address },
                  { label: 'Pincode', value: profileUser?.pincode },
                  ...(wholesale
                    ? [
                        { label: 'Email address', value: profileUser?.email },
                        { label: 'Organization', value: profileUser?.organization },
                      ]
                    : []),
                ].map((detail) => (
                  <div key={detail.label} className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{detail.label}</div>
                    <div className="mt-1 break-words text-sm font-bold text-slate-900">{detail.value || 'Not available'}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => navigate('/profile/edit')} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100">
                  Edit profile
                </button>
              </div>
            </div>
          )}

          {dashboardMessage && <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{dashboardMessage}</div>}

          {(activeNav === 'Home' || activeNav === 'Marketplace') && (
          <div className="mt-5 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100 md:p-4">
            <div className="flex w-full min-w-0 items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <input
                  value={cropQuery}
                  onChange={(event) => {
                    const value = event.target.value
                    setCropQuery(value)
                    setValidationMessage('')
                    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                    if (!value.trim()) {
                      searchRequestRef.current += 1
                      void loadCatalog()
                      return
                    }
                    searchTimerRef.current = setTimeout(() => {
                      void handleSearch(value)
                    }, 350)
                  }}
                  placeholder="Search crop"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              {!wholesale && (
                <div className="shrink-0">
                  <label className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-slate-700">
                    <span>Sort by</span>
                    <select
                      value={sortMode}
                      onChange={(event) => {
                        const nextSortMode = event.target.value as SortMode
                        setSortMode(nextSortMode)
                        if (cropQuery.trim()) void handleSearch(cropQuery, nextSortMode)
                      }}
                      className="min-w-[14rem] rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="distance">Distance: Nearest first</option>
                      <option value="price-low-high">Price: Low to high</option>
                      <option value="price-high-low">Price: High to low</option>
                    </select>
                  </label>
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleSearch()}
                disabled={searchStatus === 'loading'}
                className="shrink-0 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {searchStatus === 'loading' ? 'Searching...' : 'Search'}
              </button>
            </div>

            {validationMessage && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {validationMessage}
              </div>
            )}

            {searchStatus === 'apiError' && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <div>We could not load listings right now. Please try again.</div>
                  <button type="button" onClick={retrySearch} className="mt-2 font-semibold underline">
                    Retry
                  </button>
              </div>
            )}
          </div>
          )}

          {(activeNav === 'Home' || activeNav === 'Marketplace') && (
          <div id="retail-products" className="scroll-mt-24 mt-6" aria-live="polite">
            {searchStatus === 'empty' && !cropQuery.trim() && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
                <div className="text-3xl">🧺</div>
                <h3 className="mt-4 text-xl font-black text-slate-900">Search fresh produce near you</h3>
                <p className="mt-2 text-sm text-slate-500">Search fresh produce near you. Enter a crop and choose your location.</p>
              </div>
            )}

            {searchStatus === 'loading' && (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                <p className="mt-4 text-base font-semibold text-slate-800">Searching nearby listings...</p>
              </div>
            )}

            {searchStatus === 'empty' && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
                <div className="text-3xl">📍</div>
                <h3 className="mt-4 text-xl font-black text-slate-900">
                  No fresh produce was found for {cropQuery.trim()}.
                </h3>
                <p className="mt-2 text-sm text-slate-500">Try another crop.</p>
              </div>
            )}

            {searchStatus === 'success' && visibleProducts.length > 0 && (
              <div className="grid gap-5 lg:grid-cols-3">
                {visibleProducts.map((listing) => (
                  <article
                    key={String(listing.id)}
                    className={`transform-gpu rounded-3xl bg-white p-4 transition-all duration-300 ease-out [perspective:1000px] hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] ${String(listing.id) === String(bestMatchId) ? 'border-2 border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]' : 'ring-1 ring-slate-100'}`}
                  >
                    {String(listing.id) === String(bestMatchId) && (
                      <div className="mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                        AI Top Pick
                      </div>
                    )}
                    <div className="mt-4 h-28 overflow-hidden rounded-2xl bg-linear-to-br from-emerald-200 via-lime-100 to-amber-100">
                      {getCropImageUrl(listing.sample_img_url) && (
                        <img
                          src={getCropImageUrl(listing.sample_img_url) || undefined}
                          alt={listing.crop_name}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            const fallbackUrl = getFallbackCropImageUrl(listing.crop_name)
                            if (fallbackUrl && event.currentTarget.src !== `${window.location.origin}${fallbackUrl}`) {
                              event.currentTarget.src = fallbackUrl
                            } else if (event.currentTarget.src.endsWith('/images/icon.png')) {
                              event.currentTarget.style.display = 'none'
                            } else {
                              event.currentTarget.src = '/images/icon.png'
                            }
                          }}
                        />
                      )}
                      {!getCropImageUrl(listing.sample_img_url) && getFallbackCropImageUrl(listing.crop_name) && (
                        <img
                          src={getFallbackCropImageUrl(listing.crop_name) || undefined}
                          alt={listing.crop_name}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            if (!event.currentTarget.src.endsWith('/images/icon.png')) event.currentTarget.src = '/images/icon.png'
                            else event.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                    </div>

                    <div className="mt-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900">{listing.crop_name}</h3>
                        {wholesale && (
                          <div className="mt-2 space-y-1 text-sm text-slate-600">
                            <div><span className="font-semibold text-slate-800">Farmer:</span> {listing.farmer_name || 'Not available'}</div>
                            <div><span className="font-semibold text-slate-800">Address:</span> {listing.farmer_address || 'Not available'}</div>
                            <div><span className="font-semibold text-slate-800">Phone:</span> {listing.farmer_phone || 'Not available'}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Distance</span>
                        <span className="font-semibold text-slate-800">{formatDistance(listing.distance_km)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Harvested</span>
                        <span className="font-semibold text-slate-800">
                          {formatHarvestDate(listing.harvested_at, listing.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Price / kg</span>
                        <span className="text-xl font-black text-slate-900">{formatCurrency(listing.price_per_unit)}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                      {wholesale && (
                        <a
                          href={listing.farmer_phone ? `tel:${listing.farmer_phone}` : undefined}
                          aria-disabled={!listing.farmer_phone}
                          className={`rounded-full px-4 py-2.5 text-sm font-semibold ${listing.farmer_phone ? 'bg-slate-900 text-white' : 'cursor-not-allowed bg-slate-200 text-slate-400'}`}
                        >
                          Contact now
                        </a>
                      )}
                      {cart[listing.id] ? (
                        <div className="flex items-center gap-2 rounded-full bg-emerald-50 p-1 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
                          <button type="button" onClick={() => updateQuantity(listing, (cart[listing.id] ?? 1) - 1)} className="h-8 w-8 rounded-full bg-white text-lg transition-all duration-200 active:scale-95">−</button>
                          <span className="min-w-8 text-center">{cart[listing.id]}</span>
                          <button type="button" onClick={() => addToCart(listing)} className="h-8 w-8 rounded-full bg-white text-lg transition-all duration-200 active:scale-95">+</button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(listing)}
                          className="rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 transform active:scale-95"
                        >
                          Add to cart
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
          )}

          {activeNav === 'Cart' && (showCheckout ? (
            <div className="mt-8 rounded-3xl bg-slate-900 p-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Checkout</div>
                  <h3 className="mt-2 text-3xl font-black tracking-tighter">Confirm your order</h3>
                </div>
                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={() => setShowCheckout(false)}
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back to cart
                </button>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4 rounded-3xl bg-white/5 p-4">
                  <div>
                    <div className="mb-2 text-sm text-slate-300">Delivery address</div>
                    <div className="rounded-2xl bg-white/10 p-3 text-sm leading-7 text-slate-100">
                      {user?.address || 'Delivery address is not available'}
                      {user?.pincode && <><br />{user.pincode}</>}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-slate-300">Delivery estimate</div>
                    <div className="rounded-2xl bg-white/10 p-3 text-sm text-slate-100">Today, 6:30 PM - 8:00 PM</div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-slate-300">Payment method</div>
                    <div className="rounded-2xl bg-white/10 p-3 text-sm text-slate-100">Cash on delivery (COD)</div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-4 text-slate-900">
                  <h4 className="text-xl font-black text-slate-900">Order summary</h4>

                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    {cartItems.map((listing) => (
                      <div key={String(listing.id)} className="flex items-center justify-between">
                        <span>{listing.crop_name} × {cart[listing.id]}</span>
                        <span className="font-bold text-slate-900">{formatLineTotal(listing, cart[listing.id] ?? 0)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <span>Produce subtotal</span>
                      <span>{formatCurrency(produceSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Logistics</span>
                      <span>{formatCurrency(displayedLogisticsCost)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                      <span>Total</span>
                      <span>{formatCurrency(orderTotal)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={cartCount === 0 || isPlacingOrder}
                    onClick={() => void placeOrder()}
                    className="mt-5 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPlacingOrder ? 'Placing your order...' : 'Place order'}
                  </button>
                  {isPlacingOrder && (
                    <div className="mt-4" aria-live="polite">
                      <div className="relative h-3 overflow-hidden rounded-full bg-emerald-100">
                        <div className="h-full w-1/3 rounded-full bg-emerald-600 animate-[checkout-progress_1.6s_ease-in-out_infinite]" />
                        <span className="absolute top-1/2 -translate-y-1/2 text-base leading-none animate-[checkout-crop_1.6s_ease-in-out_infinite]" aria-hidden="true">
                          🌱
                        </span>
                      </div>
                      <p className="mt-2 text-center text-sm font-semibold text-emerald-700">Placing your order...</p>
                    </div>
                  )}
                  {orderPlaced && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">Order placed successfully. Your farmer is preparing it.</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div id="retail-cart" className="scroll-mt-24 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <h3 className="text-xl font-black text-slate-900">Cart</h3>
                <div className="mt-4 space-y-3">
                  {cartItems.map((listing) => (
                    <div key={String(listing.id)} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                      <div>
                        <div className="font-bold text-slate-900">{listing.crop_name}</div>
                        <div className="text-sm text-slate-500">Price: {formatCurrency(listing.price_per_unit)} / kg</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateQuantity(listing, (cart[listing.id] ?? 1) - 1)} className="h-8 w-8 rounded-full bg-white text-lg ring-1 ring-slate-200">−</button>
                        <input
                          type="number"
                          min="0"
                          max={listing.quantity_available ?? undefined}
                          step="any"
                          value={cart[listing.id] ?? 0}
                          onChange={(event) => {
                            const value = Number(event.target.value)
                            if (event.target.value === '') {
                              updateQuantity(listing, 0)
                            } else if (Number.isFinite(value) && value >= 0) {
                              updateQuantity(listing, value)
                            }
                          }}
                          aria-label={`Quantity of ${listing.crop_name} in kilograms`}
                          className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-bold text-slate-900"
                        />
                        <span className="text-xs font-semibold text-slate-500">kg</span>
                        <button type="button" onClick={() => addToCart(listing)} className="h-8 w-8 rounded-full bg-white text-lg ring-1 ring-slate-200">+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between"><span>Produce subtotal</span><span>{formatCurrency(produceSubtotal)}</span></div>
                  <div className="flex items-center justify-between"><span>Logistics cost</span><span>{formatCurrency(displayedLogisticsCost)}</span></div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-bold text-slate-900"><span>Total</span><span>{formatCurrency(orderTotal)}</span></div>
                </div>

                <button
                  type="button"
                  disabled={cartCount === 0}
                  onClick={() => setShowCheckout(true)}
                  className="mt-5 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Checkout ({cartCount} kg)
                </button>
              </div>

            </div>
          ))}

          {activeNav === 'Orders' && (
          <div id="retail-orders" className="mt-6 scroll-mt-24 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-xl font-black text-slate-900">Orders</h3>
            <div className="mt-4 space-y-4">
              {!buyerOrders.length && <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">No previous orders found.</div>}
              {buyerOrders.map((order) => (
                <div key={order.oid} className="rounded-2xl bg-emerald-50 p-3">
                  <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
                    <span>Order #{order.oid}</span>
                    <span className="font-bold text-emerald-700">{order.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    {order.crop_name || 'Crop not available'} · {order.quantity} kg · ₹{Number(order.landed_price || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveNav('Cart')}
              aria-label={`Open cart with ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
              className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900/95 text-white shadow-2xl ring-1 ring-emerald-300/40 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-800"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 12H7L6 8Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 8a3 3 0 0 1 6 0" />
              </svg>
              <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-bold text-white">
                {cartCount}
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
