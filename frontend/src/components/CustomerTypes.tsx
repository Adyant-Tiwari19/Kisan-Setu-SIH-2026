const groups = [
  {
    title: 'For Farmers',
    description: 'Turn produce into predictable demand, reach more buyers, and get fairer pricing with fewer hassles.',
    bullets: ['List crops quickly', 'Track demand in real time', 'Get transparent pricing'],
  },
  {
    title: 'For Retailers',
    description: 'Source fresher produce, reduce stock-outs, and build more reliable daily buying plans.',
    bullets: ['Order by quality', 'Compare nearby suppliers', 'Plan daily restocks'],
  },
  {
    title: 'For Bulk Buyers',
    description: 'Consolidate large orders, forecast demand, and move efficiently across many supplier clusters.',
    bullets: ['Volume buying', 'Smart route planning', 'Demand forecasting'],
  },
]

export function CustomerTypes() {
  return (
    <section className="bg-slate-900 py-20 text-white">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">Who it helps</div>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] md:text-5xl">
            Built for every link in the farm-to-market chain.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title} className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-2xl font-bold">{group.title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-300">{group.description}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-100">
                {group.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">✓</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
