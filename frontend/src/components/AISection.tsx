const capabilities = [
  {
    title: 'Demand Forecasting',
    text: 'Predict seasonal and regional demand patterns to help farmers and traders plan smarter production.',
  },
  {
    title: 'Smart Matching',
    text: 'Connect buyer intent and supplier availability based on price, route efficiency, and freshness needs.',
  },
  {
    title: 'Route Optimization',
    text: 'Reduce delivery cost and time by combining nearby pickups and efficiently scheduling fleets.',
  },
  {
    title: 'Freshness & Quality Score',
    text: 'Use quality signals to flag freshness, grading, and storage confidence before a transaction completes.',
  },
]

export function AISection() {
  return (
    <section className="section-shell py-20">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">AI intelligence</div>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-900 md:text-5xl">
            Smarter coordination for a less wasteful food system.
          </h2>
        </div>
        <p className="max-w-xl text-lg leading-8 text-slate-600">
          Fresh Ferme blends human trust with machine intelligence to help every transaction become more efficient,
          fair, and dependable.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {capabilities.map((item) => (
          <div key={item.title} className="soft-card rounded-[1.75rem] p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-lg font-black text-emerald-700">
              ✦
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{item.title}</h3>
            <p className="mt-3 text-base leading-7 text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
