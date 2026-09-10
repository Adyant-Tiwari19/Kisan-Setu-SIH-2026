const crops = [
  { name: 'Tomatoes', image: '/images/tomato.jpg', location: 'Nashik, Maharashtra', quantity: '240 kg', price: '₹28–34/kg', freshness: '< 12h harvest', background: '#fef2f2' },
  { name: 'Potatoes', image: '/images/potato.jpg', location: 'Agra, Uttar Pradesh', quantity: '480 kg', price: '₹22–28/kg', freshness: '< 18h harvest', background: '#fffbeb' },
  { name: 'Apples', image: '/images/apple.jpg', location: 'Shimla, Himachal Pradesh', quantity: '180 kg', price: '₹90–120/kg', freshness: '< 24h harvest', background: '#fff1f2' },
  { name: 'Onions', image: '/images/onion.jpg', location: 'Lasalgaon, Maharashtra', quantity: '1.2 tonnes', price: '₹18–22/kg', freshness: '< 6h harvest', background: '#faf5ff' },
]

export function MarketplacePreview() {
  return (
    <section
      id="marketplace"
      style={{ background: '#F0EBE4', paddingTop: '5rem', paddingBottom: '5rem' }}
    >
      <div className="container">
        <div className="scroll-reveal" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="eyebrow text-fresh" style={{ display: 'block', marginBottom: '0.75rem' }}>Live on Kisan Setu</span>
            <h2 className="display-md" style={{ color: 'var(--ff-navy)' }}>
              Fresh from the field,{' '}
              <span style={{ color: 'var(--ff-deep)' }}>right now.</span>
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#dcfce7', borderRadius: '100px', padding: '0.4rem 0.875rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>Live prices updating</span>
          </div>
        </div>

        <div className="scroll-reveal produce-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          {crops.map((crop, index) => (
              <div
                key={crop.name}
                className="produce-card scroll-reveal"
                style={{ animationDelay: `${index * 70}ms`, cursor: 'pointer', position: 'relative' }}
              >
                <div style={{ background: crop.background, height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={crop.image}
                    alt={crop.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ff-navy)', lineHeight: 1.2 }}>
                        {crop.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ff-muted)', marginTop: '0.2rem' }}>
                        {crop.location}
                      </div>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: 'rgba(43,86,77,0.07)', margin: '0.875rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ff-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Available</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ff-slate)' }}>{crop.quantity}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ff-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Price</div>
                      <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--ff-deep)', letterSpacing: '-0.02em' }}>{crop.price}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.875rem', background: '#f0fdf4', borderRadius: '0.5rem', padding: '0.4rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, color: '#15803d', textAlign: 'center' }}>
                    {crop.freshness}
                  </div>
                </div>
              </div>
          ))}
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
