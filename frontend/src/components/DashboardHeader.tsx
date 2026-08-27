import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

const orderNotifications = [
  {
    id: 'notif-1',
    title: 'Order confirmed',
    detail: 'Your latest harvest order #FDR-2048 has been confirmed by buyer.',
    time: '15m ago',
    type: 'success',
  },
  {
    id: 'notif-2',
    title: 'Pickup reminder',
    detail: 'Scheduled pickup slot today at 2:30 PM (Tomato, 150 kg).',
    time: '2h ago',
    type: 'alert',
  },
  {
    id: 'notif-3',
    title: 'Demand surge alert',
    detail: 'Tomato & Onion regional demand is trending +18% higher this week.',
    time: '1d ago',
    type: 'info',
  },
]

export function DashboardHeader() {
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState<'notifications' | 'profile' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const user = authService.getCurrentUser()
  const displayName = user?.name || 'Fresh Ferme Member'
  const roleName =
    user?.role === 'bulk-buyer'
      ? 'Bulk Buyer'
      : user?.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
      : 'Farmer'

  // Close menus when clicking outside
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
    await authService.logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100/90 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="section-shell flex min-h-20 items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3" aria-label="Fresh Ferme home">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-xl font-black text-white shadow-lg shadow-emerald-500/25">
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
          {/* Orders Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'notifications' ? null : 'notifications')}
              aria-expanded={openMenu === 'notifications'}
              aria-label="View order notifications"
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                openMenu === 'notifications'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Orders</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-bold text-white">
                {orderNotifications.length}
              </span>
            </button>

            {/* Orders Dropdown Popup Box */}
            {openMenu === 'notifications' && (
              <div
                role="dialog"
                aria-label="Order notifications"
                className="absolute right-0 top-12 z-50 w-80 sm:w-96 min-w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-slate-900/5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Order notifications</h3>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {orderNotifications.length} New
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenMenu(null)}
                    className="text-xs font-medium text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {orderNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="group rounded-xl border border-transparent bg-slate-50 p-3 transition hover:border-emerald-100 hover:bg-emerald-50/60"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              notification.type === 'success'
                                ? 'bg-emerald-500'
                                : notification.type === 'alert'
                                ? 'bg-amber-500'
                                : 'bg-sky-500'
                            }`}
                          />
                          <span className="text-sm font-bold text-slate-900">{notification.title}</span>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium text-slate-400">
                          {notification.time}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-slate-600">
                        {notification.detail}
                      </p>
                    </div>
                  ))}
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
                    View all orders & history →
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
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                openMenu === 'profile'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700'
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
                className="absolute right-0 top-12 z-50 w-72 min-w-[280px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-slate-900/5"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-base font-black text-emerald-700">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-900">{displayName}</div>
                    <div className="text-xs font-medium text-slate-500 truncate">
                      {user?.phone || user?.email || 'Active session'}
                    </div>
                  </div>
                </div>

                <div className="my-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                  <span className="text-xs font-semibold text-emerald-800">Current Role</span>
                  <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                    {roleName}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-slate-600">
                  <Link
                    to="/role-selection"
                    onClick={() => setOpenMenu(null)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
                  >
                    <span>Switch Role / View</span>
                    <span className="text-xs text-slate-400">→</span>
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50/50 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 hover:border-red-200"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
