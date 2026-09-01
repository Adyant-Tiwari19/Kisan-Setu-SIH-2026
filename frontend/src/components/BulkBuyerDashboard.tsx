import { useState } from 'react'

const navItems = ['Home', 'Requirements', 'Matches', 'Orders', 'Suppliers']

const dashboardStats = [
  { label: 'Active requirements', value: '12' },
  { label: 'Incoming matches', value: '08' },
  { label: 'Pending orders', value: '05' },
  { label: 'Estimated savings', value: '₹1.8L' },
  { label: 'Delivery status', value: 'On track' },
]

const matches = [
  {
    name: 'Green Valley FPO',
    landed: '₹32/kg',
    distance: '12 km away',
    freshness: 'Harvested today',
    reliability: '95% fulfillment',
    recommendation: '₹6/kg cheaper delivered',
    value: 'Best fit',
  },
  {
    name: 'Aaranya Collective',
    landed: '₹35/kg',
    distance: '18 km away',
    freshness: 'Fresh grade A',
    reliability: '92% fulfillment',
    recommendation: 'Higher quality match',
    value: 'Preferred',
  },
  {
    name: 'Sundaram Farms',
    landed: '₹38/kg',
    distance: '9 km away',
    freshness: 'Harvested yesterday',
    reliability: '90% fulfillment',
    recommendation: 'Nearest route',
    value: 'Fastest',
  },
]

const rfqFields = [
  'Crop',
  'Variety',
  'Required quantity',
  'Quality/grade',
  'Preferred region',
  'Delivery location',
  'Delivery window',
  'Maximum price',
  'Additional requirements',
]

const orderRows = [
  { id: 'BULK-2048', qty: '650 kg', supplier: 'Green Valley FPO', pickup: 'Tomorrow 7:30 AM', cost: '₹20,800', status: 'Confirmed' },
  { id: 'BULK-2034', qty: '420 kg', supplier: 'Aaranya Collective', pickup: 'Wed 8:00 AM', cost: '₹14,700', status: 'In transit' },
]

const initialRfq = {
  Crop: 'Tomato',
  Variety: 'Hybrid',
  'Required quantity': '500',
  'Quality/grade': 'Grade A',
  'Preferred region': 'Nashik',
  'Delivery location': 'Bengaluru cold hub',
  'Delivery window': 'Thu 9:00 AM - 2:00 PM',
  'Maximum price': '40',
  'Additional requirements': 'Fresh, uniform size',
}

const fieldPlaceholders: Record<string, string> = {
  Crop: 'e.g. Tomato',
  Variety: 'e.g. Hybrid',
  'Required quantity': 'e.g. 500',
  'Quality/grade': 'e.g. Grade A',
  'Preferred region': 'e.g. Nashik',
  'Delivery location': 'e.g. Bengaluru cold hub',
  'Delivery window': 'e.g. Thu 9:00 AM - 2:00 PM',
  'Maximum price': 'e.g. 40',
  'Additional requirements': 'e.g. Fresh, uniform size',
}

