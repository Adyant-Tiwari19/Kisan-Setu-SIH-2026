import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { aiService, type AiMatchCard } from '../services/aiService'
import { orderService, type Order } from '../services/orderService'

const navItems = ['Home', 'Requirements', 'Matches', 'Orders', 'Escrow Vault']

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

const initialRfq = {
  Crop: 'Tomato',
  Variety: 'Hybrid Grade A',
  'Required quantity': '500',
  'Quality/grade': 'Grade A',
  'Preferred region': 'Nashik / Maharashtra',
  'Delivery location': 'Bengaluru cold logistics hub',
  'Delivery window': 'Thu 9:00 AM - 2:00 PM',
  'Maximum price': '40',
  'Additional requirements': 'Fresh, uniform grading, cold transport',
}

const fieldPlaceholders: Record<string, string> = {
  Crop: 'e.g. Tomato',
  Variety: 'e.g. Hybrid Grade A',
  'Required quantity': 'e.g. 500 (in kg)',
  'Quality/grade': 'e.g. Grade A',
  'Preferred region': 'e.g. Nashik',
  'Delivery location': 'e.g. Bengaluru cold hub',
  'Delivery window': 'e.g. Thu 9:00 AM - 2:00 PM',
  'Maximum price': 'e.g. 40 (₹/kg)',
  'Additional requirements': 'e.g. Fresh, uniform size',
}

