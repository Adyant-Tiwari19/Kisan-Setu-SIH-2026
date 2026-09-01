import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

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
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', paddingBottom: '1rem' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            width: '2.5rem', height: '2.5rem',
            borderRadius: '0.875rem',
            background: 'linear-gradient(135deg, var(--ff-deep) 0%, var(--ff-mint) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(27,67,50,0.25)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a9 9 0 0 0-9 9c0 4.17 2.84 7.67 6.69 8.69L12 22l2.31-2.31C18.16 18.67 21 15.17 21 11A9 9 0 0 0 12 2z" />
              <circle cx="12" cy="11" r="3" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--ff-navy)', letterSpacing: '-0.02em', lineHeight: 1 }}>Fresh Ferme</div>
            <div className="eyebrow" style={{ color: 'var(--ff-fresh)', marginTop: '0.15rem', fontSize: '0.6rem' }}>Farm to Market</div>
          </div>
        </Link>

        {/* Nav — desktop */}
        {isHome && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hidden-mobile">
            {['How it Works', 'Marketplace', 'For Farmers', 'For Buyers'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--ff-slate)',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--ff-deep)'; (e.target as HTMLElement).style.background = 'var(--ff-pale)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--ff-slate)'; (e.target as HTMLElement).style.background = 'transparent'; }}
              >
                {item}
              </a>
            ))}
          </nav>
        )}

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/sign-in" style={{
            padding: '0.5rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--ff-slate)',
            textDecoration: 'none',
            borderRadius: '100px',
            border: '1.5px solid rgba(27,67,50,0.2)',
            background: '#fff',
            transition: 'border-color 0.15s, color 0.15s',
          }}>
            Sign in
          </Link>
          <Link to="/join-now" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
            Join now
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .hidden-mobile { display: none !important; } }
      `}</style>
    </header>
  )
}