const metrics = [
  { value: '₹8.4Cr', label: 'Monthly trade value tracked' },
  { value: '92%', label: 'On-time pickup satisfaction' },
  { value: '18%', label: 'Lower logistics cost' },
  { value: '4.6/5', label: 'Quality trust score' },
]

export function ImpactSection() {
  return (
    <section className="bg-gradient-to-br from-emerald-600 to-lime-500 py-20 text-white">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-100">Impact</div>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] md:text-5xl">
            Better outcomes across the entire food value chain.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-[1.75rem] border border-white/10 bg-white/10 p-6 text-center backdrop-blur-sm">
              <div className="text-4xl font-black tracking-[-0.06em]">{metric.value}</div>
              <div className="mt-3 text-sm text-emerald-50/90">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
