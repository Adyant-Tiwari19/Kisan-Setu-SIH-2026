import { useMemo, useState } from 'react'

const navItems = ['Home', 'Marketplace', 'Cart', 'Orders']

const categories = ['All', 'Vegetables', 'Fruits', 'Rice', 'Spices', 'Seasonal']

const products = [
  {
    name: 'Tomatoes',
    farmer: 'Green Valley FPO',
    origin: 'Nashik',
    price: '₹38/kg',
    delivered: '₹52/kg',
    harvest: '2 hrs ago',
    distance: '4.8 km',
    freshness: '96',
    trust: '4.9',
    qty: '180 kg',
    badge: 'Best value',
  },
  {
    name: 'Bananas',
    farmer: 'Sundaram Farms',
    origin: 'Coimbatore',
    price: '₹28/kg',
    delivered: '₹39/kg',
    harvest: '1 hr ago',
    distance: '7.2 km',
    freshness: '94',
    trust: '4.8',
    qty: '240 kg',
    badge: 'Freshest',
  },
  {
    name: 'Rice',
    farmer: 'Aaranya Collective',
    origin: 'Kurnool',
    price: '₹24/kg',
    delivered: '₹32/kg',
    harvest: 'Today',
    distance: '12.4 km',
    freshness: '92',
    trust: '4.7',
    qty: '410 kg',
    badge: 'Cheapest',
  },
]

const orderTimeline = ['Confirmed', 'Pickup', 'In Transit', 'Delivered']

