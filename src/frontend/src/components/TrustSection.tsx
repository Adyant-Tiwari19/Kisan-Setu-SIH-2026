const points = [
  'Price visibility from origin to destination',
  'Freshness and quality checks before dispatch',
  'Verified producer and buyer profiles',
  'Trackable pickup and delivery handoff',
]

export function TrustSection() {
  return (
    <section className="section-shell py-20">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="soft-card rounded-[2rem] bg-gradient-to-br from-emerald-50 to-white p-8">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Trust & transparency</div>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-900 md:text-5xl">
            Confidence built into every transaction.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
            Every order is designed to be clear, traceable, and fair — from farm details and quality ratings to
            delivery timing and settlement visibility.
          </p>

          <ul className="mt-8 space-y-4">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-base text-slate-700">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
                  ✓
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[2rem] bg-slate-900 p-7 text-white shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-300">Quality trace</div>
              <div className="mt-1 text-3xl font-black">98.4%</div>
            </div>
            <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-300">
              Verified
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                <span>Freshness score</span>
                <span>96</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-700">
                <div className="h-2.5 w-[96%] rounded-full bg-gradient-to-r from-emerald-400 to-lime-300" />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                <span>Logistics confidence</span>
                <span>91</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-700">
                <div className="h-2.5 w-[91%] rounded-full bg-gradient-to-r from-amber-400 to-orange-300" />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                <span>Buyer trust</span>
                <span>94</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-700">
                <div className="h-2.5 w-[94%] rounded-full bg-gradient-to-r from-cyan-400 to-sky-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
