import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logomain.png'

export function Header() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navItems = [
    { label: 'Home', href: '/#hero' },
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Benefits', href: '/#benefits' },
  ]
  const dashboardPath = user?.backendRole === 'FARMER_FPO' || user?.role === 'farmer'
    ? '/farmer'
    : user?.backendRole === 'BULK_BUYER' || user?.role === 'bulk-buyer'
      ? '/buyer'
      : '/retailer'

  return (
    <header
      className="anim-slide-down"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(250,247,240,0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(27,67,50,0.08)',
      }}
    >
      <div className="container header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.85rem', paddingBottom: '0.85rem' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src={logo}
            alt="Kisan Setu"
            style={{ width: 'clamp(6.5rem, 12vw, 9rem)', height: 'auto', objectFit: 'contain' }}
          />
        </Link>

        {/* Desktop navigation */}
        <nav className="header-nav-desktop" aria-label="Primary navigation">
          {navItems.map(item => (
            <a key={item.label} href={item.href} className="header-nav-link">
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTAs */}
        <div className="header-actions">
          {isAuthenticated ? (
            <button type="button" onClick={() => navigate(dashboardPath)} className="btn-primary header-dashboard">
              Return to Dashboard ➔
            </button>
          ) : (
            <>
              <Link to="/sign-in" className="header-sign-in">Sign in</Link>
              <Link to="/join-now" className="btn-primary header-join">Join now</Link>
            </>
          )}
          <button
            type="button"
            className="header-menu-button"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(open => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="header-nav-mobile" aria-label="Mobile navigation">
          <Link to={isAuthenticated ? dashboardPath : '/sign-in'} onClick={() => setIsMenuOpen(false)}>
            {isAuthenticated ? 'Return to Dashboard ➔' : 'Sign In / Log In'}
          </Link>
          {navItems.map(item => (
            <a key={item.label} href={item.href} onClick={() => setIsMenuOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>
      )}

      <style>{`
        .header-inner { width: 100%; padding-inline: 1rem; }
        .header-nav-desktop { position: absolute; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 0.25rem; }
        .header-inner > a { flex-shrink: 0; }
        .header-nav-link { position: relative; padding: 0.55rem 0.8rem; color: var(--ff-slate); font-size: 0.84rem; font-weight: 650; text-decoration: none; border-radius: 0.6rem; transition: color 0.2s, background 0.2s; }
        .header-nav-link:hover { color: var(--ff-deep); background: var(--ff-pale); }
        .header-actions { display: flex; flex-shrink: 0; align-items: center; gap: 0.65rem; }
        .header-sign-in { padding: 0.5rem 1.05rem; color: var(--ff-slate); font-size: 0.84rem; font-weight: 700; text-decoration: none; border: 1px solid rgba(27,67,50,0.18); border-radius: 999px; background: rgba(255,255,255,0.7); transition: border-color 0.2s, color 0.2s, background 0.2s; }
        .header-sign-in:hover { color: var(--ff-deep); border-color: var(--ff-mint); background: #fff; }
        .header-join { padding: 0.55rem 1.15rem; font-size: 0.84rem; }
        .header-dashboard { flex-shrink: 0; padding: 0.55rem 1rem; font-size: 0.82rem; }
        .header-menu-button, .header-nav-mobile { display: none; }
        @media (max-width: 900px) {
          .header-nav-link { padding-inline: 0.5rem; }
        }
        @media (max-width: 720px) {
          .header-nav-desktop { display: none; }
          .header-sign-in { display: inline-flex; flex-shrink: 0; align-items: center; padding: 0.35rem 0.5rem; border: 0; background: transparent; color: var(--ff-deep); font-size: 0.82rem; font-weight: 650; }
          .header-dashboard { max-width: 12rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-inline: 0.7rem; }
          .header-join { padding-inline: 0.95rem; }
          .header-menu-button { display: inline-flex; width: 2.5rem; height: 2.5rem; flex-direction: column; align-items: center; justify-content: center; gap: 0.28rem; border: 1px solid rgba(27,67,50,0.15); border-radius: 0.75rem; background: #fff; }
          .header-menu-button span { display: block; width: 1.05rem; height: 2px; border-radius: 999px; background: var(--ff-deep); }
          .header-nav-mobile { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.65rem 1rem; border-top: 1px solid rgba(27,67,50,0.08); background: rgba(250,247,240,0.98); }
          .header-nav-mobile a { display: block; padding: 0.75rem 0; color: var(--ff-slate); font-size: 0.95rem; font-weight: 650; text-decoration: none; border-bottom: 1px solid rgba(27,67,50,0.07); }
          .header-nav-mobile a:first-child { color: var(--ff-deep); font-weight: 800; }
          .header-nav-mobile a:last-child { border-bottom: 0; }
        }
      `}</style>
    </header>
  )
}