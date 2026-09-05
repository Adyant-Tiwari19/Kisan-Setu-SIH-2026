import { useEffect, useState } from 'react'
import { listingService, type Listing } from '../services/listingService'

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}/kg`

const getImageUrl = (sampleImageUrl?: string | null) => {
  if (!sampleImageUrl) return null
  const filename = sampleImageUrl.split(/[\\/]/).pop()?.trim()
  return filename ? `/images/${encodeURIComponent(filename)}` : null
}

export function MarketplacePreview() {
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    listingService.getAllListings().then((data) => {
      if (isMounted) {
        setListings(data.slice(0, 4))
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section
      id="marketplace"
      style={{ background: '#fff', paddingTop: '5rem', paddingBottom: '5rem' }}
    >
      <div className="container">
        <div className="scroll-reveal" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="eyebrow text-fresh" style={{ display: 'block', marginBottom: '0.75rem' }}>Live on Fresh Ferme</span>
            <h2 className="display-md" style={{ color: 'var(--ff-navy)' }}>
              Fresh from the field,{' '}
              <span style={{ color: 'var(--ff-deep)' }}>right now.</span>
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#dcfce7', borderRadius: '100px', padding: '0.4rem 0.875rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>Live prices updating</span>
          </div>
        </div>

        <div className="scroll-reveal produce-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          {isLoading && (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--ff-muted)' }}>
              Loading live listings...
            </div>
          )}
          {!isLoading && listings.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--ff-muted)' }}>
              No active listings are available right now.
            </div>
          )}
          {listings.map((listing, index) => {
            const imageUrl = getImageUrl(listing.sample_img_url)
            return (
              <div
                key={listing.lid}
                className="produce-card scroll-reveal"
                style={{ animationDelay: `${index * 70}ms`, cursor: 'pointer', position: 'relative' }}
              >
                <div style={{ background: '#f0fdf4', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={listing.crop_name || 'Crop listing'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(event) => { event.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <span style={{ fontSize: '3.5rem' }}>🌱</span>
                  )}
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ff-navy)', lineHeight: 1.2 }}>
                        {listing.crop_name || `Crop #${listing.cid}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ff-muted)', marginTop: '0.2rem' }}>
                        Listing #{listing.lid}
                      </div>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: 'rgba(27,67,50,0.07)', margin: '0.875rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ff-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Available</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ff-slate)' }}>{listing.quantity_available} kg</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ff-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Price</div>
                      <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--ff-deep)', letterSpacing: '-0.02em' }}>{formatCurrency(listing.price_per_unit)}</div>
                    </div>
                  </div>

                  <a href="/marketplace" style={{ display: 'block', marginTop: '0.875rem', width: '100%', background: 'var(--ff-deep)', color: '#fff', borderRadius: '0.75rem', padding: '0.6rem', fontSize: '0.82rem', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
                    View listing →
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        <div className="scroll-reveal" style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <a href="/marketplace" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--ff-deep)', textDecoration: 'none', borderBottom: '2px solid var(--ff-mint)', paddingBottom: '0.1rem' }}>
            Browse all listings
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        @media (max-width: 900px) {
          .produce-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 500px) {
          .produce-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
