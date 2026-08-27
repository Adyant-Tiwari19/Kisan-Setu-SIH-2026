const items = [
  {
    title: 'Fairer prices',
    text: 'Direct channels reduce middlemen and protect farmer margins while keeping ends transparent.',
  },
  {
    title: 'Lower wastage',
    text: 'Better matching reduces spoilage and enables faster movement from field to shelf.',
  },
  {
    title: 'Smarter logistics',
    text: 'Pickup and delivery routes are optimized for cost, freshness, and consolidation.',
  },
  {
    title: 'Trusted quality',
    text: 'Visibility into produce quality, grading, and freshness improves buyer confidence.',
  },
]

export function Benefits() {
  return (
    <section className="section-shell py-20">
      <div className="mx-auto max-w-4xl text-center">
        <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Benefits</div>
        <h2 className="mt-4 text-balance text-3xl font-black leading-[0.95] tracking-[-0.05em] text-slate-900 sm:text-4xl md:text-5xl">
          A healthier supply chain for every participant.
        </h2>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="soft-card rounded-[1.75rem] p-6">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-2xl shadow-lg shadow-emerald-500/25">
              ✓
            </div>
            <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
            <p className="mt-3 text-base leading-7 text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
