const metrics = [
  {
    value: '12.4K+',
    label: 'Farmers onboarded',
    sub: 'across 8 states',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ff-pale)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    value: '3.8K',
    label: 'Daily orders matched',
    sub: 'via AI smart matching',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ff-pale)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    value: '48%',
    label: 'Food saved from wastage',
    sub: 'vs traditional channels',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ff-pale)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12m0 0C9 8 4 9 4 4c3.6 0 6 1.6 8 4 2-2.4 4.4-4 8-4 0 5-5 6-8 8z" />
      </svg>
    ),
  },
]

export function ImpactBand() {
  return (
    <section
      style={{
        background: '#fff',
        paddingTop: '4rem',
        paddingBottom: '4rem',
        position: 'relative',
      }}
    >
      <div className="container">

        {/* Section label */}
        <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="eyebrow" style={{ color: 'var(--ff-fresh)' }}>Kisan Setu in numbers</span>
        </div>

        {/* Connected metrics */}
        <div
          className="scroll-reveal"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0',
            background: 'var(--ff-deep)',
            borderRadius: '1.75rem',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(27,67,50,0.25)',
          }}
        >
          {metrics.map((m, i) => (
            <div
              key={m.label}
              style={{
                padding: '2.5rem 2rem',
                position: 'relative',
                borderRight: i < metrics.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}
            >
              {/* Background pattern circle */}
              <div style={{
                position: 'absolute', top: '-20px', right: '-20px',
                width: '100px', height: '100px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
              }} />

              {/* Icon */}
              <div style={{ marginBottom: '0.75rem', opacity: 0.7 }}>{m.icon}</div>

              {/* Value */}
              <div style={{
                fontSize: '3rem',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}>
                {m.value}
              </div>

              {/* Label */}
              <div style={{ fontWeight: 700, color: 'var(--ff-pale)', fontSize: '1.05rem', lineHeight: 1.3 }}>
                {m.label}
              </div>

              {/* Sub */}
              <div style={{ fontSize: '0.82rem', color: 'rgba(216,243,220,0.6)', letterSpacing: '0.02em', marginTop: '0.25rem' }}>
                {m.sub}
              </div>

              {/* Accent bar */}
              <div style={{
                position: 'absolute', bottom: 0, left: '2rem',
                width: '2.5rem', height: '3px',
                background: 'var(--ff-yellow)',
                borderRadius: '2px',
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Decorative wave below */}
      <div className="wave-divider" style={{ marginTop: '4rem', marginBottom: '-1px' }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: '60px' }}>
          <path d="M0,40 C360,0 720,60 1080,20 C1260,0 1380,30 1440,40 L1440,60 L0,60 Z" fill="#f0faf4" />
        </svg>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .impact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
