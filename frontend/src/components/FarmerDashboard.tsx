import { useState, type FormEvent } from 'react'

const navItems = ['Home', 'My Crops', 'Add Listing', 'Orders', 'Demand Forecast', 'Earnings']

const summary = [
  { label: 'Today', value: '₹18,500', note: 'Expected sales' },
  { label: 'Listings', value: '14', note: 'Active crops' },
  { label: 'Orders', value: '08', note: 'Pending' },
]

const alerts = [
  'Tomato demand up by 18% next week',
  'Rain expected tomorrow - protect harvest',
  'Pickup slot available for 2:30 PM',
]

const listingCards = [
  { crop: 'Tomato', qty: '420 kg', sold: '180 kg', price: '₹32/kg', status: 'Live' },
  { crop: 'Onion', qty: '310 kg', sold: '90 kg', price: '₹24/kg', status: 'Low stock' },
  { crop: 'Potato', qty: '205 kg', sold: '60 kg', price: '₹26/kg', status: 'Live' },
]

const orders = [
  { name: 'Retailer A', crop: 'Tomato', qty: '120 kg', status: 'Pending' },
  { name: 'FPO Hub', crop: 'Onion', qty: '80 kg', status: 'Confirmed' },
  { name: 'School Supply', crop: 'Potato', qty: '60 kg', status: 'Pickup scheduled' },
]

const forecast = [
  { label: 'Tomato', change: '+18%', expected: '420 kg', confidence: '82%' },
  { label: 'Onion', change: '+9%', expected: '300 kg', confidence: '76%' },
  { label: 'Potato', change: '+12%', expected: '260 kg', confidence: '80%' },
]

