import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { authService, type User } from '../services/authService'
import { dashboardService, type FarmerIncomeDashboard } from '../services/dashboardService'
import { listingService, type Listing } from '../services/listingService'
import { orderService, type Order } from '../services/orderService'
import { RetailMarketplace } from './RetailMarketplace'

const navItems = ['Home', 'My Crops', 'My Profile', 'Edit Listing', 'Orders', 'Demand Forecast', 'Earnings', 'Retail Dashboard']

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

const formatQuantity = (value: number) =>
  `${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg`

const formatOrderStatus = (status: Order['status']) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())

export function FarmerDashboard() {
  const { user, isProfileVisible, toggleProfile } = useAuth()
  const [profileUser, setProfileUser] = useState<User | null>(user)
  const [activeNav, setActiveNav] = useState('Home')
  const [showListingForm, setShowListingForm] = useState(false)
  const [listingName, setListingName] = useState('')
  const [listingQuantity, setListingQuantity] = useState('')
  const [listingPrice, setListingPrice] = useState('')
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

  useEffect(() => {
    let isMounted = true
    setProfileUser(user)
    void authService.getCurrentUserProfile().then((profile) => {
      if (isMounted) setProfileUser(profile)
    }).catch(() => {
      // Keep the authenticated session values when the profile endpoint is unavailable.
    })
    return () => {
      isMounted = false
    }
  }, [user?.phone])

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
      }
    }

    void loadDashboard()
    return () => {
      isMounted = false
    }
  }, [user?.phone])

  useEffect(() => {
    if (isProfileVisible) {
      setActiveNav('My Profile')
      scrollToSection('farmer-profile')
    } else if (activeNav === 'My Profile') {
      setActiveNav('Home')
    }
  }, [isProfileVisible])

  const isCurrentUserData = loadedUserPhone === user?.phone
  const currentDashboard = isCurrentUserData ? dashboard : null
  const currentListings = isCurrentUserData ? listings : []
  const currentOrders = isCurrentUserData ? orders : []

  const scrollToSection = (id: string) => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleNavClick = (label: string) => {
    setActiveNav(label)
    setDashboardMessage('')
    if (label === 'Retail Dashboard') return
    if (label === 'Add Listing') {
      setShowListingForm(true)
      scrollToSection('listing-form')
      return
    }
    if (label === 'My Profile') {
      toggleProfile()
      setActiveNav(isProfileVisible ? 'Home' : 'My Profile')
      if (!isProfileVisible) scrollToSection('farmer-profile')
      return
    }
    if (label === 'Edit Listing') {
      if (isEditingListings) {
        setIsEditingListings(false)
        setEditingListingId(null)
        setActiveNav('Home')
        return
      }
      setShowListingForm(false)
      setIsEditingListings(true)
      setEditingListingId(null)
      scrollToSection('active-listings')
      return
    }
    const target = label === 'Home' ? 'farmer-overview' : label === 'My Crops' ? 'active-listings' : label === 'Orders' ? 'farmer-orders' : label === 'Demand Forecast' ? 'demand-forecast' : null
    if (target) scrollToSection(target)
    if (label === 'Earnings') {
      if (!currentDashboard || currentDashboard.monthly_earnings <= 0) {
        setDashboardMessage('Please wait for your first order this month.')
      } else {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1, 1)
        const monthName = nextMonth.toLocaleString('en-IN', { month: 'long' })
        setDashboardMessage(
          `Earnings this month: ${formatCurrency(currentDashboard.monthly_earnings)}. Next payout is scheduled on 1st ${monthName}.`
        )
      }
    }
    if (label === 'Profile') setDashboardMessage('Profile settings are ready for your farm details and pickup preferences.')
  }

  const viewAllOrders = () => {
    setActiveNav('Orders')
    requestAnimationFrame(() => {
      document.getElementById('farmer-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
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
      setListingSubmitted(true)
      setDashboardMessage(`${createdListing.crop_name || listingName} listing was added successfully.`)
      setActiveNav('My Crops')
    } catch {
      setListingError('Unexpected error occurred.')
    } finally {
      setIsPublishingListing(false)
    }
  }

  if (activeNav === 'Retail Dashboard') {
    return (
      <section className="section-shell py-8 md:py-12">
        <div key="retail-dashboard" className="anim-fade-up">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm md:mb-10 md:px-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Farmer workspace</div>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">Retail marketplace</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('Home')}
              className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              ← Back to farmer dashboard
            </button>
          </div>
          <RetailMarketplace embedded />
        </div>
      </section>
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
            <button type="button" onClick={() => handleNavClick('Add Listing')} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20">
              + Add crop
            </button>
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
          {isProfileVisible && (
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
            </div>
          )}
          {dashboardMessage && <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{dashboardMessage}</div>}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: 'Income', value: currentDashboard ? formatCurrency(currentDashboard.total_earnings) : '—', note: 'Delivered earnings' },
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

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
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

            <div className="space-y-5">
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

              <div id="farmer-orders" className="scroll-mt-24 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Orders</h3>
                  <button type="button" onClick={viewAllOrders} className="text-sm font-semibold text-emerald-700">View all</button>
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
            </div>
          </div>

          {showListingForm && <form id="listing-form" onSubmit={submitListing} className="scroll-mt-24 mt-6 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900">Add crop listing</h3>
              <button type="button" onClick={() => setShowListingForm(false)} className="text-sm font-semibold text-slate-500">Cancel</button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input required value={listingName} onChange={(event) => setListingName(event.target.value)} placeholder="Crop name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input required type="number" min="1" value={listingQuantity} onChange={(event) => setListingQuantity(event.target.value)} placeholder="Quantity in kg" className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input required type="number" min="1" value={listingPrice} onChange={(event) => setListingPrice(event.target.value)} placeholder="Price per kg" className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <button
              type="submit"
              disabled={isPublishingListing}
              className="mt-4 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPublishingListing ? 'Publishing...' : 'Publish listing'}
            </button>
            {listingSubmitted && <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Listing published successfully.</div>}
            {listingError && <div role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{listingError}</div>}
          </form>}

          <div id="demand-forecast" className="scroll-mt-24 mt-6 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Demand forecast</h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                AI forecast
              </span>
            </div>

            <div className="mt-4 rounded-[1.25rem] bg-slate-50 p-4 text-sm text-slate-600">
              Demand forecasts will appear here when forecast data is available for your listings.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
