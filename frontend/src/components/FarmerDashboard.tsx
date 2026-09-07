import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService, type User } from '../services/authService'
import { dashboardService, type FarmerIncomeDashboard } from '../services/dashboardService'
import { listingService, type Listing } from '../services/listingService'
import { orderService, type Order } from '../services/orderService'
import { aiService, type DemandForecast } from '../services/aiService'
import { RetailMarketplace } from './RetailMarketplace'
import { useTranslation } from 'react-i18next'

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

const formatOrderDate = (value?: string) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `Placed on ${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
}

const getOrderStatusPresentation = (status: Order['status']) => {
  if (status === 'delivered') return { label: 'Delivered', className: 'bg-green-100 text-green-800 font-semibold', icon: '✓' }
  if (status === 'disputed') return { label: 'Cancelled', className: 'bg-red-50 text-red-700 font-medium', icon: '!' }
  return { label: status === 'placed' ? 'Pending' : formatOrderStatus(status), className: 'bg-emerald-50 text-emerald-700 font-medium', icon: '📦' }
}

const getFarmerCropImage = (listing: Listing) => {
  const filename = listing.sample_img_url?.split(/[\\/]/).pop()?.trim()
    || listing.crop_name?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
  return filename ? `/images/${encodeURIComponent(filename.endsWith('.jpg') ? filename : `${filename}.jpg`)}` : '/images/icon.png'
}

export function FarmerDashboard() {
  const navigate = useNavigate()
  const { user, isProfileVisible, toggleProfile } = useAuth()
  const { t } = useTranslation()
  const [profileUser, setProfileUser] = useState<User | null>(user)
  const [activeNav, setActiveNav] = useState('Home')
  const [isRetailMode, setIsRetailMode] = useState(false)
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
    if (label === activeNav && label !== 'Home') return
    setActiveNav(label)
    setDashboardMessage('')
    if (label === 'Home') {
      if (isProfileVisible) toggleProfile()
      navigate('/')
      return
    }
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
    const target = label === 'My Crops' ? 'my-crops' : label === 'Orders' ? 'farmer-orders' : label === 'Demand Forecast' ? 'demand-forecast' : null
    if (target) scrollToSection(target)
    if (label === 'Earnings') {
      if (monthlyEarnings <= 0) {
        setDashboardMessage(t('farmer.waitForFirstOrder'))
      } else {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1, 1)
        const monthName = nextMonth.toLocaleString('en-IN', { month: 'long' })
        setDashboardMessage(
          t('farmer.earningsMessage', { amount: formatCurrency(monthlyEarnings), month: monthName })
        )
      }
    }
    if (label === 'Profile') setDashboardMessage(t('farmer.profileReady'))
  }

  const acceptOrder = async (order: Order) => {
    setUpdatingOrderId(order.oid)
    setDashboardMessage('')
    try {
      const updatedOrder = await orderService.updateOrderStatus(order.oid, { status: 'clustered' })
      setOrders((current) => current.map((item) => item.oid === updatedOrder.oid ? updatedOrder : item))
      setDashboardMessage(t('farmer.orderAccepted', { id: order.oid }))
    } catch {
      setDashboardMessage(t('farmer.acceptOrderError', { id: order.oid }))
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
      setDashboardMessage(t('farmer.pickupConfirmed', { id: order.oid }))
    } catch {
      setDashboardMessage(t('farmer.pickupError', { id: order.oid }))
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
      setDashboardMessage(t('farmer.validQuantityPrice'))
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
      setDashboardMessage(t('farmer.updatedSuccessfully', { crop: updatedListing.crop_name || t('farmer.listings') }))
    } catch {
      setDashboardMessage(t('farmer.unexpectedError'))
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
      setDashboardMessage(t('farmer.removedSuccessfully', { crop: listing.crop_name || t('farmer.listings') }))
    } catch {
      setDashboardMessage(t('farmer.unexpectedError'))
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
      setDashboardMessage(t('farmer.unexpectedError'))
    } finally {
      setUpdatingListingId(null)
    }
  }

  const handleCancelListing = () => {
    setShowListingForm(false)
    if (!activeNav) setActiveNav('Home')
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
      setDashboardMessage(t('farmer.listingAdded', { crop: createdListing.crop_name || listingName }))
      setShowListingForm(false)
      setActiveNav('My Crops')
    } catch {
      setListingError(t('farmer.unexpectedError'))
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
      <div className="w-full max-w-full min-h-screen rounded-[2rem] border border-emerald-100 bg-white px-3 py-3 shadow-[0_20px_70px_rgba(16,185,129,0.08)] sm:px-6 md:py-5">
        <div className="rounded-[1.6rem] bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-6">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">{t('farmer.dashboard')}</div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900 md:text-3xl">
                {t('farmer.greeting', { name: user?.name || 'there' })}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setIsRetailMode(true)} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800">
                <span>{t('farmer.switchRetail')}</span>
              </button>
              <button type="button" onClick={() => handleNavClick('Add Listing')} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-700">
                <span aria-hidden="true">+</span>
                <span>{t('common.addCrop')}</span>
              </button>
            </div>
          </div>

          <div id="farmer-overview" className="no-scrollbar scroll-mt-24 mt-5 flex gap-2 overflow-x-auto whitespace-nowrap px-1 py-2 md:gap-3">
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
                {item === 'Home' ? t('common.home') : item === 'My Crops' ? t('common.myCrops') : item === 'My Profile' ? t('common.myProfile') : item === 'Orders' ? t('common.orders') : item}
              </button>
            ))}
          </div>
          {activeNav === 'My Profile' && (
            <div id="farmer-profile" className="mt-5 scroll-mt-24 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">{t('farmer.myProfile')}</div>
                  <h3 className="mt-1 text-xl font-black text-slate-900">{profileUser?.name || 'Farmer profile'}</h3>
                </div>
                <button type="button" onClick={toggleProfile} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-emerald-300 hover:text-emerald-700">
                  {t('common.close', 'बंद करें')}
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: t('farmer.mobileNumber'), value: profileUser?.phone },
                  { label: t('farmer.address'), value: profileUser?.address },
                  { label: t('farmer.accountNumber'), value: profileUser?.account_num },
                  { label: t('farmer.ifscCode'), value: profileUser?.ifsc },
                ].map((detail) => (
                  <div key={detail.label} className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{detail.label}</div>
                    <div className="mt-1 break-words text-sm font-bold text-slate-900">{detail.value || t('farmer.notAvailable')}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => navigate('/profile/edit')} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100">
                  {t('farmer.editProfile')}
                </button>
              </div>
            </div>
          )}
          {dashboardMessage && <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{dashboardMessage}</div>}

          {activeNav === 'Home' && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: t('farmer.income'), value: isLoading || !isCurrentUserData ? '—' : formatCurrency(totalEarnings), note: t('farmer.deliveredEarnings') },
              { label: t('farmer.listings'), value: isLoading || !isCurrentUserData ? '—' : String(currentListings.filter((item) => item.is_active).length), note: t('farmer.activeCrops') },
              {
                label: 'Orders',
                value: isLoading || !isCurrentUserData ? '—' : String(currentOrders.length),
                note: t('farmer.orders'),
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
                  <h3 className="text-lg font-bold">{t('farmer.activeListings')}</h3>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-300">
                    {isLoading || !isCurrentUserData ? '—' : `${currentListings.filter((item) => item.is_active).length} live`}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {!isLoading && isCurrentUserData && currentListings.length === 0 && (
                    <div className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">{t('farmer.noListings')}</div>
                  )}
                  {currentListings.map((item) => (
                    <div key={item.lid} className="rounded-2xl bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-base font-bold">{item.crop_name || 'Unnamed crop'}</div>
                          <div className="text-xs text-slate-300">{formatQuantity(item.quantity_available)} {t('farmer.available').toLowerCase()}</div>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${item.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                          {item.is_active ? t('farmer.activeListings') : t('farmer.notAvailable')}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-300">
                        <span>{t('farmer.listings')} #{item.lid}</span>
                        <div className="flex items-center gap-3">
                          <span>{formatCurrency(item.price_per_unit)}/kg</span>
                          {isEditingListings && (
                            <button
                              type="button"
                              onClick={() => setEditingListingId(editingListingId === item.lid ? null : item.lid)}
                              className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-200 transition hover:bg-white/20"
                            >
                              {editingListingId === item.lid ? t('common.close') : t('farmer.editListing')}
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
                              {t('farmer.quantityPlaceholder')}
                              <input
                                type="number"
                                min="0"
                                value={values.quantity}
                                onChange={(event) => setListingEditValues((current) => ({ ...current, [item.lid]: { ...values, quantity: event.target.value } }))}
                                className="mt-1 w-full rounded-xl border-0 bg-white px-3 py-2 text-sm text-slate-900"
                              />
                            </label>
                            <label className="text-xs font-semibold text-slate-300">
                              {t('farmer.pricePlaceholder')}
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
                              {isUpdating ? t('common.searching') : t('farmer.editListing')}
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => void toggleListingStatus(item)}
                              className="rounded-full bg-amber-400/20 px-4 py-2 text-sm font-semibold text-amber-200 disabled:opacity-50"
                            >
                              {item.is_active ? t('farmer.notAvailable') : t('farmer.activeListings')}
                            </button>
                            <button type="button" disabled={isUpdating} onClick={() => void deleteListing(item)} className="rounded-full bg-red-400/20 px-4 py-2 text-sm font-semibold text-red-200 disabled:opacity-50">
                              {t('farmer.cancel')}
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
                  <h3 className="text-lg font-bold text-slate-900">{t('farmer.upcomingPickups')}</h3>
                  <span className="text-sm text-emerald-700">
                    {currentOrders.filter((order) => order.status === 'clustered').length} clustered
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {currentOrders.filter((order) => order.status === 'clustered').length === 0 && (
                    <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-slate-600">
                      {t('farmer.noOrders')}
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
                        {updatingOrderId === order.oid ? t('common.searching') : t('farmer.upcomingPickups')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {activeNav === 'Orders' && (
              <div id="farmer-orders" className="scroll-mt-24 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{t('common.orders')}</h3>
                </div>

                <div className="mt-4 space-y-3">
                  {!isLoading && isCurrentUserData && currentOrders.length === 0 && (
                    <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-center shadow-sm">
                      <div className="text-3xl" aria-hidden="true">🛍️</div>
                      <p className="mt-2 font-bold text-slate-900">{t('farmer.noOrders')}</p>
                      <button type="button" onClick={() => { setIsRetailMode(true) }} className="mt-4 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                        {t('common.browseMarketplace')}
                      </button>
                    </div>
                  )}
                  {currentOrders.map((order) => (
                    <div key={order.oid} className="space-y-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-bold text-slate-900">Order #{order.oid}</div>
                        {(() => {
                          const status = getOrderStatusPresentation(order.status)
                          return <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${status.className}`}><span aria-hidden="true">{status.icon}</span>{status.label}</span>
                        })()}
                      </div>
                      <div>
                        <div className="text-base font-bold text-slate-900">{order.crop_name || t('farmer.notAvailable')}</div>
                        <div className="text-sm text-slate-600">{order.buyer_name || 'Buyer not available'} · {formatQuantity(order.quantity)} · {formatCurrency(order.quantity ? Number(order.produce_price || 0) / order.quantity : 0)} / kg</div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-sm">
                        <span className="text-slate-500">{formatOrderDate(order.ordered_at) || t('farmer.notAvailable')}</span>
                        <span className="font-bold text-slate-900">{t('marketplace.total')}: {formatCurrency(order.landed_price)}</span>
                      </div>
                      <div className="flex justify-end">
                        {order.status === 'placed' && (
                          <button
                            type="button"
                            disabled={updatingOrderId === order.oid}
                            onClick={() => void acceptOrder(order)}
                            className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingOrderId === order.oid ? t('common.searching') : t('farmer.orderAccepted')}
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

          {showListingForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md" onClick={handleCancelListing}>
          <form id="listing-form" onSubmit={submitListing} onClick={(event) => event.stopPropagation()} className="mx-4 w-full max-w-lg rounded-[1.75rem] border border-emerald-200/70 bg-white/95 p-5 shadow-2xl shadow-emerald-950/20 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">{t('farmer.farmerView')}</div>
                <h3 className="mt-1 text-2xl font-black text-slate-900">{t('farmer.addCropListing')}</h3>
              </div>
              <button type="button" onClick={handleCancelListing} className="text-sm font-semibold text-slate-500">{t('farmer.cancel')}</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Crop Name
                <input required value={listingName} onChange={(event) => setListingName(event.target.value)} placeholder={t('farmer.cropNamePlaceholder')} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Available Quantity (kg)
                <input required type="number" min="1" value={listingQuantity} onChange={(event) => setListingQuantity(event.target.value)} placeholder={t('farmer.quantityPlaceholder')} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Price per kg (₹)
                <input required type="number" min="1" value={listingPrice} onChange={(event) => setListingPrice(event.target.value)} placeholder={t('farmer.pricePlaceholder')} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
              </label>
            </div>
            <button
              type="submit"
              disabled={isPublishingListing}
              className="mt-6 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPublishingListing ? 'Publishing...' : 'Publish Listing'}
            </button>
            {listingSubmitted && <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{t('farmer.listingPublished')}</div>}
            {listingError && <div role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{listingError}</div>}
          </form>
          </div>}

          {activeNav === 'My Crops' && (
            <div id="my-crops" className="mt-6 scroll-mt-24">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{t('farmer.myCrops')}</div>
                  <h3 className="mt-1 text-2xl font-black text-slate-900">{t('farmer.yourProduceListings')}</h3>
                </div>
                <button type="button" onClick={() => handleNavClick('Edit Listing')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{t('farmer.editListings')}</button>
              </div>
              {currentListings.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">{t('farmer.noCrops')}</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
                        <div className="flex justify-between"><span>{t('farmer.pricePlaceholder')}</span><span className="font-semibold text-slate-800">{formatCurrency(listing.price_per_unit)}</span></div>
                        <div className="flex justify-between"><span>{t('farmer.harvested')}</span><span className="font-semibold text-slate-800">{formatDate(listing.harvested_at)}</span></div>
                      </div>
                      <button type="button" onClick={() => { setActiveNav('Edit Listing'); setIsEditingListings(true); setEditingListingId(listing.lid) }} className="mt-5 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">{t('farmer.editListing')}</button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeNav === 'Demand Forecast' && (
          <div id="demand-forecast" className="scroll-mt-24 mt-6 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{t('farmer.demandForecast')}</h3>
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
                          <p className="text-slate-500">{t('farmer.predictedDemand')}</p>
                          <p className="mt-1 text-lg font-bold text-slate-900">{formatQuantity(forecast.predicted_demand_kg)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">{t('farmer.activeSupply')}</p>
                          <p className="mt-1 text-lg font-bold text-slate-900">{formatQuantity(forecast.current_active_supply_kg)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">{t('farmer.supplyGap')}</p>
                          <p className={`mt-1 font-bold ${hasSurplus ? 'text-sky-700' : 'text-orange-700'}`}>
                            {forecast.supply_gap_kg > 0 ? '+' : ''}{formatQuantity(forecast.supply_gap_kg)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">{t('farmer.averageMarketPrice')}</p>
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
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{t('farmer.earningsBreakdown')}</div>
              <h3 className="mt-2 text-2xl font-black text-slate-900">{t('farmer.farmIncome')}</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <div className="text-sm text-slate-600">{t('farmer.totalEarnings')}</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(totalEarnings)}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-600">{t('farmer.thisMonth')}</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(monthlyEarnings)}</div>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <div className="text-sm text-slate-600">{t('farmer.deliveredOrders')}</div>
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
