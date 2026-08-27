import { Link } from 'react-router-dom'

const stats = [
  { label: 'Farmers onboarded', value: '12.4K+' },
  { label: 'Daily orders matched', value: '3.8K' },
  { label: 'Food saved from wastage', value: '48%' },
]

export function Hero() {
  return (
    <section className="section-shell py-12 md:py-20">
      <div className="mx-auto max-w-4xl space-y-7 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          AI-powered farm-to-market network
        </div>

        <div className="space-y-5">
          <h1 className="text-4xl font-black leading-none tracking-[-0.06em] text-slate-900 md:text-6xl">
            From Farm to Market, Fairer and Smarter.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 md:text-xl">
            Fresh Ferme connects farmers, FPOs, retailers, and bulk buyers through transparent pricing,
            smarter matching, and faster, fresher deliveries.
          </p>
        </div>

        <div className="flex justify-center">
          <Link to="/role-selection" className="rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700">
            Explore Marketplace
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="soft-card rounded-2xl p-4">
              <div className="text-2xl font-black text-slate-900">{stat.value}</div>
              <div className="mt-1 text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