export function RetailMarketplace() {
  const [showCheckout, setShowCheckout] = useState(false)
  const [activeNav, setActiveNav] = useState('Marketplace')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('Best Value')
  const [cart, setCart] = useState<Record<string, number>>({ Tomatoes: 2, Bananas: 1 })
  const [dashboardMessage, setDashboardMessage] = useState('')

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch = `${product.name} ${product.farmer} ${product.origin}`.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === 'All' || (category === 'Vegetables' && product.name === 'Tomatoes') || (category === 'Fruits' && product.name === 'Bananas') || (category === 'Rice' && product.name === 'Rice')
      return matchesSearch && matchesCategory
    })

    return [...filtered].sort((first, second) => {
      if (sort === 'Cheapest') return Number.parseInt(first.delivered.slice(1)) - Number.parseInt(second.delivered.slice(1))
      if (sort === 'Freshest') return Number(second.freshness) - Number(first.freshness)
      if (sort === 'Nearest') return Number.parseFloat(first.distance) - Number.parseFloat(second.distance)
      return first.badge === 'Best value' ? -1 : second.badge === 'Best value' ? 1 : 0
    })
  }, [category, search, sort])

  const cartCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0)

  const cartItems = products.filter((product) => (cart[product.name] ?? 0) > 0)
  const produceSubtotal = cartItems.reduce((total, product) => total + Number.parseInt(product.delivered.slice(1)) * (cart[product.name] ?? 0), 0)
  const logisticsCost = cartCount > 0 ? 35 : 0

  const scrollToSection = (id: string) => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const updateQuantity = (name: string, quantity: number) => {
    setCart((current) => {
      const next = { ...current }
      if (quantity <= 0) delete next[name]
      else next[name] = Math.min(quantity, 10)
      return next
    })
    setOrderPlaced(false)
  }

  const addToCart = (name: string) => {
    setCart((current) => ({ ...current, [name]: Math.min((current[name] ?? 0) + 1, 10) }))
  }

  return (
    <section className="section-shell py-16">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-6">
        <div className="rounded-[1.6rem] bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Retail Consumer</div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900 md:text-3xl">Fresh picks near you</h2>
            </div>
            <button type="button" onClick={() => scrollToSection('retail-cart')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Cart ({cartCount})</button>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 md:gap-3">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setActiveNav(item)
                  setDashboardMessage('')
                  const target = item === 'Marketplace' ? 'retail-products' : item === 'Cart' ? 'retail-cart' : item === 'Orders' ? 'retail-orders' : null
                  if (target) scrollToSection(target)
                  if (item === 'Home') setDashboardMessage('Fresh produce marketplace home.')
                  if (item === 'Profile') setDashboardMessage('Profile settings are ready for your delivery preferences.')
                }}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition ${item === activeNav ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
                  }`}
              >
                {item}
              </button>
            ))}
          </div>
          {dashboardMessage && <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{dashboardMessage}</div>}

          <div className="mt-5 rounded-[1.4rem] bg-white p-3 shadow-sm ring-1 ring-slate-100 md:p-4">
            <div className="relative">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search crops, farms, or origin"
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((categoryName) => (
                <button
                  key={categoryName}
                  type="button"
                  onClick={() => setCategory(categoryName)}
                  className={`rounded-full px-3 py-2 text-sm font-medium ${categoryName === category ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  {categoryName}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Sort by:</span>
            {['Cheapest', 'Freshest', 'Nearest', 'Best Value'].map((sortName) => (
              <button key={sortName} type="button" onClick={() => setSort(sortName)} className={`rounded-full px-3 py-1.5 ring-1 ring-slate-200 ${sortName === sort ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                {sortName}
              </button>
            ))}
          </div>

          <div id="retail-products" className="scroll-mt-24 mt-6 grid gap-5 lg:grid-cols-3">
            {visibleProducts.map((product) => (
              <article key={product.name} className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                    {product.badge}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{product.qty} available</span>
                </div>

                <div className="mt-4 h-28 rounded-[1.2rem] bg-gradient-to-br from-emerald-200 via-lime-100 to-amber-100" />

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{product.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{product.farmer}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Freshness</div>
                    <div className="text-lg font-black text-emerald-700">{product.freshness}</div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Origin</span>
                    <span className="font-semibold text-slate-800">{product.origin}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Distance</span>
                    <span className="font-semibold text-slate-800">{product.distance}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Harvested</span>
                    <span className="font-semibold text-slate-800">{product.harvest}</span>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Price / kg</span>
                    <span className="text-xl font-black text-slate-900">{product.price}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Delivered</span>
                    <span className="font-bold text-emerald-700">{product.delivered}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Trust</div>
                    <div className="text-lg font-black text-slate-900">{product.trust}/5</div>
                  </div>
                  <button type="button" onClick={() => addToCart(product.name)} className="rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Add {cart[product.name] ? `(${cart[product.name]})` : ''} to cart</button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-[1.6rem] bg-slate-900 p-5 text-white">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm text-slate-300">Product detail</div>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.05em]">Tomatoes</h3>
                <div className="mt-2 text-sm text-slate-300">Green Valley FPO · Nashik</div>
              </div>

              <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-300">
                Verified Seller
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.4rem] bg-white/5 p-4">
                <div className="h-56 rounded-[1.1rem] bg-gradient-to-br from-emerald-200 via-lime-100 to-amber-100" />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="h-16 rounded-xl bg-white/10" />
                  <div className="h-16 rounded-xl bg-white/10" />
                  <div className="h-16 rounded-xl bg-white/10" />
                </div>
              </div>

              <div className="rounded-[1.4rem] bg-white p-4 text-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-500">Quantity</div>
                    <div className="font-black text-2xl">2 kg</div>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1">
                    <button type="button" onClick={() => updateQuantity('Tomatoes', (cart.Tomatoes ?? 1) - 1)} className="h-8 w-8 rounded-full bg-white text-xl">−</button>
                    <span className="min-w-8 text-center font-bold">{cart.Tomatoes ?? 0}</span>
                    <button type="button" onClick={() => addToCart('Tomatoes')} className="h-8 w-8 rounded-full bg-white text-xl">+</button>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Produce price</span>
                    <span className="font-bold text-slate-900">₹76</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Logistics</span>
                    <span className="font-bold text-slate-900">₹28</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-slate-700">
                    <span>Total delivered price</span>
                    <span className="text-xl font-black text-slate-900">₹104</span>
                  </div>
                </div>

                <button type="button" onClick={() => addToCart('Tomatoes')} className="mt-5 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">
                  Add to cart
                </button>
              </div>
            </div>
          </div>

          {showCheckout ? (
            <div className="mt-8 rounded-[1.6rem] bg-slate-900 p-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Checkout</div>
                  <h3 className="mt-2 text-3xl font-black tracking-[-0.05em]">Confirm your order</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
                >
                  Back to cart
                </button>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4 rounded-[1.4rem] bg-white/5 p-4">
                  <div>
                    <div className="mb-2 text-sm text-slate-300">Delivery address</div>
                    <div className="rounded-2xl bg-white/10 p-3 text-sm leading-7 text-slate-100">
                      24 Market Road, BTM Layout<br />
                      Bengaluru, Karnataka 560076
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-slate-300">Delivery estimate</div>
                    <div className="rounded-2xl bg-white/10 p-3 text-sm text-slate-100">Today, 6:30 PM - 8:00 PM</div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-slate-300">Payment method</div>
                    <div className="rounded-2xl bg-white/10 p-3 text-sm text-slate-100">UPI · farmerdirect@upi</div>
                  </div>
                </div>

                <div className="rounded-[1.4rem] bg-white p-4 text-slate-900">
                  <h4 className="text-xl font-black text-slate-900">Order summary</h4>

                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    {cartItems.map((product) => (
                      <div key={product.name} className="flex items-center justify-between">
                        <span>{product.name} × {cart[product.name]}</span>
                        <span className="font-bold text-slate-900">₹{Number.parseInt(product.delivered.slice(1)) * (cart[product.name] ?? 0)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <span>Produce subtotal</span>
                      <span>₹{produceSubtotal}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Logistics</span>
                      <span>₹{logisticsCost}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                      <span>Total</span>
                      <span>₹{produceSubtotal + logisticsCost}</span>
                    </div>
                  </div>

                  <button type="button" disabled={cartCount === 0} onClick={() => { setOrderPlaced(true); setShowCheckout(false); setActiveNav('Orders') }} className="mt-5 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                    Place order
                  </button>
                  {orderPlaced && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">Order placed successfully. Your farmer is preparing it.</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div id="retail-cart" className="scroll-mt-24 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <h3 className="text-xl font-black text-slate-900">Cart</h3>
                <div className="mt-4 space-y-3">
                  {cartItems.map((product) => (
                    <div key={product.name} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                      <div>
                        <div className="font-bold text-slate-900">{product.name}</div>
                        <div className="text-sm text-slate-500">Qty: {cart[product.name]} kg</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateQuantity(product.name, (cart[product.name] ?? 1) - 1)} className="h-8 w-8 rounded-full bg-white text-lg ring-1 ring-slate-200">−</button>
                        <span className="min-w-12 text-center font-bold text-slate-900">₹{Number.parseInt(product.delivered.slice(1)) * (cart[product.name] ?? 0)}</span>
                        <button type="button" onClick={() => addToCart(product.name)} className="h-8 w-8 rounded-full bg-white text-lg ring-1 ring-slate-200">+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between"><span>Produce subtotal</span><span>₹{produceSubtotal}</span></div>
                  <div className="flex items-center justify-between"><span>Logistics cost</span><span>₹{logisticsCost}</span></div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-bold text-slate-900"><span>Total</span><span>₹{produceSubtotal + logisticsCost}</span></div>
                </div>

                <button
                  type="button"
                  disabled={cartCount === 0}
                  onClick={() => setShowCheckout(true)}
                  className="mt-5 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Checkout ({cartCount} kg)
                </button>
              </div>

              <div id="retail-orders" className="scroll-mt-24 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <h3 className="text-xl font-black text-slate-900">Orders</h3>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
                      <span>Order #FDR-2048</span>
                      <span className="font-bold text-emerald-700">{orderPlaced ? 'Placed' : 'Confirmed'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      {orderTimeline.map((step, index) => (
                        <div key={step} className="flex flex-col items-center gap-2">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}
                          >
                            {index + 1}
                          </div>
                          <span className="text-[10px] text-slate-500">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
