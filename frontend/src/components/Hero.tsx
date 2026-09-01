import { Link } from 'react-router-dom'

const floatingBadges = [
  { label: 'Fair Price', sub: '₹12/kg above APMC', color: 'var(--ff-deep)', top: '12%', left: '-8%' },
  { label: 'AI Match', sub: 'Best buyer found', color: '#7c3aed', top: '60%', left: '-10%' },
  { label: 'Freshness Tracked', sub: '< 24h harvest', color: 'var(--ff-terra)', top: '10%', right: '-8%' },
  { label: 'Same-day Delivery', sub: 'Pickup 6am–9am', color: '#d97706', top: '68%', right: '-6%' },
]

export function Hero() {
  return (
    <section
      id="hero"
      style={{
        background: 'var(--ff-cream)',
        paddingTop: '5rem',
        paddingBottom: '0',
        overflow: 'hidden',
      }}
    >
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', minHeight: '80vh' }}>

        {/* ── Left: Text ─────────────────────────────────── */}
        <div style={{ paddingBottom: '4rem' }}>

          {/* Eyebrow */}
          <div
            className="anim-fade-up"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--ff-pale)',
              border: '1px solid rgba(82,183,136,0.35)',
              borderRadius: '100px',
              padding: '0.35rem 0.875rem 0.35rem 0.5rem',
              marginBottom: '1.75rem',
              animationDelay: '0ms',
            }}
          >
            <span style={{
              width: '1.5rem', height: '1.5rem', borderRadius: '50%',
              background: 'var(--ff-deep)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="10" height="10" viewBox="0 0 20 20" fill="white">
                <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                <circle cx="10" cy="10" r="3" fill="white" />
              </svg>
            </span>
            <span className="eyebrow text-fresh" style={{ fontSize: '0.68rem' }}>AI-powered farm-to-market network</span>
          </div>

          {/* Headline */}
          <h1
            className="anim-fade-up display-xl"
            style={{
              color: 'var(--ff-navy)',
              marginBottom: '1.5rem',
              animationDelay: '80ms',
            }}
          >
            From Farm<br />
            to Market,{' '}
            <span style={{
              color: 'var(--ff-deep)',
              position: 'relative',
              display: 'inline-block',
            }}>
              Fairer
              <svg style={{ position: 'absolute', bottom: '-4px', left: 0, width: '100%' }} viewBox="0 0 120 8" preserveAspectRatio="none" height="6">
                <path d="M2 5 Q30 1 60 5 Q90 9 118 5" stroke="var(--ff-yellow)" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>{' '}and{' '}
            <span style={{ color: 'var(--ff-fresh)' }}>Smarter.</span>
          </h1>

          {/* Subtext */}
          <p
            className="anim-fade-up body-lg"
            style={{
              color: 'var(--ff-slate)',
              maxWidth: '30rem',
              marginBottom: '2.25rem',
              animationDelay: '160ms',
            }}
          >
            Fresh Ferme connects farmers, FPOs, retailers, and bulk buyers through transparent pricing,
            AI-driven matching, and faster, fresher deliveries — directly from field to shelf.
          </p>

          {/* CTAs */}
          <div
            className="anim-fade-up"
            style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem', animationDelay: '240ms' }}
          >
            <Link to="/role-selection" className="btn-primary">
              Explore Marketplace
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link to="/join-now" className="btn-secondary">
              Join as a Farmer
            </Link>
          </div>

          {/* Trust badges */}
          <div
            className="anim-fade-up"
            style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', animationDelay: '320ms' }}
          >
            {[
              { icon: '🏛️', text: '12.4K+ farmers onboarded' },
              { icon: '✅', text: 'APMC compliant' },
              { icon: '🔒', text: 'Secure payouts' },
            ].map(b => (
              <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.875rem' }}>{b.icon}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ff-muted)', letterSpacing: '0.01em' }}>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Visual ──────────────────────────────── */}
        <div
          className="anim-scale-in"
          style={{
            position: 'relative',
            alignSelf: 'flex-end',
            animationDelay: '200ms',
          }}
        >
          {/* Main image frame */}
          <div style={{
            borderRadius: '2rem 2rem 0 0',
            overflow: 'hidden',
            position: 'relative',
            aspectRatio: '4/3',
            background: 'linear-gradient(160deg, var(--ff-pale) 0%, var(--ff-pale) 100%)',
            border: '1px solid rgba(27,67,50,0.12)',
            boxShadow: '0 32px 80px rgba(27,67,50,0.18)',
          }}>
            <img
              src="/hero-farm.png"
              alt="Farm to market journey — farmer, produce, and buyer"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Gradient overlay at bottom */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
              background: 'linear-gradient(to top, rgba(27,67,50,0.35), transparent)',
            }} />
            {/* Bottom overlay tag */}
            <div style={{
              position: 'absolute', bottom: '1.25rem', left: '1.25rem',
              background: 'rgba(27,67,50,0.85)',
              backdropFilter: 'blur(12px)',
              borderRadius: '0.875rem',
              padding: '0.75rem 1.25rem',
              color: '#fff',
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.7, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Live today</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>3,840 orders matched</div>
            </div>
          </div>

          {/* Floating badges */}
          {floatingBadges.map((b, i) => (
            <div
              key={b.label}
              className="float-badge anim-float"
              style={{
                position: 'absolute',
                top: b.top,
                ...(b.left ? { left: b.left } : {}),
                ...(b.right ? { right: b.right } : {}),
                animationDelay: `${i * 0.6}s`,
                animationDuration: `${3 + i * 0.4}s`,
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: b.color, display: 'inline-block', marginRight: '0.4rem', verticalAlign: 'middle' }} />
              <strong style={{ color: 'var(--ff-navy)' }}>{b.label}</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--ff-muted)', marginTop: '0.1rem' }}>{b.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave divider */}
      <div className="wave-divider" style={{ marginTop: '-2px' }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: '60px' }}>
          <path d="M0,0 C240,60 480,60 720,30 C960,0 1200,0 1440,40 L1440,60 L0,60 Z" fill="#ffffff" />
        </svg>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #hero > .container {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
            min-height: auto !important;
          }
        }
      `}</style>
    </section>
  )
}