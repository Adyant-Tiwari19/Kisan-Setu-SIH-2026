import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { dashboardService, type FarmerIncomeDashboard } from '../services/dashboardService'
import { listingService, type Listing } from '../services/listingService'
import { orderService, type Order } from '../services/orderService'

const navItems = ['Home', 'My Crops', 'Add Listing', 'Orders', 'Demand Forecast', 'Earnings']

const alerts = [
  'Tomato demand up by 18% next week in regional hubs',
  'Rain expected tomorrow - secure stored harvests',
  'Optimal cold pickup slot available at 2:30 PM',
]

const forecast = [
  { label: 'Tomato', change: '+18%', expected: '420 kg', confidence: '82%' },
  { label: 'Onion', change: '+9%', expected: '300 kg', confidence: '76%' },
  { label: 'Potato', change: '+12%', expected: '260 kg', confidence: '80%' },
]

export function FarmerDashboard() {
  const { user } = useAuth()
  const [activeNav, setActiveNav] = useState('Home')
  const [showListingForm, setShowListingForm] = useState(false)
  const [listingName, setListingName] = useState('')
  const [listingQuantity, setListingQuantity] = useState('')
  const [listingPrice, setListingPrice] = useState('')
  const [listingType, setListingType] = useState('Grade A')
  const [isSubmittingListing, setIsSubmittingListing] = useState(false)
  const [dashboardMessage, setDashboardMessage] = useState('')

  // Live state from backend
  const [metrics, setMetrics] = useState<FarmerIncomeDashboard | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [farmerOrders, setFarmerOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [dashData, myListingsData, ordersData] = await Promise.all([
        dashboardService.getFarmerDashboard(),
        listingService.getMyListings(),
        orderService.getMyOrders(),
      ])
      setMetrics(dashData)
      setListings(myListingsData)
      setFarmerOrders(ordersData)
    } catch (err: any) {
      console.error('Error loading farmer dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const scrollToSection = (id: string) => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleNavClick = (label: string) => {
    setActiveNav(label)
    setDashboardMessage('')
    if (label === 'Add Listing') {
      setShowListingForm(true)
      scrollToSection('listing-form')
      return
    }
    const target =
      label === 'Home'
        ? 'farmer-overview'
        : label === 'My Crops'
        ? 'active-listings'
        : label === 'Orders'
        ? 'farmer-orders'
        : label === 'Demand Forecast'
        ? 'demand-forecast'
        : label === 'Earnings'
        ? 'earnings-section'
        : null
    if (target) scrollToSection(target)
  }

  const submitListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!listingName || !listingQuantity || !listingPrice) return

    setIsSubmittingListing(true)
    try {
      const newListing = await listingService.createListing({
        crop_name: listingName.trim(),
        quantity_available: Number(listingQuantity),
        price_per_unit: Number(listingPrice),
        listing_type: listingType,
      })

      setListings((prev) => [newListing, ...prev])
      setDashboardMessage(`✅ ${listingName} (${listingQuantity} kg @ ₹${listingPrice}/kg) published live to marketplace!`)
      setListingName('')
      setListingQuantity('')
      setListingPrice('')
      setShowListingForm(false)
      setActiveNav('My Crops')
      scrollToSection('active-listings')
    } catch (err: any) {
      setDashboardMessage(`Failed to publish listing: ${err.message || 'Error'}`)
    } finally {
      setIsSubmittingListing(false)
    }
  }

  const handleUpdateOrderStatus = async (oid: number, nextStatus: any) => {
    try {
      await orderService.updateOrderStatus(oid, { status: nextStatus })
      setFarmerOrders((prev) =>
        prev.map((o) => (o.oid === oid ? { ...o, status: nextStatus } : o))
      )
      setDashboardMessage(`Order #${oid} marked as ${nextStatus.replace('_', ' ')}!`)
    } catch (err: any) {
      setDashboardMessage(`Could not update order status: ${err.message}`)
    }
  }

  const handleToggleListingActive = async (lid: number) => {
    try {
      await listingService.toggleListingActive(lid)
      setListings((prev) =>
        prev.map((l) => (l.lid === lid ? { ...l, is_active: !l.is_active } : l))
      )
      const target = listings.find((l) => l.lid === lid)
      const newStatus = target?.is_active ? 'taken down (hidden from buyers)' : 'reactivated (live in marketplace)'
      setDashboardMessage(`Produce listing #${lid} is now ${newStatus}.`)
    } catch (err: any) {
      setDashboardMessage(`Could not change listing status: ${err.message}`)
    }
  }

  const handleDeleteListing = async (lid: number) => {
    if (!window.confirm(`Are you sure you want to permanently delete listing #${lid}?`)) return
    try {
      await listingService.deleteListing(lid)
      setListings((prev) => prev.filter((l) => l.lid !== lid))
      setDashboardMessage(`Listing #${lid} permanently removed.`)
    } catch (err: any) {
      setDashboardMessage(`Could not delete listing: ${err.message}`)
    }
  }

  const summary = [
    {
      label: 'Total Earnings',
      value: `₹${(metrics?.total_earnings || 0).toLocaleString('en-IN')}`,
      note: `Escrow Protected: ₹${(metrics?.pending_escrow || 0).toLocaleString('en-IN')}`,
    },
    {
      label: 'Active Listings',
      value: `${listings.length}`,
      note: `${(metrics?.total_quantity_sold || 0).toLocaleString('en-IN')} kg sold total`,
    },
    {
      label: 'Orders',
      value: `${farmerOrders.length}`,
      note: `Reliability Score: ${Math.round((metrics?.reliability_score || 0.95) * 100)}%`,
    },
  ]

  const activePickups = farmerOrders.filter(
    (o) => o.status === 'placed' || o.status === 'clustered'
  )

  return (
    <section className="section-shell py-20">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-emerald-100 bg-white p-3 shadow-[0_20px_70px_rgba(16,185,129,0.08)] md:p-5">
        <div className="rounded-[1.6rem] bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Farmer Dashboard</div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900 md:text-3xl">
                Good day, {user?.name?.split(' ')[0] || 'Farmer'} {isLoading && <span className="text-sm text-slate-400 font-normal">(syncing...)</span>}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowListingForm(true)
                scrollToSection('listing-form')
              }}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
            >
              + Add crop listing
            </button>
          </div>

          <div id="farmer-overview" className="scroll-mt-24 mt-5 flex gap-2 overflow-x-auto pb-2 md:gap-3">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  item === activeNav
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-emerald-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {dashboardMessage && (
            <div className="mt-4 rounded-xl bg-emerald-100/80 px-4 py-3 text-sm font-semibold text-emerald-900 border border-emerald-200">
              {dashboardMessage}
            </div>
          )}

          {/* Summary Cards */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {summary.map((item) => (
              <div key={item.label} className="rounded-[1.35rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{item.value}</div>
                <div className="mt-1 text-sm text-slate-500">{item.note}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              {/* Active Listings Component */}
              <div id="active-listings" className="scroll-mt-24 rounded-[1.5rem] bg-slate-900 p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">My Produce Listings</h3>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    {listings.length} live
                  </span>
                </div>

                <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {listings.length > 0 ? (
                    listings.map((item) => (
                      <div key={item.lid} className="rounded-2xl bg-white/5 p-3 hover:bg-white/10 transition">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-base font-bold">{item.crop_name || `Listing #${item.lid}`}</div>
                            <div className="text-xs text-slate-300">
                              {item.quantity_available} kg available · {item.listing_type || 'Standard'}
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                              item.is_active
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {item.is_active ? 'Live' : 'Taken Down'}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-xs text-slate-300">
                          <div className="flex items-center gap-2">
                            <span>Harvest: {new Date(item.harvested_at).toLocaleDateString()}</span>
                            <span className="font-bold text-emerald-400">₹{item.price_per_unit}/kg</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleListingActive(item.lid)}
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition shadow-sm ${
                                item.is_active
                                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                  : 'bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/40'
                              }`}
                            >
                              {item.is_active ? 'Take down' : 'Reactivate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteListing(item.lid)}
                              title="Delete listing permanently"
                              className="rounded-full bg-white/10 p-1 text-xs hover:bg-rose-500/30 hover:text-rose-300 text-slate-400 transition"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/20 p-6 text-center text-slate-300">
                      <div className="text-3xl mb-2">🌱</div>
                      <div className="font-bold text-white text-sm">No produce listings published yet</div>
                      <p className="text-xs text-slate-400 mt-1">
                        Add your first crop harvest so retailers & bulk buyers in your cluster can place orders directly.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowListingForm(true)
                          scrollToSection('listing-form')
                        }}
                        className="mt-3.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                      >
                        + Add First Crop Listing
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Farmer Incoming Orders */}
              <div id="farmer-orders" className="scroll-mt-24 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Incoming Buyer Orders</h3>
                  <span className="text-xs font-semibold text-slate-500">{farmerOrders.length} orders</span>
                </div>

                <div className="mt-4 space-y-3">
                  {farmerOrders.length > 0 ? (
                    farmerOrders.map((order) => (
                      <div key={order.oid} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5">
                        <div>
                          <div className="font-bold text-slate-900">Order #{order.oid}</div>
                          <div className="text-sm text-slate-600">
                            {order.crop_name || `Produce (${order.quantity} kg)`} · ₹{order.produce_price.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800">
                            {order.status.replace('_', ' ')}
                          </span>
                          {order.status === 'placed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(order.oid, 'clustered')}
                              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              Accept
                            </button>
                          )}
                          {order.status === 'clustered' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(order.oid, 'out_for_delivery')}
                              className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-white hover:bg-slate-900"
                            >
                              Dispatch
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
                      <div className="text-3xl mb-2">📦</div>
                      <div className="font-bold text-slate-800 text-sm">No orders received yet</div>
                      <p className="text-xs text-slate-500 mt-1">
                        When buyers purchase your produce, their incoming orders and pickup dispatches will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Upcoming pickups */}
              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Upcoming Pickups</h3>
                  <span className="text-sm font-semibold text-emerald-700">Scheduled Slots</span>
                </div>
                <div className="mt-4 space-y-3">
                  {activePickups.length > 0 ? (
                    activePickups.map((order) => (
                      <div key={order.oid} className="flex items-center justify-between rounded-2xl bg-emerald-50/70 p-3">
                        <div>
                          <div className="font-bold text-slate-900">Order #{order.oid}</div>
                          <div className="text-sm text-slate-600">{order.crop_name || 'Produce'} · {order.quantity} kg</div>
                        </div>
                        <div className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                          {order.status === 'placed' ? 'Pending Accept' : 'Clustered Route'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4 text-center text-xs text-slate-500">
                      No active vehicle pickups scheduled. Pickup routes are automatically generated when buyer orders are confirmed.
                    </div>
                  )}
                </div>
              </div>

              {/* Alerts */}
              <div className="rounded-[1.5rem] bg-amber-50/80 p-4 shadow-sm ring-1 ring-amber-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Crop & Weather Alerts</h3>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">Live advisory</span>
                </div>
                <div className="mt-4 space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert} className="flex items-start gap-3 rounded-2xl bg-white p-3 text-sm text-slate-700 shadow-sm">
                      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earnings & Escrow Section */}
              <div id="earnings-section" className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Recent Escrow Settlements</h3>
                  <span className="text-xs font-semibold text-emerald-700">Bank Transfer</span>
                </div>
                <div className="mt-4 space-y-3">
                  {metrics?.recent_payouts && metrics.recent_payouts.length > 0 ? (
                    metrics.recent_payouts.map((payout) => (
                      <div key={payout.oid} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                        <div>
                          <div className="font-bold text-slate-900">Order #{payout.oid} · {payout.crop_name}</div>
                          <div className="text-xs text-slate-500">
                            {payout.quantity_sold} kg delivered · {payout.settled_at ? new Date(payout.settled_at).toLocaleDateString() : 'Settled'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">+₹{payout.amount_earned.toLocaleString('en-IN')}</div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Escrow Settled</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                      No settled payouts yet. Once your delivered orders are verified, payments are automatically credited directly to your bank account.
                    </div>
                  )}
                </div>
              </div>

              {/* Demand forecast */}
              <div id="demand-forecast" className="scroll-mt-24 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">AI Demand Forecast (7 Days)</h3>
                  <span className="text-xs font-semibold text-emerald-700">Regional Cluster</span>
                </div>
                <div className="mt-4 space-y-3">
                  {forecast.map((crop) => (
                    <div key={crop.label} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                      <div>
                        <div className="font-bold text-slate-900">{crop.label}</div>
                        <div className="text-xs text-slate-500">Expected: {crop.expected} · Confidence {crop.confidence}</div>
                      </div>
                      <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">{crop.change}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Modal / Section */}
          {showListingForm && (
            <div id="listing-form" className="scroll-mt-24 mt-8 rounded-[1.5rem] bg-white p-5 shadow-lg ring-1 ring-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Add New Crop Listing</h3>
                  <p className="text-sm text-slate-500">Publish fresh produce directly to regional retailers and bulk buyers</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowListingForm(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submitListing} className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="listing-crop-name">
                    Crop Name
                  </label>
                  <input
                    id="listing-crop-name"
                    type="text"
                    required
                    value={listingName}
                    onChange={(e) => setListingName(e.target.value)}
                    placeholder="e.g. Tomatoes, Onions, Bananas"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="listing-crop-grade">
                    Grade / Variety
                  </label>
                  <input
                    id="listing-crop-grade"
                    type="text"
                    value={listingType}
                    onChange={(e) => setListingType(e.target.value)}
                    placeholder="e.g. Grade A, Hybrid Red"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="listing-crop-qty">
                    Available Quantity (kg)
                  </label>
                  <input
                    id="listing-crop-qty"
                    type="number"
                    min="1"
                    required
                    value={listingQuantity}
                    onChange={(e) => setListingQuantity(e.target.value)}
                    placeholder="e.g. 250"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="listing-crop-price">
                    Price per Unit (₹/kg)
                  </label>
                  <input
                    id="listing-crop-price"
                    type="number"
                    min="1"
                    required
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="e.g. 32"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowListingForm(false)}
                    className="rounded-full px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingListing}
                    className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isSubmittingListing ? 'Publishing...' : 'Publish Listing'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
