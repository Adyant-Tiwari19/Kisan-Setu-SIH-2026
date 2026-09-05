import { useState } from 'react'

type ComparisonItem = {
  title: string
  description: string
  icon: 'tag' | 'crate' | 'route' | 'leaf'
}

const beforeItems: ComparisonItem[] = [
  { title: 'Uncertain prices', description: 'Prices are negotiated late, with little market visibility.', icon: 'tag' },
  { title: 'Disconnected sourcing', description: 'Buyers spend hours finding reliable supply.', icon: 'crate' },
  { title: 'Delayed coordination', description: 'Calls, messages, and manual follow-ups slow every order.', icon: 'route' },
  { title: 'Produce wastage', description: 'Fresh harvest waits too long to reach the right buyer.', icon: 'leaf' },
]

const afterItems: ComparisonItem[] = [
  { title: 'Transparent prices', description: 'Clear price signals enable confident decisions.', icon: 'tag' },
  { title: 'Smart matching', description: 'Relevant supply and demand are connected faster.', icon: 'crate' },
  { title: 'One connected workflow', description: 'Listings, order updates, and coordination stay in one place.', icon: 'route' },
  { title: 'Faster, fresher movement', description: 'Better matching helps reduce avoidable wastage.', icon: 'leaf' },
]

function LineIcon({ name, muted = false }: { name: ComparisonItem['icon']; muted?: boolean }) {
  const color = muted ? '#9b9389' : 'var(--ff-deep)'
  const common = { fill: 'none', stroke: color, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.7 }

  if (name === 'tag') return <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" {...common}><path d="M20 13.5 13.5 20a2.1 2.1 0 0 1-3 0L4 13.5V5h8.5L20 11.5a1.4 1.4 0 0 1 0 2Z" /><circle cx="8.5" cy="8.5" r="1" /></svg>
  if (name === 'crate') return <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" {...common}><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="M3 7v10l9 4 9-4V7M12 11v10M7.5 5l9 4" /></svg>
  if (name === 'route') return <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" {...common}><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h2.2a3 3 0 0 0 3-3v-2a3 3 0 0 1 3-3H16" /></svg>
  return <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" {...common}><path d="M20 4C11 4 5 8.5 5 15c0 2.5 1.7 4 4 4 5.8 0 10-5.8 11-15Z" /><path d="M4 21c2.5-4.5 6.5-7.5 12-10" /></svg>
}

function RouteIllustration() {
  return (
    <svg className="benefits-route-art" aria-hidden="true" viewBox="0 0 720 180" preserveAspectRatio="none">
      <path className="benefits-route benefits-route-muted" d="M10 144c74-76 112 34 190-32 74-62 111 35 186-25 71-57 118 29 176-22 49-43 93-26 148-51" />
      <path className="benefits-route benefits-route-active" d="M368 150c71-61 102-2 163-52 50-41 102-16 179-84" />
      <circle cx="10" cy="144" r="5" className="benefits-route-dot" />
      <circle cx="710" cy="14" r="5" className="benefits-route-dot" />
    </svg>
  )
}

function ComparisonRow({ item, index, active, onHover }: { item: ComparisonItem; index: number; active: number | null; onHover: (value: number | null) => void }) {
  const highlighted = active === index
  return (
    <div
      className={`benefits-comparison-row${highlighted ? ' is-highlighted' : ''}`}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(index)}
      onBlur={() => onHover(null)}
      tabIndex={0}
    >
      <div className="benefits-row-icon"><LineIcon name={item.icon} muted /></div>
      <div><h4>{item.title}</h4><p>{item.description}</p></div>
    </div>
  )
}

