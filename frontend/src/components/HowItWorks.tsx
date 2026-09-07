const stages = [
  {
    label: 'Farmer Onboards',
    desc: 'Simple registration with crop profile and location.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: 'Lists Harvest',
    desc: 'Crop type, quantity, quality grade, and available date.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    label: 'AI Smart Match',
    desc: 'Algorithm aligns supply with nearby demand in real time.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    highlight: true,
  },
  {
    label: 'Fair Price Set',
    desc: 'Farmgate, logistics, and market rates shown transparently.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    label: 'Pickup & Delivery',
    desc: 'Consolidated routes reduce cost and preserve freshness.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 5v3h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    label: 'Secure Settlement',
    desc: 'Fair payouts with full traceability and buyer confirmation.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{ background: '#f0faf4', paddingTop: '5rem', paddingBottom: '0' }}
    >
      <div className="container">
        {/* Header */}
        <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span className="eyebrow text-fresh" style={{ display: 'block', marginBottom: '0.875rem' }}>How it works</span>
          <h2 className="display-lg" style={{ color: 'var(--ff-navy)', maxWidth: '36rem', margin: '0 auto' }}>
            The journey from harvest to happy customers.
          </h2>
        </div>

        {/* Desktop: horizontal journey */}
        <div className="scroll-reveal" style={{ position: 'relative' }}>

          {/* Dotted path line */}
          <div className="journey-path" style={{
            position: 'absolute',
            top: '2.5rem',
            left: '5%',
            right: '5%',
            height: '2px',
            background: 'repeating-linear-gradient(90deg, var(--ff-mint) 0, var(--ff-mint) 8px, transparent 8px, transparent 18px)',
            zIndex: 0,
          }} />

          {/* Stages */}
          <div className="journey-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '0.5rem',
            position: 'relative',
            zIndex: 1,
          }}>
            {stages.map((stage, i) => (
              <div
                key={stage.label}
                className="scroll-reveal"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  animationDelay: `${i * 80}ms`,
                }}
              >
                {/* Node */}
                <div style={{
                  width: '5rem',
                  height: '5rem',
                  borderRadius: '50%',
                  background: stage.highlight ? 'var(--ff-deep)' : '#fff',
                  border: `2px solid ${stage.highlight ? 'var(--ff-deep)' : 'var(--ff-mint)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: stage.highlight
                    ? '0 8px 24px rgba(27,67,50,0.3)'
                    : '0 4px 16px rgba(27,67,50,0.08)',
                  color: stage.highlight ? '#fff' : 'var(--ff-deep)',
                  marginBottom: '1.25rem',
                  transition: 'transform 0.2s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {stage.icon}
                </div>

                {/* Step number */}
                <div style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--ff-fresh)',
                  marginBottom: '0.35rem',
                }}>
                  Step {String(i + 1).padStart(2, '0')}
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ff-navy)', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                  {stage.label}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ff-muted)', lineHeight: 1.65 }}>
                  {stage.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="wave-divider" style={{ marginTop: '4rem' }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: '60px' }}>
          <path d="M0,20 C480,60 960,0 1440,30 L1440,60 L0,60 Z" fill="#fff" />
        </svg>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .journey-grid { grid-template-columns: repeat(3,minmax(0,1fr)) !important; }
        }
        @media (max-width: 600px) {
          .journey-grid { display: flex !important; flex-direction: column; align-items: stretch; gap: 1rem !important; overflow: hidden; }
          .journey-path { display: none; }
          .journey-grid > div { display: grid !important; grid-template-columns: 4rem 1fr; column-gap: 1rem; align-items: center; text-align: left !important; }
          .journey-grid > div > div:first-child { grid-row: span 3; width: 4rem !important; height: 4rem !important; margin: 0 !important; }
          .journey-grid > div > div:nth-child(2), .journey-grid > div > div:nth-child(3), .journey-grid > div > div:nth-child(4) { margin-bottom: 0 !important; }
        }
      `}</style>
    </section>
  )
}