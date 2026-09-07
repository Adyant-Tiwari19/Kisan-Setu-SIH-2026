import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService, type User } from '../services/authService'
import { dashboardService, type FarmerIncomeDashboard } from '../services/dashboardService'
import { listingService, type Listing } from '../services/listingService'
import { orderService, type Order } from '../services/orderService'
import { aiService, type DemandForecast } from '../services/aiService'
import { RetailMarketplace } from './RetailMarketplace'

const navItems = ['Home', 'My Crops', 'My Profile', 'Edit Listing', 'Orders', 'Demand Forecast', 'Earnings']

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

const formatQuantity = (value: number) =>
  `${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg`

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

const formatOrderStatus = (status: Order['status']) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())

const getFarmerCropImage = (listing: Listing) => {
  const filename = listing.sample_img_url?.split(/[\\/]/).pop()?.trim()
    || listing.crop_name?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
  return filename ? `/images/${encodeURIComponent(filename.endsWith('.jpg') ? filename : `${filename}.jpg`)}` : '/images/icon.png'
}

export function FarmerDashboard() {
  const navigate = useNavigate()
  const { user, isProfileVisible, toggleProfile } = useAuth()
  const [profileUser, setProfileUser] = useState<User | null>(user)
  const [activeNav, setActiveNav] = useState('Home')
  const [isRetailMode, setIsRetailMode] = useState(false)
  const [showListingForm, setShowListingForm] = useState(false)
  const [listingName, setListingName] = useState('')
  const [listingQuantity, setListingQuantity] = useState('')
  const [listingPrice, setListingPrice] = useState('')
  const [listingImageUrl, setListingImageUrl] = useState('')
  const [listingSubmitted, setListingSubmitted] = useState(false)
  const [isPublishingListing, setIsPublishingListing] = useState(false)
  const [listingError, setListingError] = useState('')
  const [dashboardMessage, setDashboardMessage] = useState('')
  const [dashboard, setDashboard] = useState<FarmerIncomeDashboard | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadedUserPhone, setLoadedUserPhone] = useState<string | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)
  const [updatingListingId, setUpdatingListingId] = useState<number | null>(null)
  const [listingEditValues, setListingEditValues] = useState<Record<number, { quantity: string; price: string }>>({})
  const [isEditingListings, setIsEditingListings] = useState(false)
  const [editingListingId, setEditingListingId] = useState<number | null>(null)
  const [demandForecasts, setDemandForecasts] = useState<Record<number, DemandForecast>>({})
  const [isLoadingDemandForecasts, setIsLoadingDemandForecasts] = useState(false)
  useEffect(() => {
    let isMounted = true
    void authService.getCurrentUserProfile().then((profile) => {
      if (isMounted) setProfileUser(profile)
    }).catch(() => {
      if (isMounted) setProfileUser(user)
    })
    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      setIsLoading(true)
      const [dashboardData, listingData, orderData] = await Promise.all([
        dashboardService.getFarmerDashboard(),
        listingService.getMyListings(),
        orderService.getMyOrders(),
      ])

      if (isMounted) {
        setDashboard(dashboardData)
        setListings(listingData)
        setOrders(orderData)
        setLoadedUserPhone(user?.phone || null)
        setIsLoading(false)

        const cropIds = [...new Set(listingData.filter((listing) => listing.is_active).map((listing) => listing.cid))]
        setDemandForecasts({})
        setIsLoadingDemandForecasts(cropIds.length > 0)
        void cropIds.reduce<Promise<Array<readonly [number, DemandForecast | null]>>>((requests, cropId) => requests.then(async (results) => {
          const forecast = await aiService.predictDemand(cropId)
          return [...results, [cropId, forecast] as const]
        }), Promise.resolve([])).then((results) => {
          if (!isMounted) return
          setDemandForecasts(Object.fromEntries(results.filter(([, forecast]) => forecast).map(([cropId, forecast]) => [cropId, forecast as DemandForecast])))
          setIsLoadingDemandForecasts(false)
        })
      }
    }

    void loadDashboard()
    return () => {
      isMounted = false
    }
  }, [user?.phone])

  const isCurrentUserData = loadedUserPhone === user?.phone
  const currentDashboard = isCurrentUserData ? dashboard : null
  const currentListings = isCurrentUserData ? listings : []
  const currentOrders = isCurrentUserData ? orders : []
  const deliveredOrders = currentOrders.filter((order) => order.status === 'delivered')
  const calculatedTotalEarnings = deliveredOrders.reduce((total, order) => total + (Number(order.produce_price) || 0), 0)
  const totalEarnings = Math.max(currentDashboard?.total_earnings || 0, calculatedTotalEarnings)
  const monthlyEarnings = Math.min(currentDashboard?.monthly_earnings || 0, totalEarnings)

  const scrollToSection = (id: string) => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleNavClick = (label: string) => {
    if (label === activeNav) return
    setActiveNav(label)
    setDashboardMessage('')
    if (label === 'Add Listing') {
      setShowListingForm(true)
      return
    }
    if (label === 'My Profile') {
      if (!isProfileVisible) toggleProfile()
      scrollToSection('farmer-profile')
      return
    }
    if (isProfileVisible) toggleProfile()
    if (label === 'Edit Listing') {
      setShowListingForm(false)
      setIsEditingListings(true)
      setEditingListingId(null)
      scrollToSection('active-listings')
      return
    }
    const target = label === 'Home' ? 'farmer-overview' : label === 'My Crops' ? 'my-crops' : label === 'Orders' ? 'farmer-orders' : label === 'Demand Forecast' ? 'demand-forecast' : null
    if (target) scrollToSection(target)
    if (label === 'Earnings') {
      if (monthlyEarnings <= 0) {
        setDashboardMessage('Please wait for your first order this month.')
      } else {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1, 1)
        const monthName = nextMonth.toLocaleString('en-IN', { month: 'long' })
        setDashboardMessage(
          `Earnings this month: ${formatCurrency(monthlyEarnings)}. Next payout is scheduled on 1st ${monthName}.`
        )
      }
    }
    if (label === 'Profile') setDashboardMessage('Profile settings are ready for your farm details and pickup preferences.')
  }

  const acceptOrder = async (order: Order) => {
    setUpdatingOrderId(order.oid)
    setDashboardMessage('')
    try {
      const updatedOrder = await orderService.updateOrderStatus(order.oid, { status: 'clustered' })
      setOrders((current) => current.map((item) => item.oid === updatedOrder.oid ? updatedOrder : item))
      setDashboardMessage(`Order #${order.oid} was accepted and moved to clustered.`)
    } catch {
      setDashboardMessage(`We could not accept order #${order.oid}. Please try again.`)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const confirmPickup = async (order: Order) => {
    setUpdatingOrderId(order.oid)
    setDashboardMessage('')
    try {
      const updatedOrder = await orderService.updateOrderStatus(order.oid, { status: 'out_for_delivery' })
      setOrders((current) => current.map((item) => item.oid === updatedOrder.oid ? updatedOrder : item))
      setDashboardMessage(`Pickup confirmed for order #${order.oid}.`)
    } catch {
      setDashboardMessage(`We could not confirm pickup for order #${order.oid}. Please try again.`)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const getListingEditValues = (listing: Listing) =>
    listingEditValues[listing.lid] || {
      quantity: String(listing.quantity_available),
      price: String(listing.price_per_unit),
    }

  const updateListing = async (listing: Listing) => {
    const values = getListingEditValues(listing)
    const quantity = Number(values.quantity)
    const price = Number(values.price)
    if (!Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(price) || price <= 0) {
      setDashboardMessage('Enter a valid quantity and price.')
      return
    }

    setUpdatingListingId(listing.lid)
    setDashboardMessage('')
    try {
      const updatedListing = await listingService.updateListing(listing.lid, {
        quantity_available: quantity,
        price_per_unit: price,
      })
      setListings((current) => current.map((item) => item.lid === updatedListing.lid ? updatedListing : item))
      setListingEditValues((current) => ({ ...current, [listing.lid]: { quantity: String(updatedListing.quantity_available), price: String(updatedListing.price_per_unit) } }))
      setDashboardMessage(`${updatedListing.crop_name || 'Listing'} was updated successfully.`)
    } catch {
      setDashboardMessage('Unexpected error occurred.')
    } finally {
      setUpdatingListingId(null)
    }
  }

  const deleteListing = async (listing: Listing) => {
    setUpdatingListingId(listing.lid)
    setDashboardMessage('')
    try {
      await listingService.deleteListing(listing.lid)
      setListings((current) => current.filter((item) => item.lid !== listing.lid))
      setDashboardMessage(`${listing.crop_name || 'Listing'} was removed successfully.`)
    } catch {
      setDashboardMessage('Unexpected error occurred.')
    } finally {
      setUpdatingListingId(null)
    }
  }

  const toggleListingStatus = async (listing: Listing) => {
    setUpdatingListingId(listing.lid)
    setDashboardMessage('')
    try {
      const updatedListing = await listingService.toggleListingActive(listing.lid)
      setListings((current) => current.map((item) => item.lid === updatedListing.lid ? updatedListing : item))
      setDashboardMessage(
        `${updatedListing.crop_name || 'Listing'} is now ${updatedListing.is_active ? 'active' : 'inactive'}.`
      )
    } catch {
      setDashboardMessage('Unexpected error occurred.')
    } finally {
      setUpdatingListingId(null)
    }
  }

  const submitListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setListingSubmitted(false)
    setListingError('')
    setDashboardMessage('')
    setIsPublishingListing(true)

    try {
      const createdListing = await listingService.createListing({
        crop_name: listingName.trim(),
        quantity_available: Number(listingQuantity),
        price_per_unit: Number(listingPrice),
      })
      setListings((current) => [createdListing, ...current])
      setListingName('')
      setListingQuantity('')
      setListingPrice('')
      setListingImageUrl('')
      setListingSubmitted(true)
      setDashboardMessage(`${createdListing.crop_name || listingName} listing was added successfully.`)
      setShowListingForm(false)
      setActiveNav('My Crops')
    } catch {
      setListingError('Unexpected error occurred.')
    } finally {
      setIsPublishingListing(false)
    }
  }

  if (isRetailMode) {
    return (
      <RetailMarketplace
        embedded
        hideProfile
        onBackToFarmer={() => setIsRetailMode(false)}
      />
    )
  }

  return (
    <section className="section-shell anim-fade-up py-20">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-emerald-100 bg-white p-3 shadow-[0_20px_70px_rgba(16,185,129,0.08)] md:p-5">
        <div className="rounded-[1.6rem] bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Farmer Dashboard</div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900 md:text-3xl">
                Good morning, {user?.name || 'there'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setIsRetailMode(true)} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20">
                Switch to Retail Marketplace 🛒
              </button>
              <button type="button" onClick={() => handleNavClick('Add Listing')} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20">
                + Add crop
              </button>
            </div>
          </div>

          <div id="farmer-overview" className="scroll-mt-24 mt-5 flex gap-2 overflow-x-auto pb-2 md:gap-3">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition ${item === activeNav
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-emerald-700'
                  }`}
              >
                {item}
              </button>
            ))}
          </div>
          {activeNav === 'My Profile' && (
            <div id="farmer-profile" className="mt-5 scroll-mt-24 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">My Profile</div>
                  <h3 className="mt-1 text-xl font-black text-slate-900">{profileUser?.name || 'Farmer profile'}</h3>
                </div>
                <button type="button" onClick={toggleProfile} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-emerald-300 hover:text-emerald-700">
                  Hide profile
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Mobile number', value: profileUser?.phone },
                  { label: 'Address', value: profileUser?.address },
                  { label: 'Account number', value: profileUser?.account_num },
                  { label: 'IFSC code', value: profileUser?.ifsc },
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

          {activeNav === 'Home' && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: 'Income', value: isLoading || !isCurrentUserData ? '—' : formatCurrency(totalEarnings), note: 'Delivered earnings' },
              { label: 'Listings', value: isLoading || !isCurrentUserData ? '—' : String(currentListings.filter((item) => item.is_active).length), note: 'Active crops' },
              {
                label: 'Orders',
                value: isLoading || !isCurrentUserData ? '—' : String(currentOrders.length),
                note: 'Total orders',
              },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.35rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{item.value}</div>
                <div className="mt-1 text-sm text-slate-500">{item.note}</div>
              </div>
            ))}
          </div>
          )}

          {(activeNav === 'Home' || activeNav === 'Orders' || activeNav === 'Edit Listing') && (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            {(activeNav === 'Home' || activeNav === 'Edit Listing') && (
            <div className="space-y-5">
              <div id="active-listings" className="scroll-mt-24 rounded-[1.5rem] bg-slate-900 p-4 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Active listings</h3>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-300">
                    {isLoading || !isCurrentUserData ? '—' : `${currentListings.filter((item) => item.is_active).length} live`}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {!isLoading && isCurrentUserData && currentListings.length === 0 && (
                    <div className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">No listings available yet.</div>
                  )}
                  {currentListings.map((item) => (
                    <div key={item.lid} className="rounded-2xl bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-base font-bold">{item.crop_name || 'Unnamed crop'}</div>
                          <div className="text-xs text-slate-300">{formatQuantity(item.quantity_available)} available</div>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${item.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                          {item.is_active ? 'Live' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-300">
                        <span>Listing #{item.lid}</span>
                        <div className="flex items-center gap-3">
                          <span>{formatCurrency(item.price_per_unit)}/kg</span>
                          {isEditingListings && (
                            <button
                              type="button"
                              onClick={() => setEditingListingId(editingListingId === item.lid ? null : item.lid)}
                              className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-200 transition hover:bg-white/20"
                            >
                              {editingListingId === item.lid ? 'Close' : 'Edit'}
                            </button>
                          )}
                        </div>
                      </div>
                      {isEditingListings && editingListingId === item.lid && (() => {
                        const values = getListingEditValues(item)
                        const isUpdating = updatingListingId === item.lid
                        return (
                          <div className="mt-3 grid gap-2 border-t border-white/10 pt-3 md:grid-cols-[1fr_1fr_auto_auto_auto] md:items-end">
                            <label className="text-xs font-semibold text-slate-300">
                              Quantity (kg)
                              <input
                                type="number"
                                min="0"
                                value={values.quantity}
                                onChange={(event) => setListingEditValues((current) => ({ ...current, [item.lid]: { ...values, quantity: event.target.value } }))}
                                className="mt-1 w-full rounded-xl border-0 bg-white px-3 py-2 text-sm text-slate-900"
                              />
                            </label>
                            <label className="text-xs font-semibold text-slate-300">
                              Price / kg
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={values.price}
                                onChange={(event) => setListingEditValues((current) => ({ ...current, [item.lid]: { ...values, price: event.target.value } }))}
                                className="mt-1 w-full rounded-xl border-0 bg-white px-3 py-2 text-sm text-slate-900"
                              />
                            </label>
                            <button type="button" disabled={isUpdating} onClick={() => void updateListing(item)} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                              {isUpdating ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => void toggleListingStatus(item)}
                              className="rounded-full bg-amber-400/20 px-4 py-2 text-sm font-semibold text-amber-200 disabled:opacity-50"
                            >
                              {item.is_active ? 'Set inactive' : 'Set active'}
                            </button>
                            <button type="button" disabled={isUpdating} onClick={() => void deleteListing(item)} className="rounded-full bg-red-400/20 px-4 py-2 text-sm font-semibold text-red-200 disabled:opacity-50">
                              Delete
                            </button>
                          </div>
                        )
                      })()}
                    </div>
                  ))}
                </div>
              </div>

            </div>
            )}

            <div className="space-y-5">
              {activeNav === 'Home' && (
              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Upcoming pickups</h3>
                  <span className="text-sm text-emerald-700">
                    {currentOrders.filter((order) => order.status === 'clustered').length} clustered
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {currentOrders.filter((order) => order.status === 'clustered').length === 0 && (
                    <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-slate-600">
                      No clustered orders are waiting for pickup.
                    </div>
                  )}
                  {currentOrders.filter((order) => order.status === 'clustered').map((order) => (
                    <div key={order.oid} className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-3">
                      <div>
                        <div className="font-bold text-slate-900">Order #{order.oid}</div>
                        <div className="text-sm text-slate-600">
                          {order.crop_name || 'Crop not available'} · {formatQuantity(order.quantity)}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={updatingOrderId === order.oid}
                        onClick={() => void confirmPickup(order)}
                        className="shrink-0 rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingOrderId === order.oid ? 'Confirming...' : 'Confirm pickup'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {activeNav === 'Orders' && (
              <div id="farmer-orders" className="scroll-mt-24 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Orders</h3>
                </div>

                <div className="mt-4 space-y-3">
                  {!isLoading && isCurrentUserData && currentOrders.length === 0 && (
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">No orders available yet.</div>
                  )}
                  {currentOrders.map((order) => (
                    <div key={order.oid} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                      <div>
                        <div className="font-bold text-slate-900">{order.buyer_name || 'Buyer not available'}</div>
                        <div className="text-sm text-slate-500">
                          {order.crop_name || 'Crop not available'} · {formatQuantity(order.quantity)}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-700">
                          Amount: {formatCurrency(order.produce_price)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                          {formatOrderStatus(order.status)}
                        </span>
                        {order.status === 'placed' && (
                          <button
                            type="button"
                            disabled={updatingOrderId === order.oid}
                            onClick={() => void acceptOrder(order)}
                            className="text-xs font-bold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingOrderId === order.oid ? 'Accepting...' : 'Accept'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          </div>
          )}

          {showListingForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
          <form id="listing-form" onSubmit={submitListing} className="w-full max-w-2xl rounded-[1.75rem] border border-emerald-200/70 bg-white/95 p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Farmer inventory</div>
                <h3 className="mt-1 text-2xl font-black text-slate-900">Add crop listing</h3>
              </div>
              <button type="button" onClick={() => setShowListingForm(false)} className="text-sm font-semibold text-slate-500">Cancel</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Crop Name
                <input required value={listingName} onChange={(event) => setListingName(event.target.value)} placeholder="e.g. Tomato" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Available Quantity (kg)
                <input required type="number" min="1" value={listingQuantity} onChange={(event) => setListingQuantity(event.target.value)} placeholder="Quantity in kg" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Price per kg (₹)
                <input required type="number" min="1" value={listingPrice} onChange={(event) => setListingPrice(event.target.value)} placeholder="Price per kg" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="text-sm font-semibold text-slate-700 md:col-span-2">Image URL/Upload
                <input type="url" value={listingImageUrl} onChange={(event) => setListingImageUrl(event.target.value)} placeholder="Optional image URL" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
              </label>
            </div>
            <button
              type="submit"
              disabled={isPublishingListing}
              className="mt-6 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPublishingListing ? 'Publishing...' : 'Publish Listing'}
            </button>
            {listingSubmitted && <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Listing published successfully.</div>}
            {listingError && <div role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{listingError}</div>}
          </form>
          </div>}

          {activeNav === 'My Crops' && (
            <div id="my-crops" className="mt-6 scroll-mt-24">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">My Crops</div>
                  <h3 className="mt-1 text-2xl font-black text-slate-900">Your produce listings</h3>
                </div>
                <button type="button" onClick={() => handleNavClick('Edit Listing')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Edit listings</button>
              </div>
              {currentListings.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">No crops listed yet.</div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-3">
                  {currentListings.map((listing) => (
                    <article key={listing.lid} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                      <div className="h-28 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-200 via-lime-100 to-amber-100">
                        <img
                          src={listing.sample_img_url?.startsWith('http') ? listing.sample_img_url : getFarmerCropImage(listing)}
                          alt={listing.crop_name || 'Crop'}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            if (event.currentTarget.src.endsWith('/images/icon.png')) event.currentTarget.style.display = 'none'
                            else event.currentTarget.src = '/images/icon.png'
                          }}
                        />
                      </div>
                      <h3 className="mt-4 text-2xl font-black text-slate-900">{listing.crop_name || 'Unnamed crop'}</h3>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div className="flex justify-between"><span>Available</span><span className="font-semibold text-slate-800">{formatQuantity(listing.quantity_available)}</span></div>
                        <div className="flex justify-between"><span>Price / kg</span><span className="font-semibold text-slate-800">{formatCurrency(listing.price_per_unit)}</span></div>
                        <div className="flex justify-between"><span>Harvested</span><span className="font-semibold text-slate-800">{formatDate(listing.harvested_at)}</span></div>
                      </div>
                      <button type="button" onClick={() => { setActiveNav('Edit Listing'); setIsEditingListings(true); setEditingListingId(listing.lid) }} className="mt-5 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Edit Listing</button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeNav === 'Demand Forecast' && (
          <div id="demand-forecast" className="scroll-mt-24 mt-6 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Demand forecast</h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                AI forecast
              </span>
            </div>
            {isLoadingDemandForecasts && (
              <div className="mt-4 rounded-[1.25rem] bg-slate-50 p-4 text-sm text-slate-600">
                Preparing demand forecasts for your active crops...
              </div>
            )}
            {!isLoadingDemandForecasts && currentListings.filter((listing) => listing.is_active).length === 0 && (
              <div className="mt-4 rounded-[1.25rem] bg-slate-50 p-4 text-sm text-slate-600">
                Activate a crop listing to see its local demand forecast.
              </div>
            )}

            {!isLoadingDemandForecasts && currentListings.filter((listing) => listing.is_active).length > 0 && Object.keys(demandForecasts).length === 0 && (
              <div className="mt-4 rounded-[1.25rem] bg-amber-50 p-4 text-sm text-amber-800">
                Demand forecasts are temporarily unavailable. Please try again after checking your farm location.
              </div>
            )}

            {Object.values(demandForecasts).length > 0 && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {Object.values(demandForecasts).map((forecast) => {
                  const hasSurplus = forecast.supply_gap_kg < 0
                  return (
                    <article key={forecast.crop_id} className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-slate-900">{forecast.crop_name}</h4>
                          <p className="mt-1 text-xs text-slate-500">Next demand estimate · {forecast.search_radius_km} km radius</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${hasSurplus ? 'bg-sky-100 text-sky-700' : 'bg-orange-100 text-orange-700'}`}>
                          {hasSurplus ? 'Supply ahead' : 'Demand opportunity'}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500">Predicted demand</p>
                          <p className="mt-1 text-lg font-bold text-slate-900">{formatQuantity(forecast.predicted_demand_kg)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Active supply</p>
                          <p className="mt-1 text-lg font-bold text-slate-900">{formatQuantity(forecast.current_active_supply_kg)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Supply gap</p>
                          <p className={`mt-1 font-bold ${hasSurplus ? 'text-sky-700' : 'text-orange-700'}`}>
                            {forecast.supply_gap_kg > 0 ? '+' : ''}{formatQuantity(forecast.supply_gap_kg)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Avg. market price</p>
                          <p className="mt-1 font-bold text-slate-900">{formatCurrency(forecast.avg_market_price)} / kg</p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
          )}

          {activeNav === 'Earnings' && (
            <div id="farmer-earnings" className="mt-6 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Earnings breakdown</div>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Your farm income</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <div className="text-sm text-slate-600">Total earnings</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(totalEarnings)}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-600">This month</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(monthlyEarnings)}</div>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <div className="text-sm text-slate-600">Delivered orders</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">{deliveredOrders.length}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
