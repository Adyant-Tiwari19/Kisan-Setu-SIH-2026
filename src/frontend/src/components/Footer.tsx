import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/icon.png'

export function Footer() {
  const { pathname } = useLocation()
  const isAuthPage = pathname === '/sign-in' || pathname === '/join-now'

  return (
    <footer style={{ background: 'var(--ff-navy)', color: 'rgba(255,255,255,0.7)' }}>

      {/* Main footer grid */}
      <div
        className="container footer-grid"
        style={{
          paddingTop: '4rem',
          paddingBottom: '3rem',
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr 1fr',
          gap: '3rem',
        }}
      >

        {/* Brand column */}
        <div>
          <Link to="/" style={{ display: 'inline-flex', textDecoration: 'none', marginBottom: '1.5rem' }}>
            <img src={logo} alt="Kisan Setu" style={{ width: '4.5rem', height: '4.5rem', objectFit: 'contain' }} />
          </Link>

          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.62)', maxWidth: '21rem', margin: 0 }}>
            Connecting farmers and buyers through smarter, fairer farm-to-market trade.
          </p>

        </div>

        <div>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
            marginBottom: '1.25rem',
          }}>
            Contact Us
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <a href="mailto:adyant.tiwari.ug25@nsut.ac.in" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
              adyant.tiwari.ug25@nsut.ac.in
            </a>
            <a href="tel:+919599824578" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
              +91 95998 24578
            </a>
            <a href="tel:+917838029059" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
              +91 78380 29059
            </a>
          </div>
        </div>

        {!isAuthPage && (
          <div>
            <div style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
              marginBottom: '1.25rem',
            }}>
              Account
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <Link to="/sign-in" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
                Login
              </Link>
              <Link to="/join-now" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
                Join Now
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .footer-grid { grid-template-columns: 1fr !important; }
          .footer-bottom { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>
    </footer>
  )
}
