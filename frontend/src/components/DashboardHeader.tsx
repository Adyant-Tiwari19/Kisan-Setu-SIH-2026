import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { orderService } from '../services/orderService'
import type { UserRole } from '../services/authService'

export interface NotificationItem {
  id: string
  title: string
  detail: string
  time: string
  type: 'order' | 'pickup' | 'alert' | 'success'
  read: boolean
}

// Role-specific notifications
const ROLE_NOTIFICATIONS: Record<UserRole, NotificationItem[]> = {
  farmer: [
    {
      id: 'notif-farmer-1',
      title: 'New Harvest Order Received',
      detail: 'Retailer ordered 120 kg Tomatoes. Prepare harvest for afternoon pickup run.',
      time: '10m ago',
      type: 'order',
      read: false,
    },
    {
      id: 'notif-farmer-2',
      title: 'Scheduled Cold Van Pickup',
      detail: 'Cold logistics pickup van will arrive at your farm hub today at 2:30 PM.',
      time: '1h ago',
      type: 'pickup',
      read: false,
    },
    {
      id: 'notif-farmer-3',
      title: 'Escrow Settlement Credited',
      detail: '₹6,840 has been transferred to your registered bank account for settled order.',
      time: '1d ago',
      type: 'success',
      read: true,
    },
    {
      id: 'notif-farmer-4',
      title: 'Tomato Regional Demand Surge',
      detail: 'Demand is up +18% in regional hubs. Optimal time to list fresh harvest.',
      time: '1d ago',
      type: 'alert',
      read: true,
    },
  ],
  retailer: [
    {
      id: 'notif-retailer-1',
      title: 'Produce Out for Delivery',
      detail: 'Your order #FDR-2048 is out for delivery. Estimated delivery window: 6:30 PM - 8:00 PM.',
      time: '15m ago',
      type: 'pickup',
      read: false,
    },
    {
      id: 'notif-retailer-2',
      title: 'Fresh Harvest Listed Nearby',
      detail: 'Green Valley FPO listed fresh Grade A Tomatoes just 4.8 km from your location.',
      time: '2h ago',
      type: 'alert',
      read: false,
    },
    {
      id: 'notif-retailer-3',
      title: 'Direct-to-Farmer Order Confirmed',
      detail: 'Farmer has accepted your produce order and packed it for cold transit.',
      time: '5h ago',
      type: 'order',
      read: false,
    },
    {
      id: 'notif-retailer-4',
      title: 'Escrow Protection Active',
      detail: 'Your payment is protected and only released after produce quality inspection.',
      time: '1d ago',
      type: 'success',
      read: true,
    },
  ],
  'bulk-buyer': [
    {
      id: 'notif-buyer-1',
      title: 'AI Multi-Factor Match Ranked',
      detail: 'Green Valley FPO matched your 500 kg Tomato RFQ at ₹32/kg delivered (95% AI Score).',
      time: '5m ago',
      type: 'order',
      read: false,
    },
    {
      id: 'notif-buyer-2',
      title: 'Cold Route Consolidation Saved 22%',
      detail: 'Consolidation with 3 regional institutional drop-offs reduced freight overhead.',
      time: '2h ago',
      type: 'pickup',
      read: false,
    },
    {
      id: 'notif-buyer-3',
      title: 'Purchase Order Contract Issued',
      detail: 'Bulk PO contract locked and escrow verified for 650 kg procurement.',
      time: '1d ago',
      type: 'success',
      read: true,
    },
  ],
}