export function FarmerDashboard() {
  const [activeNav, setActiveNav] = useState('Home')
  const [showListingForm, setShowListingForm] = useState(false)
  const [listingName, setListingName] = useState('')
  const [listingQuantity, setListingQuantity] = useState('')
  const [listingPrice, setListingPrice] = useState('')
  const [listingSubmitted, setListingSubmitted] = useState(false)
  const [acceptedOrders, setAcceptedOrders] = useState<string[]>([])
  const [dashboardMessage, setDashboardMessage] = useState('')

  const scrollToSection = (id: string) => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleNavClick = (label: string) => {
    setActiveNav(label)
    setDashboardMessage('')
    if (label === 'Add Listing') {
      setShowListingForm(true)
      scrollToSection('listing-form')
      return
    }
    const target = label === 'Home' ? 'farmer-overview' : label === 'My Crops' ? 'active-listings' : label === 'Orders' ? 'farmer-orders' : label === 'Demand Forecast' ? 'demand-forecast' : null
    if (target) scrollToSection(target)
    if (label === 'Earnings') setDashboardMessage('Earnings this month: ₹68,400. Next payout is scheduled for Friday.')
    if (label === 'Profile') setDashboardMessage('Profile settings are ready for your farm details and pickup preferences.')
  }

  const submitListing = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setListingSubmitted(true)
    setDashboardMessage(`${listingName} listing submitted for review.`)
    setActiveNav('My Crops')
  }

  return (
    <section className="section-shell py-20">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-emerald-100 bg-white p-3 shadow-[0_20px_70px_rgba(16,185,129,0.08)] md:p-5">
        <div className="rounded-[1.6rem] bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Farmer Dashboard</div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900 md:text-3xl">Good morning, Ravi</h2>
            </div>
            <button type="button" onClick={() => handleNavClick('Add Listing')} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20">
              + Add crop
            </button>
          </div>

          <div id="farmer-overview" className="scroll-mt-24 mt-5 flex gap-2 overflow-x-auto pb-2 md:gap-3">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition ${
                  item === activeNav
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-emerald-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          {dashboardMessage && <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{dashboardMessage}</div>}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {summary.map((item) => (
              <div key={item.label} className="rounded-[1.35rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{item.value}</div>
                <div className="mt-1 text-sm text-slate-500">{item.note}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <div id="active-listings" className="scroll-mt-24 rounded-[1.5rem] bg-slate-900 p-4 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Active listings</h3>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-300">14 live</span>
                </div>

                <div className="mt-4 space-y-3">
                  {listingCards.map((item) => (
                    <div key={item.crop} className="rounded-2xl bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-base font-bold">{item.crop}</div>
                          <div className="text-xs text-slate-300">{item.qty} available</div>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                          item.status === 'Live' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                        <span>Sold: {item.sold}</span>
                        <span>{item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div id="farmer-orders" className="scroll-mt-24 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Orders</h3>
                  <button type="button" onClick={() => handleNavClick('Orders')} className="text-sm font-semibold text-emerald-700">View all</button>
                </div>

                <div className="mt-4 space-y-3">
                  {orders.map((order) => (
                    <div key={`${order.name}-${order.crop}`} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                      <div>
                        <div className="font-bold text-slate-900">{order.name}</div>
                        <div className="text-sm text-slate-500">{order.crop} · {order.qty}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                          {acceptedOrders.includes(order.name) ? 'Accepted' : order.status}
                        </span>
                        {order.status === 'Pending' && !acceptedOrders.includes(order.name) && <button type="button" onClick={() => setAcceptedOrders((current) => [...current, order.name])} className="text-xs font-bold text-emerald-700">Accept</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Upcoming pickups</h3>
                  <span className="text-sm text-emerald-700">3 planned</span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    ['Today', '2:30 PM', 'Tomato, 150 kg'],
                    ['Tomorrow', '9:00 AM', 'Onion, 90 kg'],
                    ['Thu', '11:15 AM', 'Potato, 110 kg'],
                  ].map(([day, time, item]) => (
                    <div key={`${day}-${time}`} className="flex items-center justify-between rounded-2xl bg-emerald-50 p-3">
                      <div>
                        <div className="font-bold text-slate-900">{day}</div>
                        <div className="text-sm text-slate-600">{item}</div>
                      </div>
                      <div className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700">{time}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-amber-50 p-4 shadow-sm ring-1 ring-amber-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Important alerts</h3>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Need action</span>
                </div>
                <div className="mt-4 space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert} className="flex items-start gap-3 rounded-2xl bg-white p-3 text-sm text-slate-700">
                      <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {showListingForm && <form id="listing-form" onSubmit={submitListing} className="scroll-mt-24 mt-6 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900">Add crop listing</h3>
              <button type="button" onClick={() => setShowListingForm(false)} className="text-sm font-semibold text-slate-500">Cancel</button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input required value={listingName} onChange={(event) => setListingName(event.target.value)} placeholder="Crop name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input required type="number" min="1" value={listingQuantity} onChange={(event) => setListingQuantity(event.target.value)} placeholder="Quantity in kg" className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input required type="number" min="1" value={listingPrice} onChange={(event) => setListingPrice(event.target.value)} placeholder="Price per kg" className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <button type="submit" className="mt-4 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Publish listing</button>
            {listingSubmitted && <span className="ml-3 text-sm font-semibold text-emerald-700">Listing saved.</span>}
          </form>}

          <div id="demand-forecast" className="scroll-mt-24 mt-6 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Demand forecast</h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                AI forecast
              </span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {forecast.map((item) => (
                <div key={item.label} className="rounded-[1.25rem] bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{item.label}</span>
                    <span className="font-bold text-emerald-700">{item.change}</span>
                  </div>
                  <div className="mt-3 text-2xl font-black text-slate-900">{item.expected}</div>
                  <div className="mt-2 text-sm text-slate-500">Expected demand</div>
                  <div className="mt-4 h-2.5 rounded-full bg-slate-200">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400"
                      style={{ width: item.confidence.replace('%', '') + '%' }}
                    />
                  </div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Confidence: {item.confidence}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
