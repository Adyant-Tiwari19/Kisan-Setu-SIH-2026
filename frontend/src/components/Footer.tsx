import { Link } from 'react-router-dom'

const nav = {
  Platform: ['How it Works', 'AI Matching', 'Pricing', 'Route Optimization'],
  Growers: ['Farmer Sign Up', 'FPO Registration', 'List Produce', 'Harvest Calendar'],
  Buyers: ['Retailer Sign Up', 'Bulk Buyers', 'Standing Orders', 'Quality Grades'],
  Company: ['About Us', 'Careers', 'Press Kit', 'Blog'],
}

export function Footer() {
  return (
    <footer style={{ background: 'var(--ff-navy)', color: 'rgba(255,255,255,0.7)' }}>

      {/* Main footer grid */}
      <div
        className="container"
        style={{
          paddingTop: '4rem',
          paddingBottom: '3rem',
          display: 'grid',
          gridTemplateColumns: '1.6fr repeat(4, 1fr)',
          gap: '3rem',
        }}
      >

        {/* Brand column */}
        <div>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, var(--ff-deep) 0%, var(--ff-mint) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2a9 9 0 0 0-9 9c0 4.17 2.84 7.67 6.69 8.69L12 22l2.31-2.31C18.16 18.67 21 15.17 21 11A9 9 0 0 0 12 2z" />
                <circle cx="12" cy="11" r="3" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>Fresh Ferme</div>
              <div style={{ fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ff-mint)', marginTop: '0.15rem' }}>Farm to Market</div>
            </div>
          </Link>

          <p style={{ fontSize: '0.875rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.5)', maxWidth: '18rem', marginBottom: '1.75rem' }}>
            India's most transparent AI-powered farm-to-market network. Connecting 12,400+ farmers with buyers across 8 states.
          </p>

          {/* Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { icon: '✉', text: 'hello@freshferme.ai' },
              { icon: '📞', text: '+91 98765 43210' },
              { icon: '📍', text: 'Bengaluru, India' },
            ].map(c => (
              <div key={c.text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>
                <span>{c.icon}</span>
                <span>{c.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nav columns */}
        {Object.entries(nav).map(([heading, links]) => (
          <div key={heading}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
              marginBottom: '1.25rem',
            }}>
              {heading}
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {links.map(link => (
                <li key={link}>
                  <a
                    href="#"
                    style={{
                      fontSize: '0.875rem',
                      color: 'rgba(255,255,255,0.55)',
                      textDecoration: 'none',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
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
          © 2026 Fresh Ferme Technologies Pvt. Ltd. · All rights reserved.
        </span>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {/* Trust badges */}
          {['APMC Compliant', 'FSSAI Registered', 'SSL Secured'].map(b => (
            <span key={b} style={{
              fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.04em',
            }}>
              ✓ {b}
            </span>
          ))}
        </div>

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