export function Benefits() {
  const [activeRow, setActiveRow] = useState<number | null>(null)

  return (
    <section id="benefits" className="benefits-story">
      <div className="container">
        <div className="benefits-story-header scroll-reveal">
          <span className="eyebrow text-fresh">THE FRESH FERME DIFFERENCE</span>
          <h2 className="display-lg">From fragmented trade to a fresher, fairer flow.</h2>
          <p>See how Fresh Ferme turns uncertainty, delays, and wastage into a connected supply chain built for better decisions.</p>
        </div>

        <div className="benefits-comparison scroll-reveal">
          <RouteIllustration />
          <div className="benefits-side benefits-before">
            <div className="benefits-side-heading"><div className="benefits-side-mark"><LineIcon name="crate" muted /></div><div><span className="benefits-kicker">The old way</span><h3>Before Fresh Ferme</h3></div></div>
            <p className="benefits-side-intro">Good produce, held back by gaps in visibility and coordination.</p>
            <div className="benefits-items">{beforeItems.map((item, index) => <ComparisonRow key={item.title} item={item} index={index} active={activeRow} onHover={setActiveRow} />)}</div>
          </div>

          <div className="benefits-bridge" aria-hidden="true"><span>Fresh Ferme</span><svg viewBox="0 0 90 24" fill="none"><path d="M2 12h80M68 3l10 9-10 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div>

          <div className="benefits-side benefits-after">
            <div className="benefits-side-heading"><div className="benefits-side-mark"><LineIcon name="leaf" /></div><div><span className="benefits-kicker">The connected way</span><h3>With Fresh Ferme</h3></div></div>
            <p className="benefits-side-intro">A clearer path from harvest to buyer, with every handoff in view.</p>
            <div className="benefits-items">{afterItems.map((item, index) => <ComparisonRow key={item.title} item={item} index={index} active={activeRow} onHover={setActiveRow} />)}</div>
            <div className="benefits-endpoint"><LineIcon name="route" /><span>Farm to buyer, in one flow</span></div>
          </div>
        </div>

        <div className="benefits-outcome scroll-reveal"><div><LineIcon name="tag" /><span>Better visibility</span></div><strong>Better visibility. Faster matching. Less waste.</strong><div><LineIcon name="leaf" /><span>Fresher movement</span></div></div>
      </div>

      <style>{`
        .benefits-story { background: #fff; padding: 5.5rem 0 5rem; }
        .benefits-story-header { max-width: 45rem; margin: 0 auto 3.5rem; text-align: center; }
        .benefits-story-header .eyebrow { display: block; margin-bottom: .9rem; }
        .benefits-story-header h2 { color: var(--ff-navy); margin: 0 auto 1rem; }
        .benefits-story-header p { color: var(--ff-muted); font-size: 1rem; line-height: 1.75; max-width: 38rem; margin: 0 auto; }
        .benefits-comparison { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) 5.5rem minmax(0, 1fr); border: 1px solid rgba(27,67,50,.1); border-radius: 2rem; overflow: hidden; background: #eeeae3; box-shadow: 0 18px 55px rgba(13,27,42,.08); }
        .benefits-route-art { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; opacity: .42; }
        .benefits-route { fill: none; stroke-width: 2; stroke-linecap: round; stroke-dasharray: 2 10; }
        .benefits-route-muted { stroke: #b5aa9d; }
        .benefits-route-active { stroke: var(--ff-fresh); stroke-dasharray: 1 8; animation: benefitsRoute 8s linear infinite; }
        .benefits-route-dot { fill: var(--ff-fresh); }
        .benefits-side { position: relative; z-index: 1; padding: 3rem 2.5rem 2.75rem; }
        .benefits-before { background: rgba(239,235,228,.92); }
        .benefits-after { background: rgba(225,247,232,.94); }
        .benefits-side-heading { display: flex; align-items: center; gap: .9rem; }
        .benefits-side-mark { display: flex; align-items: center; justify-content: center; width: 3rem; height: 3rem; border-radius: 1rem; background: rgba(255,255,255,.7); }
        .benefits-after .benefits-side-mark { background: rgba(145,220,171,.32); }
        .benefits-kicker { display: block; color: #8c8377; font-size: .68rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; margin-bottom: .3rem; }
        .benefits-after .benefits-kicker { color: var(--ff-fresh); }
        .benefits-side h3 { color: var(--ff-navy); font-size: 1.65rem; line-height: 1.1; margin: 0; }
        .benefits-side-intro { min-height: 3.2rem; color: #726b63; font-size: .88rem; line-height: 1.65; margin: 1.35rem 0 1.5rem; max-width: 22rem; }
        .benefits-after .benefits-side-intro { color: #387052; }
        .benefits-items { display: grid; gap: .6rem; }
        .benefits-comparison-row { display: grid; grid-template-columns: 2.25rem 1fr; gap: .8rem; align-items: start; padding: .8rem .75rem; border: 1px solid transparent; border-radius: .9rem; outline: none; transition: background .2s ease, border-color .2s ease, transform .2s ease, opacity .2s ease; }
        .benefits-comparison-row:hover, .benefits-comparison-row:focus-visible, .benefits-comparison-row.is-highlighted { background: rgba(255,255,255,.67); border-color: rgba(27,67,50,.1); transform: translateY(-2px); }
        .benefits-before .benefits-comparison-row { opacity: .82; }
        .benefits-before .benefits-comparison-row:hover, .benefits-before .benefits-comparison-row:focus-visible, .benefits-before .benefits-comparison-row.is-highlighted { opacity: 1; }
        .benefits-after .benefits-comparison-row { border-left: 2px solid rgba(82,183,136,.28); }
        .benefits-row-icon { display: flex; align-items: center; justify-content: center; width: 2.25rem; height: 2.25rem; border-radius: .7rem; background: rgba(255,255,255,.46); }
        .benefits-after .benefits-row-icon { background: rgba(255,255,255,.72); }
        .benefits-comparison-row h4 { color: var(--ff-navy); font-size: .94rem; line-height: 1.3; margin: .1rem 0 .25rem; }
        .benefits-comparison-row p { color: #746d65; font-size: .78rem; line-height: 1.55; margin: 0; }
        .benefits-after .benefits-comparison-row p { color: #37684d; }
        .benefits-bridge { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .45rem; color: var(--ff-deep); background: rgba(255,255,255,.72); border-left: 1px solid rgba(27,67,50,.08); border-right: 1px solid rgba(27,67,50,.08); }
        .benefits-bridge span { writing-mode: vertical-rl; transform: rotate(180deg); color: var(--ff-deep); font-size: .65rem; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
        .benefits-bridge svg { width: 3.4rem; }
        .benefits-endpoint { display: flex; align-items: center; gap: .5rem; margin-top: 1.4rem; color: var(--ff-deep); font-size: .72rem; font-weight: 800; letter-spacing: .04em; }
        .benefits-endpoint svg { width: 1.1rem; height: 1.1rem; }
        .benefits-outcome { display: flex; align-items: center; justify-content: space-between; gap: 1rem; max-width: 52rem; margin: 2rem auto 0; padding: .9rem 1.25rem; border-top: 1px solid rgba(27,67,50,.12); border-bottom: 1px solid rgba(27,67,50,.12); color: var(--ff-deep); }
        .benefits-outcome div { display: flex; align-items: center; gap: .45rem; color: var(--ff-muted); font-size: .72rem; font-weight: 700; }
        .benefits-outcome svg { width: 1.25rem; height: 1.25rem; }
        .benefits-outcome strong { color: var(--ff-navy); font-size: .95rem; text-align: center; }
        @keyframes benefitsRoute { to { stroke-dashoffset: -72; } }
        @media (max-width: 800px) {
          .benefits-story { padding: 4.5rem 0 4rem; }
          .benefits-comparison { display: flex; flex-direction: column; overflow: visible; background: transparent; border: 0; box-shadow: none; gap: 0; }
          .benefits-route-art { height: 100%; opacity: .25; }
          .benefits-side { border: 1px solid rgba(27,67,50,.1); border-radius: 1.5rem; padding: 2rem 1.25rem; }
          .benefits-bridge { flex-direction: row; min-height: 4.5rem; border: 0; background: transparent; gap: .7rem; }
          .benefits-bridge span { writing-mode: initial; transform: none; }
          .benefits-bridge svg { width: 4.5rem; transform: rotate(90deg); }
          .benefits-side-intro { min-height: 0; }
          .benefits-outcome { flex-wrap: wrap; justify-content: center; }
          .benefits-outcome strong { order: -1; width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .benefits-route-active { animation: none; }
          .benefits-comparison-row { transition: none; }
        }
      `}</style>
    </section>
  )
}
