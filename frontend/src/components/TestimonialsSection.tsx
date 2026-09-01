const testimonials = [
  {
    name: 'Ramesh Patil',
    role: 'Tomato farmer',
    location: 'Nashik, Maharashtra',
    image: '/farmer-portrait.png',
    quote:
      'Before Fresh Ferme, I was getting ₹8 per kg. Middlemen took everything. Now I get ₹14–16 directly. My kids got new school books this year for the first time.',
    result: '+85% farmgate income in 6 months',
    color: 'var(--ff-deep)',
    bg: 'var(--ff-pale)',
  },
  {
    name: 'Priya Mehta',
    role: 'Grocery chain owner',
    location: 'Mumbai, Maharashtra',
    image: '/retailer-portrait.png',
    quote:
      'My sourcing cost dropped by 18% and the quality is consistent. I know exactly where my produce comes from. My customers have noticed the difference — fresher is better.',
    result: '18% sourcing cost reduction',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
]

const partners = [
  'Amul FPO', 'NAFED', 'ITC Agri', 'Mother Dairy', 'SFAC India',
]

export function TestimonialsSection() {
  return (
    <section
      style={{ background: 'var(--ff-cream)', paddingTop: '5rem', paddingBottom: '5rem' }}
    >
      <div className="container">

        {/* Header */}
        <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span className="eyebrow text-fresh" style={{ display: 'block', marginBottom: '0.875rem' }}>Fresh from the field</span>
          <h2 className="display-lg" style={{ color: 'var(--ff-navy)', maxWidth: '30rem', margin: '0 auto' }}>
            Real results, real people.
          </h2>
        </div>

        {/* Testimonial cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', marginBottom: '4rem' }}>
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="scroll-reveal"
              style={{
                background: '#fff',
                borderRadius: '1.75rem',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(13,27,42,0.08)',
                border: '1px solid rgba(27,67,50,0.07)',
                animationDelay: `${i * 120}ms`,
              }}
            >
              {/* Top accent bar */}
              <div style={{ height: '4px', background: t.color }} />

              <div style={{ padding: '2rem' }}>
                {/* Quote mark */}
                <div style={{ fontSize: '3.5rem', lineHeight: 1, color: t.color, opacity: 0.15, fontFamily: 'Georgia, serif', marginBottom: '-0.5rem' }}>"</div>

                {/* Quote */}
                <blockquote style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.8,
                  color: 'var(--ff-slate)',
                  fontStyle: 'italic',
                  marginBottom: '1.5rem',
                  marginLeft: 0,
                }}>
                  "{t.quote}"
                </blockquote>

                {/* Result callout */}
                <div style={{
                  background: t.bg,
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
                  </svg>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: t.color }}>{t.result}</span>
                </div>

                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={t.image}
                    alt={t.name}
                    style={{
                      width: '3.25rem',
                      height: '3.25rem',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `2px solid ${t.color}33`,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ff-navy)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ff-muted)' }}>{t.role} · {t.location}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Partner logos strip */}
        <div className="scroll-reveal" style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em',
            textTransform: 'uppercase', color: 'var(--ff-muted)', marginBottom: '1.5rem',
          }}>
            Trusted by leading agri-businesses &amp; FPOs
          </div>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            {partners.map(p => (
              <div
                key={p}
                style={{
                  background: '#fff',
                  border: '1px solid rgba(27,67,50,0.1)',
                  borderRadius: '0.75rem',
                  padding: '0.6rem 1.5rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'var(--ff-slate)',
                  letterSpacing: '0.02em',
                }}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
