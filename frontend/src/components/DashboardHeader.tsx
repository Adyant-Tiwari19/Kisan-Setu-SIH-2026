import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuth } from '../context/AuthContext'

export function DashboardHeader() {
  const navigate = useNavigate()
  const { user, toggleProfile } = useAuth()
  const [openMenu, setOpenMenu] = useState<'profile' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = user?.name || 'Fresh Ferme Member'

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
      <div className="section-shell flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 md:min-h-20 md:px-8 md:py-4">
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
          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')}
              aria-expanded={openMenu === 'profile'}
              aria-label="Open profile menu"
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${openMenu === 'profile'
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

                <button
                  type="button"
                  onClick={() => {
                    toggleProfile()
                    setOpenMenu(null)
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  View my profile
                </button>

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