export function BulkBuyerDashboard() {
  const { user } = useAuth()
  const [showCheckout, setShowCheckout] = useState(false)
  const [rfq, setRfq] = useState(initialRfq)
  const [selectedSupplier, setSelectedSupplier] = useState('Green Valley FPO')
  const [selectedLid, setSelectedLid] = useState<number | null>(null)
  const [activeNav, setActiveNav] = useState('Home')
  const [submittedRfq, setSubmittedRfq] = useState(false)
  const [comparison, setComparison] = useState<string | null>(null)
  const [dashboardMessage, setDashboardMessage] = useState('')
  const [isMatching, setIsMatching] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)

  // Escrow Lock Success Modal State
  const [lockedEscrowModalOrder, setLockedEscrowModalOrder] = useState<Order | null>(null)

  // Live state from backend
  const [aiMatches, setAiMatches] = useState<AiMatchCard[]>([])
  const [bulkOrders, setBulkOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadInitialMatches = async () => {
    setIsLoading(true)
    try {
      const [matchesData, ordersData] = await Promise.all([
        aiService.getAiBuyerMatches(rfq.Crop || 'Tomato'),
        orderService.getMyOrders(),
      ])
      const activeLids = new Set(ordersData.filter((o) => ['placed', 'clustered', 'out_for_delivery'].includes(o.status)).map((o) => o.lid))
      const availableMatches = matchesData.filter((m) => !m.lid || !activeLids.has(m.lid))

      setAiMatches(availableMatches)
      setBulkOrders(ordersData)
      if (availableMatches.length > 0) {
        setSelectedSupplier(availableMatches[0].name)
        setSelectedLid(availableMatches[0].lid || null)
      }
    } catch (err: any) {
      console.error('Error loading AI matches:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInitialMatches()
  }, [])

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
    const targetId =
      item === 'Home'
        ? 'bulk-overview'
        : item === 'Requirements'
        ? 'rfq-form'
        : item === 'Matches'
        ? 'smart-matches'
        : item === 'Orders'
        ? 'recent-purchases'
        : item === 'Escrow Vault'
        ? 'escrow-vault-section'
        : null
    if (targetId) scrollToSection(targetId)
  }

  const handleGetAiMatches = async () => {
    setIsMatching(true)
    setDashboardMessage('')
    try {
      const freshMatches = await aiService.getAiBuyerMatches(rfq.Crop || 'Tomato')
      const activeLids = new Set(bulkOrders.filter((o) => ['placed', 'clustered', 'out_for_delivery'].includes(o.status)).map((o) => o.lid))
      const availableMatches = freshMatches.filter((m) => !m.lid || !activeLids.has(m.lid))

      setAiMatches(availableMatches)
      setSubmittedRfq(true)
      if (availableMatches.length > 0) {
        setSelectedSupplier(availableMatches[0].name)
        setSelectedLid(availableMatches[0].lid || null)
        setDashboardMessage(`✨ AI Engine evaluated regional FPO listings for ${rfq.Crop || 'produce'}. ${availableMatches.length} verified suppliers ranked.`)
      } else {
        setDashboardMessage(`No new unprocured FPO listings found for '${rfq.Crop}'.`)
      }
      setActiveNav('Matches')
      scrollToSection('smart-matches')
    } finally {
      setIsMatching(false)
    }
  }

  const handlePlaceBulkOrder = async () => {
    setIsPlacingOrder(true)
    setDashboardMessage('')
    try {
      const qty = Number(rfq['Required quantity']) || 500
      const targetMatch = aiMatches.find((m) => m.name === selectedSupplier) || aiMatches[0]
      const lid = selectedLid || targetMatch?.lid

      if (!lid) {
        throw new Error('Please select a valid supplier from the AI matches list.')
      }

      const newOrder = await orderService.placeOrder({
        lid,
        quantity: qty,
      })

      // Update state with newly created order
      setBulkOrders((prev) => [newOrder, ...prev.filter((o) => o.oid !== newOrder.oid)])
      
      // Remove the procured supplier from the active AI match engine list
      setAiMatches((prev) => {
        const remaining = prev.filter((m) => m.lid !== lid && m.name !== selectedSupplier)
        if (remaining.length > 0) {
          setSelectedSupplier(remaining[0].name)
          setSelectedLid(remaining[0].lid || null)
        } else {
          setSelectedSupplier('')
          setSelectedLid(null)
        }
        return remaining
      })

      setShowCheckout(false)
      setLockedEscrowModalOrder(newOrder)
      setDashboardMessage(`🔒 Escrow locked successfully for PO #${newOrder.oid}! Supplier ${selectedSupplier} moved to Procurement Orders & Escrow Vault.`)
    } catch (err: any) {
      setDashboardMessage(`Could not generate bulk order: ${err.message || 'Error'}`)
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const handleReleaseEscrow = async (oid: number) => {
    if (!window.confirm(`Release escrow funds for Order #${oid} to the producer? This confirms quality inspection passed.`)) return
    setUpdatingOrderId(oid)
    try {
      const updated = await orderService.updateOrderStatus(oid, { status: 'settled' })
      setBulkOrders((prev) => prev.map((o) => (o.oid === oid ? updated : o)))
      setDashboardMessage(`✅ Escrow for Order #${oid} has been released directly to the farmer.`)
    } catch (err: any) {
      setDashboardMessage(`Failed to release escrow: ${err.message || 'Error'}`)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleDisputeEscrow = async (oid: number) => {
    const reason = window.prompt('Please enter the quality issue / dispute reason to freeze escrow:')
    if (!reason) return
    setUpdatingOrderId(oid)
    try {
      const updated = await orderService.updateOrderStatus(oid, { status: 'disputed', dispute_reason: reason })
      setBulkOrders((prev) => prev.map((o) => (o.oid === oid ? updated : o)))
      setDashboardMessage(`⚠️ Escrow for Order #${oid} is FROZEN. Dispute mediation initiated.`)
    } catch (err: any) {
      setDashboardMessage(`Failed to dispute order: ${err.message || 'Error'}`)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const selectedMatch = aiMatches.find((m) => m.name === selectedSupplier) || aiMatches[0]
  const unitPriceNum = Number(selectedMatch?.landed?.replace(/[^0-9.]/g, '') || 32)
  const reqQty = Number(rfq['Required quantity']) || 500
  const produceCost = unitPriceNum * reqQty
  const logisticsClusteringCost = Math.round(reqQty * 1.5)
  const totalLandedCost = produceCost + logisticsClusteringCost

  // Escrow metrics
  const activeEscrowLocked = bulkOrders
    .filter((o) => ['placed', 'clustered', 'out_for_delivery', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + o.landed_price, 0)

  const settledEscrowAmount = bulkOrders
    .filter((o) => o.status === 'settled')
    .reduce((sum, o) => sum + o.landed_price, 0)

  const disputedEscrowAmount = bulkOrders
    .filter((o) => o.status === 'disputed')
    .reduce((sum, o) => sum + o.landed_price, 0)

  const dashboardStats = [
    { label: 'Active RFQs', value: `${submittedRfq ? 1 : 0}` },
    { label: 'AI Matched FPOs', value: `${aiMatches.length}` },
    { label: 'Escrow Locked', value: `₹${activeEscrowLocked.toLocaleString('en-IN')}` },
    { label: 'Settled Payouts', value: `₹${settledEscrowAmount.toLocaleString('en-IN')}` },
    { label: 'Active POs', value: `${bulkOrders.length}` },
  ]

  return (
    <section className="section-shell py-16">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-6">
        <div className="rounded-[1.6rem] bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Bulk Buyer & Institutional</div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900 md:text-3xl">
                Procurement Hub {user?.organization ? `· ${user.organization}` : ''} {isLoading && <span className="text-xs text-slate-400 font-normal">(syncing...)</span>}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveNav('Requirements')
                scrollToSection('rfq-form')
              }}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition"
            >
              + Create RFQ
            </button>
          </div>

          {/* Navigation Bar */}
          <div id="bulk-overview" className="scroll-mt-24 mt-5 flex gap-2 overflow-x-auto pb-2 md:gap-3">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  item === activeNav ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-emerald-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {dashboardMessage && (
            <div className="mt-4 rounded-xl bg-emerald-100/90 px-4 py-3 text-sm font-semibold text-emerald-900 border border-emerald-200 flex items-center justify-between">
              <span>{dashboardMessage}</span>
              <button type="button" onClick={() => setDashboardMessage('')} className="text-emerald-700 hover:text-emerald-950 font-bold ml-2">✕</button>
            </div>
          )}

          {/* Escrow Financial Overview Cards */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {dashboardStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</div>
                <div className="mt-1 text-xl font-black text-slate-900">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Escrow Protection Guarantee Banner */}
          <div className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-xl text-emerald-400">
                🛡️
              </div>
              <div>
                <div className="text-sm font-bold">Direct Escrow Protection Active</div>
                <div className="text-xs text-slate-300">
                  Funds locked in tri-party digital escrow. Payouts only release after digital grade & weight inspection.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleNavClick('Escrow Vault')}
              className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-white/20 transition"
            >
              View Escrow Vault →
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left: Smart AI Matches & Orders */}
            <div className="space-y-6">
              {/* Smart Matches */}
              <div id="smart-matches" className="scroll-mt-24 rounded-[1.6rem] bg-slate-900 p-5 text-white shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-white">AI Supplier Match Engine</h3>
                      {rfq.Crop && (
                        <span className="rounded-full bg-emerald-500/30 px-3 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                          🌾 {rfq.Crop} {rfq.Variety ? `· ${rfq.Variety}` : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Multi-factor ranking for <strong className="text-emerald-400">{rfq['Required quantity'] || '500'} kg of {rfq.Crop || 'produce'}</strong> delivered to {rfq['Delivery location'] || 'Hub'}.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                    {aiMatches.length} FPOs Evaluated
                  </span>
                </div>

                <div className="mt-4 space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {aiMatches.length > 0 ? (
                    aiMatches.map((m) => {
                      const isSelected = selectedSupplier === m.name
                      const displayedCrop = m.crop_name || rfq.Crop || 'Produce'
                      return (
                        <div
                          key={m.name}
                          className={`rounded-2xl p-4 transition border ${
                            isSelected ? 'bg-emerald-950/70 border-emerald-500/60 ring-2 ring-emerald-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-base text-white">{m.name}</span>
                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                  {m.value}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-xs font-bold text-emerald-300">
                                <span>🌾 Crop: {displayedCrop}</span>
                                {rfq.Variety && <span className="text-slate-300 font-normal">({rfq.Variety})</span>}
                                {m.quantity_available ? <span className="text-slate-400 font-normal">· {m.quantity_available} kg in stock</span> : null}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                                <span>📍 {m.distance}</span>
                                <span>🌱 {m.freshness}</span>
                                <span className="font-semibold text-emerald-300">🎯 {m.reliability}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-black text-emerald-400">{m.landed}</div>
                              <div className="text-[10px] text-slate-400">Landed / Delivered</div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                            <span className="text-slate-300">💡 {m.recommendation}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setComparison(comparison === m.name ? null : m.name)}
                                className="text-xs font-bold text-slate-300 hover:text-white underline underline-offset-2"
                              >
                                {comparison === m.name ? 'Hide Details' : 'Score Details'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSupplier(m.name)
                                  setSelectedLid(m.lid || null)
                                  setShowCheckout(true)
                                  scrollToSection('bulk-checkout')
                                }}
                                className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
                              >
                                Lock Escrow for {displayedCrop} →
                              </button>
                            </div>
                          </div>

                          {comparison === m.name && (
                            <div className="mt-3 rounded-xl bg-black/40 p-3 text-xs space-y-1.5 border border-emerald-500/20">
                              <div className="font-bold text-emerald-300">AI Multi-Factor Scoring Breakdown:</div>
                              <div className="flex justify-between text-slate-300">
                                <span>Price Competitiveness:</span>
                                <span className="font-bold text-white">96%</span>
                              </div>
                              <div className="flex justify-between text-slate-300">
                                <span>Logistics & Route Efficiency:</span>
                                <span className="font-bold text-white">94%</span>
                              </div>
                              <div className="flex justify-between text-slate-300">
                                <span>Harvest Age & Cold Integrity:</span>
                                <span className="font-bold text-white">98%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-950/40 p-8 text-center text-slate-300">
                      <div className="text-3xl mb-2">🎉</div>
                      <div className="font-bold text-white text-base">All Candidate Matches Procured & Escrow Locked!</div>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        All matched FPOs for {rfq.Crop || 'this crop'} have been secured into direct escrow contracts. View active shipments below in Orders or submit a new RFQ for other commodities.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveNav('Requirements')
                          scrollToSection('rfq-form')
                        }}
                        className="mt-4 rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
                      >
                        + Create New Crop RFQ
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Purchases & Live Orders with Escrow Controls */}
              <div id="recent-purchases" className="scroll-mt-24 rounded-[1.6rem] bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Procurement Orders & Logistics</h3>
                    <p className="text-xs text-slate-500">Live order status, cold dispatch tracking, and escrow release controls.</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{bulkOrders.length} records</span>
                </div>

                <div className="mt-4 space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {bulkOrders.length > 0 ? (
                    bulkOrders.map((o) => {
                      const isEscrowLocked = ['placed', 'clustered', 'out_for_delivery', 'delivered'].includes(o.status)
                      const isSettled = o.status === 'settled'
                      const isDisputed = o.status === 'disputed'

                      return (
                        <div key={o.oid} className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 text-sm">PO #{o.oid}</span>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isSettled
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isDisputed
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {o.status.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-slate-600">
                                <strong>{o.crop_name || 'Produce'}</strong> ({o.quantity} kg) · Supplier: {o.farmer_name || 'Verified FPO'}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                Produce: ₹{o.produce_price.toLocaleString('en-IN')} · Logistics: ₹{o.logistics_price.toLocaleString('en-IN')} · <strong>Total Landed: ₹{o.landed_price.toLocaleString('en-IN')}</strong>
                              </div>
                            </div>

                            <div className="text-right">
                              {isEscrowLocked && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                                  🔒 Escrow Locked
                                </span>
                              )}
                              {isSettled && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                                  💳 Escrow Settled
                                </span>
                              )}
                              {isDisputed && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold text-rose-800">
                                  🛑 Escrow Frozen
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Escrow Release & Quality Inspection Action Bar */}
                          <div className="mt-3 flex flex-wrap items-center justify-between border-t border-slate-200 pt-2.5 text-xs">
                            <span className="text-slate-500 text-[11px]">
                              {o.delivered_at
                                ? `Delivered on ${new Date(o.delivered_at).toLocaleDateString()}`
                                : `Ordered on ${new Date(o.ordered_at).toLocaleDateString()}`}
                            </span>

                            <div className="flex items-center gap-2">
                              {!isSettled && !isDisputed && (
                                <>
                                  <button
                                    type="button"
                                    disabled={updatingOrderId === o.oid}
                                    onClick={() => handleReleaseEscrow(o.oid)}
                                    className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow hover:bg-emerald-700 transition disabled:opacity-50"
                                  >
                                    {updatingOrderId === o.oid ? 'Processing...' : 'Accept & Release Escrow 💳'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={updatingOrderId === o.oid}
                                    onClick={() => handleDisputeEscrow(o.oid)}
                                    className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition border border-rose-200"
                                  >
                                    Dispute ⚠️
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                      <div className="text-3xl mb-2">🏢</div>
                      <div className="font-bold text-slate-800 text-sm">No procurement orders yet</div>
                      <p className="text-xs text-slate-500 mt-1">
                        Submit your crop requirements above to match with verified FPOs and issue direct purchase contracts with secured escrow.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: RFQ Form & Escrow Contract Creation */}
            <div className="space-y-6">
              {/* RFQ Form */}
              <div id="rfq-form" className="scroll-mt-24 rounded-[1.6rem] bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Smart RFQ Generator</h3>
                    <p className="text-xs text-slate-500">Specify requirements to run multi-factor supplier ranking.</p>
                  </div>
                  {submittedRfq ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                      ✓ {rfq.Crop} RFQ Live
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      Draft RFQ
                    </span>
                  )}
                </div>

                {submittedRfq && (
                  <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-950 flex items-center justify-between">
                    <div>
                      <strong>Active Requirement:</strong> {rfq['Required quantity'] || '500'} kg of <strong>{rfq.Crop}</strong> {rfq.Variety ? `(${rfq.Variety})` : ''} · Max Rate: ₹{rfq['Maximum price'] || '40'}/kg
                    </div>
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">Live</span>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {rfqFields.map((field) => (
                    <div key={field}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1" htmlFor={`rfq-${field}`}>
                        {field}
                      </label>
                      <input
                        id={`rfq-${field}`}
                        value={rfq[field as keyof typeof rfq] || ''}
                        onChange={(e) => updateRfq(field, e.target.value)}
                        placeholder={fieldPlaceholders[field]}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={isMatching}
                  onClick={handleGetAiMatches}
                  className="mt-5 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isMatching ? 'Running AI Seller Score Engine...' : `⚡ Match & Rank Suppliers for ${rfq.Crop || 'Produce'}`}
                </button>
              </div>

              {/* Checkout / Contract Generation with Explicit Escrow Details */}
              {showCheckout && (
                <div id="bulk-checkout" className="scroll-mt-24 rounded-[1.6rem] bg-slate-900 p-5 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white">Generate Direct PO & Escrow</h3>
                      <p className="text-xs text-slate-300">
                        Selected Supplier: <span className="font-bold text-emerald-400">{selectedSupplier}</span>
                      </p>
                    </div>
                    <span className="text-xl">🔒</span>
                  </div>

                  <div className="mt-4 space-y-2 rounded-xl bg-white/5 p-3.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>Crop & Requirement:</span>
                      <span className="font-bold text-white">{rfq.Crop} ({reqQty} kg · {rfq.Variety || 'Grade A'})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Produce Rate:</span>
                      <span className="font-bold text-white">₹{unitPriceNum}/kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Logistics & Cold Transport:</span>
                      <span className="font-bold text-white">₹{logisticsClusteringCost}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold text-emerald-400">
                      <span>Total Escrow Amount to Lock:</span>
                      <span>₹{totalLandedCost.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-emerald-900/40 p-3 text-[11px] text-emerald-200 border border-emerald-500/20">
                    🛡️ <strong>Escrow Vault Protection:</strong> This amount will be locked in escrow. The producer receives payment only after you accept delivery of {rfq.Crop} at the destination hub.
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={isPlacingOrder}
                      onClick={handlePlaceBulkOrder}
                      className="w-full rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {isPlacingOrder ? 'Locking Escrow with Backend...' : `Confirm PO & Lock Escrow (₹${totalLandedCost.toLocaleString('en-IN')}) →`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCheckout(false)}
                      className="rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Escrow Vault Details Section */}
              <div id="escrow-vault-section" className="scroll-mt-24 rounded-[1.6rem] bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Escrow Vault Summary</h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    RBI Regulated
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
                    <span className="text-slate-600">Active Locked Funds:</span>
                    <span className="font-bold text-slate-900 text-sm">₹{activeEscrowLocked.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
                    <span className="text-slate-600">Settled to Producers:</span>
                    <span className="font-bold text-emerald-600 text-sm">₹{settledEscrowAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {disputedEscrowAmount > 0 && (
                    <div className="flex items-center justify-between rounded-xl bg-rose-50 p-3 text-xs border border-rose-200">
                      <span className="text-rose-700">Frozen in Disputes:</span>
                      <span className="font-bold text-rose-700 text-sm">₹{disputedEscrowAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Escrow Lock Certificate Modal */}
      {lockedEscrowModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
              🔒
            </div>

            <h3 className="mt-4 text-2xl font-black text-slate-900">
              Escrow Successfully Locked!
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Purchase Contract & Escrow Guarantee Active
            </p>

            <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-left text-xs text-slate-700 border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">Purchase Order:</span>
                <strong className="text-slate-900">PO #{lockedEscrowModalOrder.oid}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Crop Requested:</span>
                <strong className="text-emerald-700 font-black">{lockedEscrowModalOrder.crop_name || rfq.Crop} {rfq.Variety ? `(${rfq.Variety})` : ''}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Supplier / FPO:</span>
                <strong className="text-slate-900">{selectedSupplier}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantity Ordered:</span>
                <strong className="text-slate-900">{lockedEscrowModalOrder.quantity} kg</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="font-bold text-slate-700">Escrow Value Protected:</span>
                <strong className="font-black text-emerald-700">₹{lockedEscrowModalOrder.landed_price.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-[11px] text-emerald-800 text-left leading-relaxed">
              ✅ <strong>Protection Terms:</strong> Funds are locked securely. When cold-chain delivery of <strong>{rfq.Crop}</strong> reaches your depot, inspect the harvest and click <em>"Accept & Release Escrow"</em> to credit the farmer.
            </div>

            <button
              type="button"
              onClick={() => {
                setLockedEscrowModalOrder(null)
                setActiveNav('Orders')
                scrollToSection('recent-purchases')
              }}
              className="mt-5 w-full rounded-full bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 transition shadow-lg"
            >
              View Order in Procurement Vault →
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
