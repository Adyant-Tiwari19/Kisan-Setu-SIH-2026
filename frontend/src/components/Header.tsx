import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logomain.png'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navItems = [
    { label: 'Home', href: '/#hero' },
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Benefits', href: '/#benefits' },
  ]

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
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.85rem', paddingBottom: '0.85rem' }}>
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
          <Link to="/sign-in" className="header-sign-in">
            Sign in
          </Link>
          <Link to="/join-now" className="btn-primary header-join">
            Join now
          </Link>
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
          {navItems.map(item => (
            <a key={item.label} href={item.href} onClick={() => setIsMenuOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>
      )}

      <style>{`
        .header-nav-desktop { position: absolute; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 0.25rem; }
        .header-nav-link { position: relative; padding: 0.55rem 0.8rem; color: var(--ff-slate); font-size: 0.84rem; font-weight: 650; text-decoration: none; border-radius: 0.6rem; transition: color 0.2s, background 0.2s; }
        .header-nav-link:hover { color: var(--ff-deep); background: var(--ff-pale); }
        .header-actions { display: flex; align-items: center; gap: 0.65rem; }
        .header-sign-in { padding: 0.5rem 1.05rem; color: var(--ff-slate); font-size: 0.84rem; font-weight: 700; text-decoration: none; border: 1px solid rgba(27,67,50,0.18); border-radius: 999px; background: rgba(255,255,255,0.7); transition: border-color 0.2s, color 0.2s, background 0.2s; }
        .header-sign-in:hover { color: var(--ff-deep); border-color: var(--ff-mint); background: #fff; }
        .header-join { padding: 0.55rem 1.15rem; font-size: 0.84rem; }
        .header-menu-button, .header-nav-mobile { display: none; }
        @media (max-width: 900px) {
          .header-nav-link { padding-inline: 0.5rem; }
        }
        @media (max-width: 720px) {
          .header-nav-desktop, .header-sign-in { display: none; }
          .header-join { padding-inline: 0.95rem; }
          .header-menu-button { display: inline-flex; width: 2.5rem; height: 2.5rem; flex-direction: column; align-items: center; justify-content: center; gap: 0.28rem; border: 1px solid rgba(27,67,50,0.15); border-radius: 0.75rem; background: #fff; }
          .header-menu-button span { display: block; width: 1.05rem; height: 2px; border-radius: 999px; background: var(--ff-deep); }
          .header-nav-mobile { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.65rem max(24px, calc((100% - 1200px) / 2)); border-top: 1px solid rgba(27,67,50,0.08); background: rgba(250,247,240,0.98); }
          .header-nav-mobile a { padding: 0.75rem 0; color: var(--ff-slate); font-size: 0.95rem; font-weight: 650; text-decoration: none; border-bottom: 1px solid rgba(27,67,50,0.07); }
          .header-nav-mobile a:last-child { border-bottom: 0; }
        }
      `}</style>
    </header>
  )
}