import { useEffect, useRef, useState } from 'react'

type Hotspot = {
  title: string
  description: string
  side: 'before' | 'after'
  top: string
  left?: string
  right?: string
  point: string
}

const hotspots: Hotspot[] = [
  { title: 'Price guesswork', description: 'No clear market signal.', side: 'before', top: '14%', left: '6%', point: '20% 29%' },
  { title: 'Too many calls', description: 'Finding supply takes hours.', side: 'before', top: '66%', left: '11%', point: '34% 69%' },
  { title: 'Harvest waiting', description: 'Freshness loses value with time.', side: 'before', top: '26%', right: '52%', point: '44% 45%' },
  { title: 'Broken handoffs', description: 'Updates live across too many places.', side: 'before', top: '76%', right: '47%', point: '44% 78%' },
  { title: 'Clear price signal', description: 'Decisions made with confidence.', side: 'after', top: '13%', right: '5%', point: '78% 25%' },
  { title: 'Smart match', description: 'Relevant demand finds supply faster.', side: 'after', top: '61%', right: '7%', point: '70% 66%' },
  { title: 'Freshness in motion', description: 'Better coordination reduces waiting.', side: 'after', top: '29%', right: '28%', point: '62% 48%' },
  { title: 'One visible flow', description: 'Listings, orders, and delivery stay connected.', side: 'after', top: '77%', right: '28%', point: '86% 78%' },
]

function HotspotLabel({ hotspot, active, onActive }: { hotspot: Hotspot; active: boolean; onActive: (title: string | null) => void }) {
  return (
    <button
      type="button"
      className={`benefits-hotspot benefits-hotspot-${hotspot.side}${active ? ' is-active' : ''}`}
      style={{ top: hotspot.top, ...(hotspot.left ? { left: hotspot.left } : {}), ...(hotspot.right ? { right: hotspot.right } : {}) }}
      onMouseEnter={() => onActive(hotspot.title)}
      onMouseLeave={() => onActive(null)}
      onFocus={() => onActive(hotspot.title)}
      onBlur={() => onActive(null)}
    >
      <strong>{hotspot.title}</strong>
      <span>{hotspot.description}</span>
    </button>
  )
}

function HarvestMap({ lively = false }: { lively?: boolean }) {
  return (
    <svg className="benefits-map-art" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="1000" height="520" fill={lively ? '#496f48' : '#69705e'} />
      <path d="M0 58 188 0h175L260 145 0 178Z" fill={lively ? '#73955d' : '#777b68'} />
      <path d="m330 0 230 0-70 145-250 17Z" fill={lively ? '#557f4f' : '#656d5d'} />
      <path d="m580 0 180 0 35 152-242-7Z" fill={lively ? '#8b9d58' : '#737967'} />
      <path d="m770 0 230 0v170l-198-18Z" fill={lively ? '#6d8e4d' : '#6b7263'} />
      <path d="M0 190 250 158l-22 180L0 385Z" fill={lively ? '#668c4c' : '#777c6b'} />
      <path d="m270 165 242-18-25 187-244 4Z" fill={lively ? '#8c9d55' : '#6c7461'} />
      <path d="m535 160 242 7-25 183-244-16Z" fill={lively ? '#5c824d' : '#676f60'} />
      <path d="m800 176 200 8v192l-225-28Z" fill={lively ? '#819952' : '#737966'} />
      <path d="M0 402 220 344l208 15-82 161H0Z" fill={lively ? '#849c59' : '#737b68'} />
      <path d="m398 360 226-29 180 27-75 162H310Z" fill={lively ? '#668b50' : '#687260'} />
      <path d="m820 365 180 13v142H736Z" fill={lively ? '#91a15d' : '#767c6c'} />
      <g className="benefits-field-lines" opacity={lively ? .3 : .16}>
        <path d="M20 90h135M18 112h122M355 52h135M350 78h130M615 59h115M820 82h130M30 245h150M310 220h160M578 225h150M845 248h120M35 438h140M440 421h135M800 424h130" />
      </g>
      <path className="benefits-map-road" d="M-30 440 C150 380 210 440 330 355 S485 215 585 263 688 396 810 320 888 203 1030 210" />
      <path className="benefits-map-road-edge" d="M-30 440 C150 380 210 440 330 355 S485 215 585 263 688 396 810 320 888 203 1030 210" />
      <g className="benefits-map-collection">
        <path d="M300 329h66l16 35h-96Z" />
        <path d="M310 329v-18h45v18M318 311l14-13 15 13" />
        <path d="M310 345h45M322 345v19M344 345v19" />
      </g>
      <g className="benefits-map-market">
        <path d="M828 110h112v70H828Z" />
        <path d="m818 110 66-29 78 29Z" />
        <path d="M845 132h78v48h-78ZM856 147h14v17h-14ZM878 147h14v17h-14ZM900 147h14v17h-14Z" />
      </g>
      <g className="benefits-map-store">
        <path d="M885 386h74v63h-74Z" />
        <path d="m876 386 8-24h77l8 24Z" />
        <path d="M891 398h62v11h-62ZM903 420h15v29h-15ZM929 420h15v29h-15Z" />
      </g>
      <g className="benefits-map-harvest">
        <circle cx="125" cy="245" r="20" /><path d="M125 225v40M105 245h40M111 231l28 28M139 231l-28 28" />
        <circle cx="695" cy="120" r="16" /><path d="M695 104v32M679 120h32" />
      </g>
    </svg>
  )
}

