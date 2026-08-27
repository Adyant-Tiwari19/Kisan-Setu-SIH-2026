const steps = [
  { title: 'Onboard', description: 'Farmers and buyers register with simple profiles and produce needs.' },
  { title: 'List / Request', description: 'Farmers list harvests or FPOs publish demand and quality preferences.' },
  { title: 'Smart Match', description: 'AI aligns nearby supply with buyer demand and expected quality.' },
  { title: 'Transparent Price', description: 'Farmgate, logistics, and market comparison are clearly shared.' },
  { title: 'Delivery', description: 'Consolidated pickup and routing reduce cost and time for everyone.' },
  { title: 'Settlement', description: 'Secure, fair payouts and tracking close the loop with trust.' },
]

export function HowItWorks() {
  return (
    <section className="bg-white/70 py-20">
      <div className="section-shell">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">How it works</div>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-900 md:text-5xl">
            A simpler route from harvest to happy customers.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="soft-card rounded-[1.75rem] p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
                0{index + 1}
              </div>
              <h3 className="mt-5 text-2xl font-bold text-slate-900">{step.title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