export function BulkBuyerDashboard() {
  const [showCheckout, setShowCheckout] = useState(false)
  const [rfq, setRfq] = useState(initialRfq)
  const [selectedSupplier, setSelectedSupplier] = useState('Green Valley FPO')
  const [activeNav, setActiveNav] = useState('Home')
  const [submittedRfq, setSubmittedRfq] = useState(false)
  const [comparison, setComparison] = useState<string | null>(null)
  const [dashboardMessage, setDashboardMessage] = useState('')

  const scrollToSection = (id: string) => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const updateRfq = (field: string, value: string) => {
    setRfq((current) => ({ ...current, [field]: value }))
    setSubmittedRfq(false)
  }

  const handleNavClick = (item: string) => {
    setActiveNav(item)
    setDashboardMessage('')
    const targetId = item === 'Home' ? 'bulk-overview' : item === 'Requirements' ? 'rfq-form' : item === 'Matches' ? 'smart-matches' : item === 'Orders' ? 'recent-purchases' : null
    if (targetId) scrollToSection(targetId)
    if (item === 'Suppliers') setDashboardMessage('Supplier directory is available from your ranked matches.')
    if (item === 'Profile') setDashboardMessage('Profile settings are ready for your procurement preferences.')
  }

  return (
    <section className="section-shell py-16">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-6">
        <div className="rounded-[1.6rem] bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Bulk Buyer</div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900 md:text-3xl">Procurement dashboard</h2>
            </div>
            <button type="button" onClick={() => handleNavClick('Requirements')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Create RFQ</button>
          </div>

          <div id="bulk-overview" className="scroll-mt-24 mt-5 flex gap-2 overflow-x-auto pb-2 md:gap-3">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition ${item === activeNav ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
                  }`}
              >
                {item}
              </button>
            ))}
          </div>
          {dashboardMessage && <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{dashboardMessage}</div>}

          <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            {dashboardStats.map((stat) => (
              <div key={stat.label} className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{stat.label}</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <form id="rfq-form" onSubmit={(event) => { event.preventDefault(); setSubmittedRfq(true) }} className="scroll-mt-24 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">Create RFQ</h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                  New request
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {rfqFields.map((field) => (
                  <div key={field} className="rounded-2xl bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{field}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type={field === 'Required quantity' || field === 'Maximum price' ? 'number' : 'text'}
                        min={field === 'Required quantity' ? '100' : undefined}
                        step={field === 'Required quantity' ? '50' : undefined}
                        required
                        value={rfq[field as keyof typeof rfq]}
                        onChange={(event) => updateRfq(field, event.target.value)}
                        placeholder={fieldPlaceholders[field]}
                        className="min-w-0 w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {(field === 'Required quantity' || field === 'Maximum price') && <span className="shrink-0 text-sm font-semibold text-slate-500">{field === 'Required quantity' ? 'kg' : '₹/kg'}</span>}
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="mt-5 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">
                Submit RFQ
              </button>
              {submittedRfq && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">RFQ submitted for {rfq['Required quantity']} kg of {rfq.Crop}.</p>}
            </form>

            <div id="smart-matches" className="scroll-mt-24 rounded-[1.5rem] bg-slate-900 p-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black">Smart Matches</h3>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
                  Ranked
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {matches.map((match) => (
                  <div key={match.name} className="rounded-[1.2rem] bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-bold">{match.name}</div>
                        <div className="text-sm text-slate-300">{match.landed}</div>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
                        {match.value}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-slate-200">
                      <div className="flex items-center justify-between"><span>Distance</span><span>{match.distance}</span></div>
                      <div className="flex items-center justify-between"><span>Freshness</span><span>{match.freshness}</span></div>
                      <div className="flex items-center justify-between"><span>Reliability</span><span>{match.reliability}</span></div>
                    </div>

                    <div className="mt-3 rounded-xl bg-emerald-500/10 p-2 text-sm text-emerald-200">
                      Why recommended: {match.recommendation}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => setComparison(comparison === match.name ? null : match.name)} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-900">{comparison === match.name ? 'Compared' : 'Compare'}</button>
                      <button type="button" onClick={() => setSelectedSupplier(match.name)} className={`rounded-full px-3 py-2 text-xs font-semibold ${selectedSupplier === match.name ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900'}`}>
                        {selectedSupplier === match.name ? 'Selected' : 'Select supplier'}
                      </button>
                    </div>
                    {comparison === match.name && <div className="mt-3 rounded-xl bg-white/10 p-2 text-xs text-slate-200">Selected for comparison: {match.landed}, {match.distance}, {match.reliability}.</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {showCheckout ? (
            <div className="mt-8 rounded-[1.5rem] bg-slate-900 p-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Checkout</div>
                  <h3 className="mt-2 text-3xl font-black tracking-[-0.05em]">Review purchase</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
                >
                  Back to orders
                </button>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4 rounded-[1.4rem] bg-white/5 p-4">
                  <div>
                    <div className="mb-2 text-sm text-slate-300">Supplier</div>
                    <div className="rounded-2xl bg-white/10 p-3 text-sm text-slate-100">{selectedSupplier} · Nashik</div>
                  </div>
                  <div>
                    <div className="mb-2 text-sm text-slate-300">Pickup + delivery</div>
                    <div className="rounded-2xl bg-white/10 p-3 text-sm text-slate-100">Pickup: Tomorrow 7:30 AM · Delivery: Bengaluru cold hub</div>
                  </div>
                  <div>
                    <div className="mb-2 text-sm text-slate-300">Source split</div>
                    <div className="rounded-2xl bg-white/10 p-3 text-sm text-slate-100">{rfq['Required quantity'] || '0'} kg requested · supplier allocation confirmed</div>
                  </div>
                </div>

                <div className="rounded-[1.4rem] bg-white p-4 text-slate-900">
                  <h4 className="text-xl font-black text-slate-900">Cost breakdown</h4>

                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between"><span>Produce</span><span className="font-bold text-slate-900">₹19,600</span></div>
                    <div className="flex items-center justify-between"><span>Logistics</span><span className="font-bold text-slate-900">₹2,100</span></div>
                    <div className="flex items-center justify-between"><span>Handling</span><span className="font-bold text-slate-900">₹420</span></div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                      <span>Total</span>
                      <span>₹22,120</span>
                    </div>
                  </div>

                  <button type="button" onClick={() => { setShowCheckout(false); setDashboardMessage(`Bulk order request sent to ${selectedSupplier} for ${rfq['Required quantity']} kg.`) }} className="mt-5 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">
                    Place order for {rfq['Required quantity'] || '0'} kg
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div id="recent-purchases" className="scroll-mt-24 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <h3 className="text-xl font-black text-slate-900">Recent purchases</h3>
                <div className="mt-4 space-y-3">
                  {orderRows.map((row) => (
                    <div key={row.id} className="rounded-2xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{row.id}</div>
                          <div className="text-sm text-slate-500">{row.supplier}</div>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                          {row.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                        <span>{row.qty} bulk</span>
                        <span>{row.pickup}</span>
                        <span className="font-bold text-slate-900">{row.cost}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCheckout(true)}
                  className="mt-5 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                >
                  Review bulk order
                </button>
              </div>

              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <h3 className="text-xl font-black text-slate-900">Order lifecycle</h3>
                <div className="mt-4 space-y-4">
                  {['Order created', 'Supplier accepted', 'Pickup scheduled', 'In transit', 'Delivered'].map((step, index) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {index + 1}
                      </div>
                      <div className="text-sm text-slate-700">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
