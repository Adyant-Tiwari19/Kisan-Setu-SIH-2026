import { Link } from 'react-router-dom'
import logo from '../assets/KISAN-SETU_logo.jpeg'

export function Footer() {
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
            <a href="mailto:hello@freshferme.ai" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
              hello@freshferme.ai
            </a>
            <a href="tel:+919876543210" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
              +91 98765 43210
            </a>
          </div>
        </div>

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
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

      {/* Bottom bar */}
      <div
        className="container"
        style={{
          paddingTop: '1.5rem',
          paddingBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
          © 2026 Kisan Setu Technologies Pvt. Ltd. · All rights reserved.
        </span>

        

        {/* Social */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['Twitter', 'LinkedIn', 'Instagram'].map(s => (
            <a
              key={s}
              href="#"
              style={{
                width: '2rem', height: '2rem',
                borderRadius: '0.5rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none', fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.4)',
                fontWeight: 700,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
            >
              {s[0]}
            </a>
          ))}
        </div>
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
