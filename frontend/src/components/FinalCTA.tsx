import { Link } from 'react-router-dom'

export function FinalCTA() {
  return (
    <section
      style={{
        background: 'var(--ff-deep)',
        paddingTop: '5.5rem',
        paddingBottom: '5.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background crop-row pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          repeating-linear-gradient(
            90deg,
            transparent, transparent 20px,
            rgba(255,255,255,0.025) 20px,
            rgba(255,255,255,0.025) 22px
          )
        `,
        pointerEvents: 'none',
      }} />

      {/* Decorative circle */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: '360px', height: '360px', borderRadius: '50%',
        background: 'rgba(82,183,136,0.08)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', left: '-60px',
        width: '240px', height: '240px', borderRadius: '50%',
        background: 'rgba(242,162,0,0.06)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
        <div className="scroll-reveal">
          <span className="eyebrow" style={{ color: 'var(--ff-mint)', display: 'block', marginBottom: '1.25rem' }}>
            Join Fresh Ferme
          </span>
          <h2
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.75rem)',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.06,
              letterSpacing: '-0.04em',
              maxWidth: '28rem',
              margin: '0 auto 1.25rem',
            }}
          >
            Grow better trade, together.
          </h2>
          <p style={{
            color: 'rgba(216,243,220,0.7)',
            fontSize: '1.075rem',
            lineHeight: 1.8,
            maxWidth: '32rem',
            margin: '0 auto 3rem',
          }}>
            Whether you grow it, buy it, or move it — Fresh Ferme is built for you.
            Join India's most transparent farm-to-market network.
          </p>

          {/* Three CTAs */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/join-now" className="btn-light">
              Join as Farmer
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link to="/join-now" className="btn-outline-light">
              Join as Buyer
            </Link>
            <a href="mailto:hello@freshferme.ai" className="btn-outline-light">
              Talk to Us
            </a>
          </div>

          {/* Trust strip */}
          <div style={{
            display: 'flex', gap: '2.5rem', justifyContent: 'center',
            flexWrap: 'wrap', marginTop: '3rem',
            paddingTop: '3rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}>
            {[
              { icon: '🔒', text: 'Secure UPI payouts' },
              { icon: '📱', text: 'Works on 2G networks' },
              { icon: '🌐', text: '8 regional languages' },
              { icon: '✅', text: 'APMC & FSSAI compliant' },
            ].map(t => (
              <div key={t.text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>{t.icon}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(216,243,220,0.6)', letterSpacing: '0.02em' }}>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
