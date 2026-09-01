const produce = [
  {
    name: 'Cherry Tomatoes',
    location: 'Nashik, Maharashtra',
    grade: 'A',
    qty: '240 kg',
    price: '₹28–34/kg',
    freshness: '< 12h harvest',
    color: '#dc2626',
    bg: '#fef2f2',
    icon: '🍅',
    tag: 'High demand',
    tagColor: 'var(--ff-terra)',
  },
  {
    name: 'Red Onions',
    location: 'Lasalgaon, Maharashtra',
    grade: 'A+',
    qty: '1.2 tonnes',
    price: '₹18–22/kg',
    freshness: '< 6h harvest',
    color: '#7c3aed',
    bg: '#f5f3ff',
    icon: '🧅',
    tag: 'Bulk available',
    tagColor: '#7c3aed',
  },
  {
    name: 'Baby Spinach',
    location: 'Hosur, Tamil Nadu',
    grade: 'A',
    qty: '80 kg',
    price: '₹42–50/kg',
    freshness: '< 8h harvest',
    color: 'var(--ff-deep)',
    bg: 'var(--ff-pale)',
    icon: '🥬',
    tag: 'Trending',
    tagColor: 'var(--ff-fresh)',
  },
  {
    name: 'Alphonso Mangoes',
    location: 'Ratnagiri, Maharashtra',
    grade: 'GI Tagged',
    qty: '150 kg',
    price: '₹180–220/kg',
    freshness: '< 24h harvest',
    color: '#d97706',
    bg: '#fffbeb',
    icon: '🥭',
    tag: 'Premium',
    tagColor: '#d97706',
  },
]

export function MarketplacePreview() {
  return (
    <section
      id="marketplace"
      style={{ background: '#fff', paddingTop: '5rem', paddingBottom: '5rem' }}
    >
      <div className="container">

        {/* Header */}
        <div className="scroll-reveal" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="eyebrow text-fresh" style={{ display: 'block', marginBottom: '0.75rem' }}>Live on Fresh Ferme</span>
            <h2 className="display-md" style={{ color: 'var(--ff-navy)' }}>
              Fresh from the field,{' '}
              <span style={{ color: 'var(--ff-deep)' }}>right now.</span>
            </h2>
          </div>

          {/* Live indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#dcfce7', borderRadius: '100px',
            padding: '0.4rem 0.875rem',
          }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#16a34a',
              display: 'inline-block',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>Live prices updating</span>
          </div>
        </div>

        {/* Produce grid */}
        <div
          className="scroll-reveal"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}
        >
          {produce.map((p, i) => (
            <div
              key={p.name}
              className="produce-card scroll-reveal"
              style={{
                animationDelay: `${i * 70}ms`,
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {/* Produce color block with icon */}
              <div style={{
                background: p.bg,
                padding: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3.5rem',
                lineHeight: 1,
                position: 'relative',
              }}>
                {p.icon}
                {/* Tag */}
                <span style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  background: '#fff',
                  color: p.tagColor,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '100px',
                  border: `1px solid ${p.tagColor}33`,
                }}>
                  {p.tag}
                </span>
              </div>

              {/* Details */}
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ff-navy)', lineHeight: 1.2 }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ff-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      {p.location}
                    </div>
                  </div>
                  <span style={{
                    background: p.color + '18',
                    color: p.color,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.4rem',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}>
                    Grade {p.grade}
                  </span>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(27,67,50,0.07)', margin: '0.875rem 0' }} />

                {/* Qty, freshness, price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ff-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Qty</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ff-slate)' }}>{p.qty}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ff-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Price range</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: p.color, letterSpacing: '-0.02em' }}>{p.price}</div>
                  </div>
                </div>

                {/* Freshness badge */}
                <div style={{
                  marginTop: '0.875rem',
                  background: '#f0fdf4',
                  borderRadius: '0.5rem',
                  padding: '0.4rem 0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#15803d' }}>{p.freshness}</span>
                </div>

                {/* CTA */}
                <button style={{
                  marginTop: '0.875rem',
                  width: '100%',
                  background: 'var(--ff-deep)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  padding: '0.6rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#153728')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--ff-deep)')}
                >
                  View listing →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Browse all link */}
        <div className="scroll-reveal" style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <a href="/marketplace" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            fontWeight: 700, fontSize: '0.9rem', color: 'var(--ff-deep)',
            textDecoration: 'none',
            borderBottom: '2px solid var(--ff-mint)',
            paddingBottom: '0.1rem',
          }}>
            Browse all listings
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        @media (max-width: 900px) {
          .produce-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 500px) {
          .produce-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
