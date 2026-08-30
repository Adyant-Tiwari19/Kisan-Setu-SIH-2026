import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listingService, type Listing } from '../services/listingService'
import { orderService, type Order } from '../services/orderService'

const navItems = ['Marketplace', 'Cart', 'Orders']
const categories = ['All', 'Vegetables', 'Fruits', 'Grains', 'Spices']
const orderTimeline = ['Placed', 'Pickup Clustered', 'In Transit', 'Delivered']

export function RetailMarketplace() {
  const { user } = useAuth()
  const [showCheckout, setShowCheckout] = useState(false)
  const [activeNav, setActiveNav] = useState('Marketplace')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('Best Value')
  const [cart, setCart] = useState<Record<number, number>>({})
  const [dashboardMessage, setDashboardMessage] = useState('')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  // Live state from backend
  const [listings, setListings] = useState<Listing[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [listingsData, ordersData] = await Promise.all([
        listingService.getAllListings(),
        orderService.getMyOrders(),
      ])
      setListings(listingsData)
      setMyOrders(ordersData)
    } catch (err: any) {
      console.error('Error loading marketplace:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const visibleProducts = useMemo(() => {
    const filtered = listings.filter((product) => {
      const name = product.crop_name || ''
      const farmer = product.farmer_name || ''
      const origin = product.origin || ''
      const matchesSearch = `${name} ${farmer} ${origin}`.toLowerCase().includes(search.toLowerCase())
      
      const isVeg = name.toLowerCase().includes('tomato') || name.toLowerCase().includes('onion') || name.toLowerCase().includes('potato')
      const isFruit = name.toLowerCase().includes('banana') || name.toLowerCase().includes('apple')
      const isGrain = name.toLowerCase().includes('rice') || name.toLowerCase().includes('wheat')

      const matchesCategory =
        category === 'All' ||
        (category === 'Vegetables' && isVeg) ||
        (category === 'Fruits' && isFruit) ||
        (category === 'Grains' && isGrain)

      return matchesSearch && matchesCategory
    })

    return [...filtered].sort((first, second) => {
      const priceA = first.estimated_landed_price || first.price_per_unit
      const priceB = second.estimated_landed_price || second.price_per_unit
      if (sort === 'Cheapest') return priceA - priceB
      if (sort === 'Freshest') return (second.freshness_score || 90) - (first.freshness_score || 90)
      if (sort === 'Nearest') return (first.distance_km || 10) - (second.distance_km || 10)
      return (second.trust_score || 4.5) - (first.trust_score || 4.5)
    })
  }, [listings, category, search, sort])

  const cartCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0)
  const cartItems = listings.filter((product) => (cart[product.lid] ?? 0) > 0)
  const produceSubtotal = cartItems.reduce(
    (total, product) => total + (product.estimated_landed_price || product.price_per_unit) * (cart[product.lid] ?? 0),
    0
  )
  const logisticsCost = cartCount > 0 ? 35 : 0
  const orderTotal = produceSubtotal + logisticsCost

  const scrollToSection = (id: string) => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const updateQuantity = (lid: number, quantity: number) => {
    setCart((current) => {
      const next = { ...current }
      if (quantity <= 0) delete next[lid]
      else next[lid] = Math.min(quantity, 50)
      return next
    })
  }

  const addToCart = (lid: number) => {
    setCart((current) => ({ ...current, [lid]: Math.min((current[lid] ?? 0) + 1, 50) }))
  }

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return
    setIsPlacingOrder(true)
    setDashboardMessage('')

    try {
      const placedOrders: Order[] = []
      for (const item of cartItems) {
        const qty = cart[item.lid] || 1
        const order = await orderService.placeOrder({
          lid: item.lid,
          quantity: qty,
        })
        placedOrders.push(order)
      }

      setMyOrders((prev) => [...placedOrders, ...prev])
      setCart({})
      setShowCheckout(false)
      setActiveNav('Orders')
      setDashboardMessage(`🎉 Order successfully placed! Order #${placedOrders[0]?.oid || 'FDR-2048'} is confirmed.`)
      scrollToSection('retail-orders')
    } catch (err: any) {
      setDashboardMessage(`Could not place order: ${err.message || 'Server error'}`)
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'placed':
        return 0
      case 'clustered':
        return 1
      case 'out_for_delivery':
        return 2
      case 'delivered':
      case 'settled':
        return 3
      default:
        return 0
    }
  }

  return (
    <section className="section-shell py-16">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-6">
        <div className="rounded-[1.6rem] bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Retail Marketplace</div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900 md:text-3xl">
                Fresh produce near you {isLoading && <span className="text-sm font-normal text-slate-400">(loading catalog...)</span>}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveNav('Cart')
                scrollToSection('retail-cart')
              }}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition"
            >
              Cart ({cartCount} kg)
            </button>
          </div>

          {/* Navigation Bar */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 md:gap-3">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setActiveNav(item)
                  const target = item === 'Marketplace' ? 'retail-products' : item === 'Cart' ? 'retail-cart' : item === 'Orders' ? 'retail-orders' : null
                  if (target) scrollToSection(target)
                }}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  item === activeNav ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-emerald-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {dashboardMessage && (
            <div className="mt-4 rounded-xl bg-emerald-100/90 px-4 py-3 text-sm font-semibold text-emerald-900 border border-emerald-200">
              {dashboardMessage}
            </div>
          )}

          {/* Search & Category Filter */}
          <div className="mt-5 rounded-[1.4rem] bg-white p-3 shadow-sm ring-1 ring-slate-100 md:p-4">
            <div className="relative">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search farm-fresh tomatoes, bananas, rice, or local FPOs..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-base outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
              <svg className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      category === c ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="Best Value">Best Value</option>
                  <option value="Cheapest">Price: Low to High</option>
                  <option value="Freshest">Freshest Harvest</option>
                  <option value="Nearest">Nearest Distance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Produce Catalog Grid */}
          <div id="retail-products" className="scroll-mt-24 mt-6">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => {
                const isSelected = (cart[product.lid] ?? 0) > 0
                const landedPrice = product.estimated_landed_price || product.price_per_unit
                return (
                  <div
                    key={product.lid}
                    className="flex flex-col justify-between rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            {product.badge || 'Direct Farm'}
                          </span>
                          <h3 className="mt-2 text-xl font-black text-slate-900">{product.crop_name}</h3>
                          <p className="text-xs text-slate-500">{product.farmer_name || 'Green Valley Collective'} · {product.origin || 'Nashik'}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-emerald-600">₹{landedPrice}/kg</div>
                          <div className="text-[10px] text-slate-400">Delivered Landed</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-2.5 text-center text-xs">
                        <div>
                          <div className="font-bold text-slate-800">{product.distance_km || 4.8} km</div>
                          <div className="text-[10px] text-slate-400">Distance</div>
                        </div>
                        <div>
                          <div className="font-bold text-emerald-600">{product.freshness_score || 96}%</div>
                          <div className="text-[10px] text-slate-400">Freshness</div>
                        </div>
                        <div>
                          <div className="font-bold text-amber-600">★ {product.trust_score || 4.9}</div>
                          <div className="text-[10px] text-slate-400">Farmer Score</div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-slate-500">
                        Available Stock: <span className="font-bold text-slate-700">{product.quantity_available} kg</span>
                      </div>
                    </div>

                    <div className="mt-5">
                      {isSelected ? (
                        <div className="flex items-center justify-between rounded-full bg-slate-100 p-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.lid, (cart[product.lid] ?? 1) - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold text-slate-800 shadow-sm"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold text-slate-800">{cart[product.lid]} kg</span>
                          <button
                            type="button"
                            onClick={() => addToCart(product.lid)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 font-bold text-white shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(product.lid)}
                          className="w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Checkout Modal / Section */}
          {showCheckout ? (
            <div className="mt-8 rounded-[1.7rem] bg-slate-900 p-5 text-white shadow-2xl md:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black">Fast Direct Checkout</h3>
                  <p className="text-sm text-slate-300">Escrow-backed settlement directly to farmer upon delivery.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
                >
                  Back to cart
                </button>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4 rounded-[1.4rem] bg-white/5 p-4">
                  <div>
                    <div className="mb-1 text-xs text-slate-400 uppercase tracking-wider font-bold">Delivery Address</div>
                    <div className="rounded-2xl bg-white/10 p-3 text-sm leading-6 text-slate-100">
                      {user?.name || 'Retail Member'}<br />
                      {user?.address || '24 Market Road, BTM Layout'}<br />
                      {user?.pincode ? `Pincode: ${user.pincode}` : 'Bengaluru, Karnataka'}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-xs text-slate-400 uppercase tracking-wider font-bold">Estimated Delivery Window</div>
                    <div className="rounded-2xl bg-white/10 p-3 text-sm text-slate-100">
                      Today · Evening Pickup Run (6:30 PM - 8:00 PM)
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-xs text-slate-400 uppercase tracking-wider font-bold">Payment & Escrow Protection</div>
                    <div className="rounded-2xl bg-white/10 p-3 text-sm text-slate-100">
                      Direct UPI Escrow · Funds held securely until produce inspected
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.4rem] bg-white p-5 text-slate-900">
                  <h4 className="text-xl font-black">Order Summary</h4>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    {cartItems.map((item) => (
                      <div key={item.lid} className="flex items-center justify-between">
                        <span>{item.crop_name} ({cart[item.lid]} kg)</span>
                        <span className="font-bold text-slate-900">
                          ₹{(item.estimated_landed_price || item.price_per_unit) * (cart[item.lid] ?? 0)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <span>Produce subtotal</span>
                      <span>₹{produceSubtotal}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Logistics & clustering fee</span>
                      <span>₹{logisticsCost}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-900">
                      <span>Total Amount</span>
                      <span className="text-emerald-700">₹{orderTotal}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPlacingOrder || cartCount === 0}
                    onClick={handlePlaceOrder}
                    className="mt-6 w-full rounded-full bg-emerald-600 px-4 py-3 text-base font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isPlacingOrder ? 'Confirming Order with Backend...' : `Confirm & Place Order (₹${orderTotal})`}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {/* Cart View */}
              <div id="retail-cart" className="scroll-mt-24 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <h3 className="text-xl font-black text-slate-900">Your Basket</h3>
                {cartItems.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    Your cart is empty. Click "+ Add to Cart" on any crop above.
                  </div>
                ) : (
                  <>
                    <div className="mt-4 space-y-3">
                      {cartItems.map((product) => (
                        <div key={product.lid} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                          <div>
                            <div className="font-bold text-slate-900">{product.crop_name}</div>
                            <div className="text-xs text-slate-500">₹{product.estimated_landed_price || product.price_per_unit}/kg delivered</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.lid, (cart[product.lid] ?? 1) - 1)}
                              className="h-7 w-7 rounded-full bg-white font-bold ring-1 ring-slate-200"
                            >
                              −
                            </button>
                            <span className="min-w-10 text-center font-bold text-slate-800">{cart[product.lid]} kg</span>
                            <button
                              type="button"
                              onClick={() => addToCart(product.lid)}
                              className="h-7 w-7 rounded-full bg-white font-bold ring-1 ring-slate-200"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Produce subtotal</span>
                        <span>₹{produceSubtotal}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Logistics fee</span>
                        <span>₹{logisticsCost}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-black text-slate-900">
                        <span>Total</span>
                        <span className="text-emerald-700">₹{orderTotal}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={cartCount === 0}
                      onClick={() => setShowCheckout(true)}
                      className="mt-5 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      Proceed to Checkout ({cartCount} kg)
                    </button>
                  </>
                )}
              </div>

              {/* Real Orders Tracking */}
              <div id="retail-orders" className="scroll-mt-24 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <h3 className="text-xl font-black text-slate-900">Live Order Tracking</h3>
                <div className="mt-4 space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {myOrders.length > 0 ? (
                    myOrders.map((order) => {
                      const stepIdx = getStepIndex(order.status)
                      return (
                        <div key={order.oid} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                          <div className="mb-3 flex items-center justify-between text-sm text-slate-700">
                            <div>
                              <span className="font-extrabold text-slate-900">Order #{order.oid}</span>
                              <div className="text-xs text-slate-500">{order.quantity} kg · ₹{order.landed_price.toLocaleString('en-IN')}</div>
                            </div>
                            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            {orderTimeline.map((step, index) => (
                              <div key={step} className="flex flex-col items-center gap-1.5">
                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                    index <= stepIdx ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                <span className="text-[10px] text-center text-slate-600">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                      <div className="text-3xl mb-2">📦</div>
                      <div className="font-bold text-slate-800 text-sm">No orders placed yet</div>
                      <p className="text-xs text-slate-500 mt-1">
                        When you place produce orders, real-time clustering, transport status, and tracking will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