export function DashboardHeader() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [openMenu, setOpenMenu] = useState<'notifications' | 'profile' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeRole: UserRole = user?.role || 'farmer'

  // Role-filtered notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    return ROLE_NOTIFICATIONS[activeRole] || ROLE_NOTIFICATIONS.farmer
  })

  // Whenever the active role changes or new orders exist, reload relevant notifications
  useEffect(() => {
    const roleDefaults = ROLE_NOTIFICATIONS[activeRole] || ROLE_NOTIFICATIONS.farmer
    
    orderService.getMyOrders().then((orders) => {
      if (orders && orders.length > 0) {
        const liveOrderNotifs: NotificationItem[] = orders.slice(0, 2).map((o) => ({
          id: `live-order-${o.oid}`,
          title: activeRole === 'farmer' ? `Order #${o.oid} from Buyer` : `Order #${o.oid} Status: ${o.status.toUpperCase()}`,
          detail: `${o.crop_name || 'Produce'} (${o.quantity} kg) · Total: ₹${o.landed_price.toLocaleString('en-IN')}`,
          time: 'Just now',
          type: o.status === 'delivered' ? 'success' : o.status === 'out_for_delivery' ? 'pickup' : 'order',
          read: false,
        }))

        const existingIds = new Set(liveOrderNotifs.map((n) => n.id))
        const filteredDefaults = roleDefaults.filter((n) => !existingIds.has(n.id))
        setNotifications([...liveOrderNotifs, ...filteredDefaults])
      } else {
        setNotifications(roleDefaults)
      }
    }).catch(() => {
      setNotifications(roleDefaults)
    })
  }, [activeRole])

  const unreadCount = notifications.filter((n) => !n.read).length
  const displayName = user?.name || 'Fresh Ferme Member'
  const roleName =
    activeRole === 'bulk-buyer'
      ? 'Bulk Buyer'
      : activeRole === 'retailer'
      ? 'Retailer'
      : 'Farmer'

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }
    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenu])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return '📦'
      case 'pickup':
        return '🚚'
      case 'alert':
        return '📈'
      case 'success':
        return '💰'
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100/90 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="section-shell flex min-h-20 items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group" aria-label="Fresh Ferme home">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-xl font-black text-white shadow-lg shadow-emerald-500/25 transition group-hover:scale-105">
            F
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-slate-900">Fresh Ferme</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700/80">
              from farm to market
            </div>
          </div>
        </Link>

        {/* Right Menu Area */}
        <div ref={menuRef} className="relative flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'notifications' ? null : 'notifications')}
              aria-expanded={openMenu === 'notifications'}
              aria-label="View notifications"
              className={`relative flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                openMenu === 'notifications'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700 shadow-sm'
              }`}
            >
              {/* Notification Bell Icon */}
              <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="hidden sm:inline">Notifications</span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Popup Box */}
            {openMenu === 'notifications' && (
              <div
                role="dialog"
                aria-label="Notifications menu"
                className="absolute right-0 top-full mt-2.5 z-50 w-80 sm:w-96 min-w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-slate-900/10"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">{roleName} Notifications</h3>
                    {unreadCount > 0 ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {unreadCount} New
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        All Caught Up
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No notifications for {roleName} right now.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`group relative rounded-xl border p-3 transition ${
                          n.read
                            ? 'border-transparent bg-slate-50 text-slate-600'
                            : 'border-emerald-100 bg-emerald-50/70 text-slate-900 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <span className="text-base leading-none mt-0.5">{getTypeIcon(n.type)}</span>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{n.title}</div>
                              <p className="mt-0.5 text-[11px] leading-4 text-slate-600">{n.detail}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] font-medium text-slate-400">{n.time}</span>
                            <button
                              type="button"
                              onClick={() => removeNotification(n.id)}
                              title="Dismiss"
                              className="text-slate-300 hover:text-slate-500 text-xs font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 border-t border-slate-100 pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null)
                      document.getElementById('farmer-orders')?.scrollIntoView({ behavior: 'smooth' })
                      document.getElementById('retail-orders')?.scrollIntoView({ behavior: 'smooth' })
                      document.getElementById('recent-purchases')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    View active orders & tracking →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')}
              aria-expanded={openMenu === 'profile'}
              aria-label="Open profile menu"
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                openMenu === 'profile'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700 shadow-sm'
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:inline font-medium text-slate-800">{displayName}</span>
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile Dropdown Popup Box */}
            {openMenu === 'profile' && (
              <div
                role="dialog"
                aria-label="User profile menu"
                className="absolute right-0 top-full mt-2.5 z-50 w-72 min-w-[280px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-slate-900/10"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-base font-black text-emerald-700">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-900">{displayName}</div>
                    <div className="text-xs font-medium text-slate-500 truncate">
                      {user?.phone || user?.email || 'Active Session'}
                    </div>
                  </div>
                </div>

                <div className="my-3 rounded-xl bg-emerald-50/80 p-3 border border-emerald-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Account Role
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-900">
                      {activeRole === 'farmer'
                        ? '🌾 Farmer / FPO'
                        : activeRole === 'retailer'
                        ? '🛒 Retail Buyer'
                        : '🏢 Institutional Bulk Buyer'}
                    </span>
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                      Active
                    </span>
                  </div>
                  {user?.address && (
                    <div className="mt-2 text-xs text-slate-500 border-t border-emerald-100/60 pt-1.5 truncate">
                      📍 {user.address}
                    </div>
                  )}
                </div>

                {/* Direct link to user's assigned workspace */}
                <div className="space-y-1">
                  <Link
                    to={activeRole === 'farmer' ? '/farmer' : activeRole === 'retailer' ? '/retailer' : '/buyer'}
                    onClick={() => setOpenMenu(null)}
                    className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition"
                  >
                    <span>
                      {activeRole === 'farmer'
                        ? 'Go to Farmer Dashboard'
                        : activeRole === 'retailer'
                        ? 'Go to Retail Marketplace'
                        : 'Go to Bulk Procurement'}
                    </span>
                    <span>→</span>
                  </Link>
                </div>

                <div className="mt-3 border-t border-slate-100 pt-2 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout()
                      navigate('/sign-in')
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <span>Switch Account (Sign in with different role)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50/60 py-2 text-xs font-bold text-red-600 hover:bg-red-100/70 transition"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
