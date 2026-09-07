import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listingService, type MarketplaceListing } from '../services/listingService'
import { orderService, type Order } from '../services/orderService'
import { useAuth } from '../context/AuthContext'
import { authService, type User } from '../services/authService'

const navItems = ['Home', 'Marketplace', 'Cart', 'Orders', 'Profile']
const radiusOptions: Array<number | null> = [20, 50, 100, 500]
const searchLatitude = '28.6139'
const searchLongitude = '77.2090'

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

const formatHarvestDate = (value: string | null) => {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString('en-IN')
}

const getUnitPrice = (listing: MarketplaceListing) => listing.estimated_landed_price ?? listing.price_per_unit

const getCropImageUrl = (sampleImageUrl: string | null | undefined) => {
  if (!sampleImageUrl) return null
  const filename = sampleImageUrl.split(/[\\/]/).pop()?.trim()
  if (!filename || filename === '.' || filename === '..') return null
  return `/images/${encodeURIComponent(filename)}`
}

const formatLineTotal = (listing: MarketplaceListing, quantity: number) => {
  const unitPrice = getUnitPrice(listing)
  return formatCurrency(unitPrice === null ? null : unitPrice * quantity)
}

interface RetailMarketplaceProps {
  embedded?: boolean
  wholesale?: boolean
}