export function Benefits() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [lensPosition, setLensPosition] = useState(50)
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateLens = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      const position = ((event.clientX - bounds.left) / bounds.width) * 100
      setLensPosition(Math.min(94, Math.max(6, position)))
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (isDragging) updateLens(event)
    }
    const handlePointerUp = () => setIsDragging(false)

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDragging])

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setIsDragging(true)
  }

  return (
    <section id="benefits" className="benefits-story">
      <div className="container">
        <header className="benefits-story-header scroll-reveal">
          <span className="benefits-eyebrow">THE TURNING POINT</span>
          <h2 className="display-xl">
            Same harvest.<br />
            A completely <span>different outcome</span><i aria-hidden="true" />.
          </h2>
        </header>

        <div className="benefits-canvas-wrap scroll-reveal">
          <div className="benefits-canvas" ref={canvasRef} style={{ '--lens-position': `${lensPosition}%` } as React.CSSProperties}>
            <div className="benefits-map benefits-before-map"><HarvestMap /></div>
            <div className="benefits-map benefits-after-map"><HarvestMap lively /></div>

            <div className="benefits-route-layer benefits-before-route" aria-hidden="true">
              <svg viewBox="0 0 1000 520" preserveAspectRatio="none"><path d="M30 390 C180 260 240 420 380 300" /><path d="M430 280 C520 190 565 300 640 215" /><path d="M700 185 C790 130 850 180 970 75" /></svg>
            </div>
            <div className="benefits-route-layer benefits-after-route" aria-hidden="true">
              <svg viewBox="0 0 1000 520" preserveAspectRatio="none"><path d="M30 390 C180 260 240 420 380 300 C480 205 550 300 640 215 C745 130 850 180 970 75" /></svg>
            </div>

            <div className="benefits-route-points" aria-hidden="true">
              {hotspots.map((hotspot) => <span key={hotspot.title} className={activeHotspot === hotspot.title ? 'is-active' : ''} style={{ left: hotspot.point.split(' ')[0], top: hotspot.point.split(' ')[1] }} />)}
            </div>

            <div className="benefits-canvas-caption benefits-caption-before">BEFORE KISAN SETU</div>
            <div className="benefits-canvas-caption benefits-caption-after">WITH KISAN SETU</div>
            {hotspots.map((hotspot) => <HotspotLabel key={hotspot.title} hotspot={hotspot} active={activeHotspot === hotspot.title} onActive={setActiveHotspot} />)}

            <button
              type="button"
              className={`benefits-lens${isDragging ? ' is-dragging' : ''}`}
              style={{ left: `${lensPosition}%` }}
              aria-label="Drag to reveal the difference Kisan Setu makes"
              onPointerDown={handlePointerDown}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') setLensPosition((position) => Math.max(6, position - 4))
                if (event.key === 'ArrowRight') setLensPosition((position) => Math.min(94, position + 4))
              }}
            >
              <span>KISAN SETU</span>
              <b>DRAG TO SEE THE SHIFT</b>
            </button>
          </div>
        </div>

        <p className="benefits-outcome scroll-reveal">Less chasing. More certainty. Fresher trade.</p>
      </div>

      <style>{`
        .benefits-story { overflow: hidden; background: var(--ff-cream); padding: 7rem 0 7.5rem; }
        .benefits-story-header { max-width: 64rem; margin: 0 auto 4.25rem; text-align: center; }
        .benefits-eyebrow { display: block; color: var(--ff-fresh); font-size: .7rem; font-weight: 800; letter-spacing: .2em; margin-bottom: 1.4rem; }
        .benefits-story-header h2 { position: relative; color: var(--ff-navy); margin: 0; }
        .benefits-story-header h2 span { position: relative; color: var(--ff-fresh); display: inline-block; }
        .benefits-story-header h2 i { position: absolute; display: inline-block; bottom: -.3rem; left: 61%; width: 3.8rem; height: .45rem; border-bottom: 3px solid var(--ff-yellow); border-radius: 50%; transform: rotate(-3deg); }
        .benefits-canvas-wrap { position: relative; max-width: 1180px; margin: 0 auto; }
        .benefits-canvas { position: relative; aspect-ratio: 16 / 8.5; min-height: 34rem; overflow: hidden; border: 1px solid rgba(13,27,42,.16); border-radius: 2rem; background: var(--ff-navy); box-shadow: 0 32px 80px rgba(13,27,42,.2); isolation: isolate; touch-action: pan-y; }
        .benefits-map { position: absolute; inset: 0; }
        .benefits-before-map { filter: saturate(.52) brightness(.75) contrast(.86); }
        .benefits-after-map { clip-path: inset(0 0 0 var(--lens-position)); }
        .benefits-map-art { display: block; width: 100%; height: 100%; }
        .benefits-field-lines path { fill: none; stroke: #dfd09a; stroke-width: 2; stroke-dasharray: 2 9; }
        .benefits-map-road { fill: none; stroke: #e5d5ae; stroke-width: 35; stroke-linecap: round; }
        .benefits-map-road-edge { fill: none; stroke: rgba(91,76,51,.34); stroke-width: 2; stroke-dasharray: 8 10; }
        .benefits-map-collection path, .benefits-map-market path, .benefits-map-store path { fill: #dfbe70; stroke: #365d3a; stroke-width: 2; }
        .benefits-map-collection path:nth-child(2), .benefits-map-market path:first-child, .benefits-map-store path:first-child { fill: #f2d99e; }
        .benefits-map-harvest circle { fill: #e6b64d; stroke: #f6e1a6; stroke-width: 3; }
        .benefits-map-harvest path { fill: none; stroke: #f7e7b0; stroke-width: 2; }
        .benefits-canvas::after { position: absolute; content: ''; z-index: 1; inset: 0; pointer-events: none; opacity: .16; background-image: radial-gradient(rgba(255,255,255,.55) .5px, transparent .6px); background-size: 4px 4px; mix-blend-mode: overlay; }
        .benefits-route-layer { position: absolute; z-index: 2; inset: 0; pointer-events: none; }
        .benefits-route-layer svg { width: 100%; height: 100%; overflow: visible; }
        .benefits-route-layer path { fill: none; stroke-linecap: round; stroke-width: 4; }
        .benefits-before-route { clip-path: inset(0 calc(100% - var(--lens-position)) 0 0); opacity: .6; }
        .benefits-before-route path { stroke: rgba(205,190,163,.65); stroke-dasharray: 3 16; }
        .benefits-after-route { clip-path: inset(0 0 0 var(--lens-position)); }
        .benefits-after-route path { stroke: #b7df9e; filter: drop-shadow(0 0 5px rgba(183,223,158,.65)); stroke-dasharray: 10 14; stroke-dashoffset: 1200; }
        .benefits-canvas-wrap.revealed .benefits-after-route path { animation: benefits-route-draw 4.5s cubic-bezier(.4,0,.2,1) .35s forwards; }
        .benefits-route-points span { position: absolute; z-index: 3; width: .5rem; height: .5rem; border: 1px solid rgba(244,194,74,.9); border-radius: 50%; background: var(--ff-yellow); opacity: .5; transform: translate(-50%, -50%) scale(.8); transition: opacity .3s ease, transform .3s ease, box-shadow .3s ease; }
        .benefits-route-points span.is-active { opacity: 1; transform: translate(-50%, -50%) scale(1.7); box-shadow: 0 0 0 .35rem rgba(242,162,0,.18), 0 0 18px rgba(242,162,0,.75); }
        .benefits-canvas-caption { position: absolute; z-index: 4; top: 2rem; color: rgba(255,255,255,.8); font-size: .67rem; font-weight: 800; letter-spacing: .18em; }
        .benefits-caption-before { left: 2.5rem; }
        .benefits-caption-after { right: 2.5rem; color: #d8f3dc; }
        .benefits-hotspot { position: absolute; z-index: 5; max-width: 13rem; padding: .7rem .9rem; border: 0; border-left: 2px solid rgba(255,255,255,.6); border-radius: 0; background: rgba(255,255,255,.92); box-shadow: 0 8px 24px rgba(13,27,42,.18); color: var(--ff-navy); text-align: left; transform: translateY(0); transition: transform .3s ease, background .3s ease, box-shadow .3s ease; }
        .benefits-hotspot:hover, .benefits-hotspot:focus-visible, .benefits-hotspot.is-active { outline: none; background: #fff; box-shadow: 0 12px 30px rgba(13,27,42,.25); transform: translateY(-4px); }
        .benefits-hotspot-after { border-left-color: var(--ff-mint); }
        .benefits-hotspot strong, .benefits-hotspot span { display: block; }
        .benefits-hotspot strong { font-size: .78rem; line-height: 1.25; }
        .benefits-hotspot span { margin-top: .24rem; color: var(--ff-muted); font-size: .67rem; line-height: 1.35; }
        .benefits-lens { position: absolute; z-index: 7; top: 0; bottom: 0; width: 2px; padding: 0; border: 0; background: #276345; box-shadow: 0 0 18px rgba(183,223,158,.55); cursor: ew-resize; transform: translateX(-50%); touch-action: none; }
        .benefits-lens::before { position: absolute; content: ''; top: 50%; left: 50%; width: 2.4rem; height: 2.4rem; border: 1px solid rgba(255,255,255,.9); border-radius: 50%; background: #276345; box-shadow: 0 5px 20px rgba(13,27,42,.25); transform: translate(-50%, -50%); }
        .benefits-lens::after { position: absolute; content: ''; top: 50%; left: 50%; width: .5rem; height: .5rem; border-top: 1px solid #d8f3dc; border-right: 1px solid #d8f3dc; transform: translate(-70%, -50%) rotate(45deg); }
        .benefits-lens span, .benefits-lens b { position: absolute; left: 50%; padding: .34rem .55rem; color: #fff; white-space: nowrap; transform: translateX(-50%); }
        .benefits-lens span { top: calc(50% - 4.6rem); font-size: .62rem; font-weight: 800; letter-spacing: .16em; }
        .benefits-lens b { top: calc(50% + 2rem); color: #f7dc8b; font-size: .56rem; font-weight: 800; letter-spacing: .12em; }
        .benefits-lens.is-dragging::before { box-shadow: 0 0 0 .45rem rgba(183,223,158,.18), 0 5px 20px rgba(13,27,42,.3); }
        .benefits-outcome { color: var(--ff-navy); font-size: clamp(2rem, 4vw, 3.8rem); font-weight: 900; letter-spacing: -.04em; line-height: 1.05; text-align: center; margin: 5rem auto 0; }
        @keyframes benefits-route-draw { to { stroke-dashoffset: 0; } }
        @media (max-width: 800px) {
          .benefits-story { padding: 5rem 0 5.5rem; }
          .benefits-story-header { margin-bottom: 2.5rem; }
          .benefits-story-header h2 { font-size: clamp(2.45rem, 11vw, 4rem); }
          .benefits-story-header h2 i { left: 58%; }
          .benefits-canvas { min-height: 34rem; aspect-ratio: auto; border-radius: 1.35rem; }
          .benefits-map-art { min-width: 110%; transform: translateX(-5%); }
          .benefits-canvas-caption { top: 1.25rem; font-size: .57rem; }
          .benefits-caption-before { left: 1.2rem; }
          .benefits-caption-after { right: 1.2rem; }
          .benefits-hotspot { max-width: 9.5rem; padding: .55rem .65rem; }
          .benefits-hotspot strong { font-size: .67rem; }
          .benefits-hotspot span { font-size: .59rem; }
          .benefits-hotspot-before:nth-of-type(1) { top: 12% !important; }
          .benefits-hotspot-before:nth-of-type(3) { top: 27% !important; }
          .benefits-hotspot-before:nth-of-type(5) { top: 65% !important; }
          .benefits-hotspot-before:nth-of-type(7) { top: 78% !important; }
          .benefits-hotspot-after:nth-of-type(2) { top: 12% !important; }
          .benefits-hotspot-after:nth-of-type(4) { top: 28% !important; }
          .benefits-hotspot-after:nth-of-type(6) { top: 64% !important; }
          .benefits-hotspot-after:nth-of-type(8) { top: 78% !important; }
          .benefits-lens span { top: 46%; }
          .benefits-lens b { top: 54%; writing-mode: vertical-rl; transform: translateX(-50%) rotate(180deg); }
          .benefits-outcome { font-size: clamp(2rem, 9vw, 3rem); margin-top: 3.5rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .benefits-after-route path, .benefits-canvas-wrap.revealed .benefits-after-route path { animation: none; stroke-dashoffset: 0; }
          .benefits-hotspot, .benefits-route-points span, .benefits-lens { transition: none; }
        }
      `}</style>
    </section>
  )
}