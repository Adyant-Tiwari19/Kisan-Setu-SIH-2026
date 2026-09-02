import { useState } from 'react'

const roles = [
  {
    id: 'farmers',
    label: 'Farmers & FPOs',
    tagline: 'Predictable demand. Fairer pay.',
    color: 'var(--ff-deep)',
    bg: 'var(--ff-pale)',
    benefits: [
      {
        title: 'Fairer prices, always',
        desc: 'Bypass exploitative middlemen. Get transparent farmgate pricing with full market comparison.',
        stat: '+22% avg. income',
      },
      {
        title: 'Reliable demand pipeline',
        desc: 'See buyer demand 3–7 days ahead. Plan harvest and reduce guesswork on what to grow.',
        stat: '87% harvest utilised',
      },
      {
        title: 'Less wastage, more value',
        desc: 'AI matching ensures faster pickup after harvest. Fresh produce reaches buyers before it spoils.',
        stat: '48% less food waste',
      },
      {
        title: 'Simple mobile listing',
        desc: 'List your crop in under 2 minutes. No internet required for basic features — USSD supported.',
        stat: '2 min avg. listing',
      },
    ],
  },
  {
    id: 'buyers',
    label: 'Retailers & Buyers',
    tagline: 'Verified quality. Predictable supply.',
    color: '#7c3aed',
    bg: '#f5f3ff',
    benefits: [
      {
        title: 'Verified quality grades',
        desc: 'Every produce listing shows quality grade, freshness window, and harvest date — verified.',
        stat: '96% quality match',
      },
      {
        title: 'Predictable daily sourcing',
        desc: 'Plan your restocks days ahead. Set standing orders for recurring produce with auto-renewal.',
        stat: '3-day forward view',
      },
      {
        title: 'Transparent pricing',
        desc: 'See farmgate cost, logistics, and market comparison side-by-side. No hidden margins.',
        stat: '18% lower cost',
      },
      {
        title: 'Compare nearby suppliers',
        desc: 'Map-based supplier discovery. Filter by distance, grade, quantity, and freshness.',
        stat: '40+ local options',
      },
    ],
  },
  {
    id: 'logistics',
    label: 'Logistics Partners',
    tagline: 'Smarter routes. Fewer empty trips.',
    color: 'var(--ff-terra)',
    bg: 'var(--ff-terra-lt)',
    benefits: [
      {
        title: 'Consolidated pickup routes',
        desc: 'AI groups nearby farmers for single-run pickups. Reduce fuel, time, and vehicle wear.',
        stat: '31% cost saved',
      },
      {
        title: 'Fewer empty-leg trips',
        desc: 'Bidirectional load matching ensures return trips are also filled where possible.',
        stat: '65% vehicle utilisation',
      },
      {
        title: 'Dynamic scheduling',
        desc: 'Route updates when new orders match your geography. No manual replanning needed.',
        stat: 'Real-time alerts',
      },
      {
        title: 'Digital proof of delivery',
        desc: 'Photo + OTP-based delivery confirmation. Faster settlement. No paper trails.',
        stat: '< 2hr settlement',
      },
    ],
  },
]

export function Benefits() {
  const [active, setActive] = useState('farmers')
  const role = roles.find(r => r.id === active)!

  return (
    <section
      id="benefits"
      style={{ background: '#fff', paddingTop: '5rem', paddingBottom: '5rem' }}
    >
      <div className="container">

        {/* Header */}
        <div className="scroll-reveal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem', textAlign: 'center' }}>
          <span className="eyebrow text-fresh" style={{ display: 'block', marginBottom: '0.875rem' }}>Who it helps</span>
          <h2 className="display-lg" style={{ color: 'var(--ff-navy)', maxWidth: '32rem', marginBottom: '2rem' }}>
            Built for every link in the chain.
          </h2>

          {/* Tab bar */}
          <div className="tab-bar">
            {roles.map(r => (
              <button
                key={r.id}
                id={r.id === 'farmers' ? 'for-farmers' : r.id === 'buyers' ? 'for-buyers' : undefined}
                className={`tab-btn${active === r.id ? ' active' : ''}`}
                onClick={() => setActive(r.id)}
                style={active === r.id ? { background: role.color } : {}}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel */}
        <div
          key={active}
          style={{
            borderRadius: '1.75rem',
            overflow: 'hidden',
            border: '1px solid rgba(27,67,50,0.08)',
            display: 'grid',
            gridTemplateColumns: '1fr 1.4fr',
            boxShadow: '0 12px 48px rgba(13,27,42,0.08)',
            animation: 'scaleIn 0.3s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          {/* Left: color panel */}
          <div style={{
            background: role.color,
            padding: '3rem 2.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
                {role.label}
              </div>
              <h3 className="display-md" style={{ color: '#fff', marginBottom: '1.25rem' }}>
                {role.tagline}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.75, maxWidth: '18rem' }}>
                Fresh Ferme is purpose-built for how {role.id === 'logistics' ? 'logistics partners' : role.id} work in India — with regional language support, offline capability, and transparent workflows.
              </p>
            </div>

            {/* Stats strip */}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem' }}>
              {role.benefits.slice(0, 2).map(b => (
                <div key={b.title} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ff-yellow)', letterSpacing: '-0.03em' }}>{b.stat}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.2rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{b.title.split(',')[0]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: benefit list */}
          <div style={{ background: role.bg, padding: '3rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {role.benefits.map((b, i) => (
                <div
                  key={b.title}
                  style={{
                    background: '#fff',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    border: '1px solid rgba(27,67,50,0.06)',
                    boxShadow: '0 2px 12px rgba(13,27,42,0.04)',
                    animation: `fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms both`,
                  }}
                >
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '2rem', height: '2rem',
                    borderRadius: '0.5rem',
                    background: role.color,
                    marginBottom: '0.875rem',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="white">
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ff-navy)', marginBottom: '0.4rem', lineHeight: 1.3 }}>{b.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--ff-muted)', lineHeight: 1.7 }}>{b.desc}</div>
                  <div style={{ marginTop: '0.75rem', fontWeight: 800, fontSize: '0.82rem', color: role.color }}>{b.stat}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .benefits-panel { grid-template-columns: 1fr !important; }
          .benefits-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