export function RetailMarketplace({ embedded = false, wholesale = false }: RetailMarketplaceProps) {
  const navigate = useNavigate()
  const { user, isProfileVisible, toggleProfile } = useAuth()
  const [profileUser, setProfileUser] = useState<User | null>(user)
  const [showCheckout, setShowCheckout] = useState(false)
  const [activeNav, setActiveNav] = useState('Marketplace')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [cropQuery, setCropQuery] = useState('')
  const [radiusKm, setRadiusKm] = useState<number | null>(20)
  const [cart, setCart] = useState<Record<string | number, number>>({})
  const [dashboardMessage, setDashboardMessage] = useState('')
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'success' | 'empty' | 'apiError'>('idle')
  const [validationMessage, setValidationMessage] = useState('')
  const [orders, setOrders] = useState<Order[]>([])

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
    void orderService.getMyOrders().then(setOrders)
  }, [])

  const visibleProducts = useMemo(() => {
    if (!listings.length) return []

    return [...listings].sort((first, second) => {
      const firstPrice = first.estimated_landed_price ?? first.price_per_unit ?? Number.MAX_SAFE_INTEGER
      const secondPrice = second.estimated_landed_price ?? second.price_per_unit ?? Number.MAX_SAFE_INTEGER
      const firstDistance = first.distance_km ?? Number.MAX_SAFE_INTEGER
      const secondDistance = second.distance_km ?? Number.MAX_SAFE_INTEGER
      const firstFreshness = first.freshness_score ?? 0
      const secondFreshness = second.freshness_score ?? 0

      return firstPrice - secondPrice || firstDistance - secondDistance || secondFreshness - firstFreshness
    })
  }, [listings])

  const cartCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0)
  const cartItems = visibleProducts.filter((product) => (cart[product.id] ?? 0) > 0)
  const produceSubtotal = cartItems.every((product) => getUnitPrice(product) !== null)
    ? cartItems.reduce((total, product) => total + (getUnitPrice(product) ?? 0) * (cart[product.id] ?? 0), 0)
    : null
  const logisticsCost = cartCount > 0 ? 35 : 0
  const orderTotal = produceSubtotal === null ? null : produceSubtotal + logisticsCost

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

  const handleSearch = async (selectedRadius = radiusKm) => {
    const trimmedCrop = cropQuery.trim()

    if (!trimmedCrop) {
      setValidationMessage('Enter a crop name to search.')
      setSearchStatus('idle')
      return
    }

    setSearchStatus('loading')
    setValidationMessage('')
    setDashboardMessage('')

    try {
      const results = await listingService.searchListings(trimmedCrop, searchLatitude, searchLongitude, selectedRadius)
      setListings(results)

      if (!results.length) {
        setSearchStatus('empty')
        return
      }

      setSearchStatus('success')
      setDashboardMessage('Fresh produce results loaded for your selected location.')
    } catch {
      setListings([])
      setSearchStatus('apiError')
    }
  }

  const retrySearch = () => {
    void handleSearch()
  }

  const placeOrder = async () => {
    try {
      const createdOrders = await Promise.all(
        cartItems
          .filter((listing) => typeof listing.id === 'number' && (cart[listing.id] ?? 0) > 0)
          .map((listing) =>
            orderService.placeOrder({
              lid: listing.id as number,
              quantity: cart[listing.id] ?? 0,
            })
          )
      )
      setOrders((current) => [...createdOrders, ...current])
      setCart({})
      setOrderPlaced(true)
      setShowCheckout(false)
      setActiveNav('Orders')
    } catch (error) {
      setDashboardMessage(error instanceof Error ? error.message : 'Unable to place order with the requested quantity.')
    }
  }

  return (
    <section className={embedded ? 'w-full' : 'section-shell py-16'}>
      <div className="mx-auto max-w-6xl rounded-4xl border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-6">
        <div className="rounded-3xl bg-linear-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">{wholesale ? 'Wholesale User' : 'Retail Consumer'}</div>
              <h2 className="mt-2 text-2xl font-black tracking-tighter text-slate-900 md:text-3xl">{wholesale ? 'Fresh picks at best prices' : 'Fresh picks near you'}</h2>
            </div>
            <button type="button" onClick={() => scrollToSection('retail-cart')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Cart ({cartCount})
            </button>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 md:gap-3">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (item === 'Profile') {
                    toggleProfile()
                    setActiveNav(isProfileVisible ? 'Marketplace' : 'Profile')
                    return
                  }
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

          {isProfileVisible && (
            <div id="retail-profile" className="mt-5 scroll-mt-24 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                    {wholesale ? 'Bulk buyer profile' : 'Retailer profile'}
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

          <div className="mt-5 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100 md:p-4">
            <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_auto]">
              <div className="relative">
                <input
                  value={cropQuery}
                  onChange={(event) => {
                    const value = event.target.value
                    setCropQuery(value)
                    if (!value.trim()) setSearchStatus('idle')
                  }}
                  placeholder="Search crop"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {radiusOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setRadiusKm(option)
                      void handleSearch(option)
                    }}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition ${radiusKm === option ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {option} kms
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void handleSearch()}
                disabled={searchStatus === 'loading'}
                className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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

          <div id="retail-products" className="scroll-mt-24 mt-6" aria-live="polite">
            {searchStatus === 'idle' && (
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
                  No fresh produce was found {radiusKm === null ? '' : `within ${radiusKm} km `}for {cropQuery.trim()}.
                </h3>
                <p className="mt-2 text-sm text-slate-500">Try a wider radius or another crop.</p>
              </div>
            )}

            {searchStatus === 'success' && visibleProducts.length > 0 && (
              <div className="grid gap-5 lg:grid-cols-3">
                {visibleProducts.map((listing) => (
                  <article key={String(listing.id)} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <div className="mt-4 h-28 overflow-hidden rounded-2xl bg-linear-to-br from-emerald-200 via-lime-100 to-amber-100">
                      {getCropImageUrl(listing.sample_img_url) && (
                        <img
                          src={getCropImageUrl(listing.sample_img_url) || undefined}
                          alt={listing.crop_name}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none'
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
                          {formatHarvestDate(listing.harvested_at)}
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
                      <button
                        type="button"
                        onClick={() => addToCart(listing)}
                        className="rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
                      >
                        Add {cart[listing.id] ? `(${cart[listing.id]})` : ''} to cart
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {showCheckout ? (
            <div className="mt-8 rounded-3xl bg-slate-900 p-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Checkout</div>
                  <h3 className="mt-2 text-3xl font-black tracking-tighter">Confirm your order</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
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
                      <span>{formatCurrency(logisticsCost)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                      <span>Total</span>
                      <span>{formatCurrency(orderTotal)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={cartCount === 0}
                    onClick={() => void placeOrder()}
                    className="mt-5 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Place order
                  </button>
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
                  <div className="flex items-center justify-between"><span>Logistics cost</span><span>{formatCurrency(logisticsCost)}</span></div>
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

              <div id="retail-orders" className="scroll-mt-24 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <h3 className="text-xl font-black text-slate-900">Orders</h3>
                <div className="mt-4 space-y-4">
                  {!orders.length && <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">No previous orders found.</div>}
                  {orders.map((order) => (
                    <div key={order.oid} className="rounded-2xl bg-emerald-50 p-3">
                      <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
                        <span>Order #{order.oid}</span>
                        <span className="font-bold text-emerald-700">{order.status.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        {order.crop_name || 'Crop not available'} · {order.quantity} kg · ₹{order.landed_price.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
