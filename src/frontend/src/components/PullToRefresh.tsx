import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'

export type RefreshRequest = {
  resolve: () => void
  handled: boolean
}

export function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const activePull = useRef(false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handleTouchStart = (event: TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshing) {
        startY.current = event.touches[0]?.clientY ?? null
        activePull.current = true
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!activePull.current || startY.current === null || isRefreshing) return
      const distance = Math.max(0, Math.min((event.touches[0]?.clientY ?? 0) - startY.current, 120))
      if (distance > 0) {
        event.preventDefault()
        setPullDistance(distance)
      }
    }

    const handleTouchEnd = () => {
      if (!activePull.current) return
      activePull.current = false
      const shouldRefresh = pullDistance >= 64
      startY.current = null
      setPullDistance(0)
      if (!shouldRefresh) return

      setIsRefreshing(true)
      let settled = false
      const request: RefreshRequest = {
        handled: false,
        resolve: () => {
          if (settled) return
          settled = true
          setIsRefreshing(false)
        },
      }
      window.dispatchEvent(new CustomEvent<RefreshRequest>('app-refresh-request', { detail: request }))
      window.setTimeout(request.resolve, request.handled ? 10000 : 250)
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isRefreshing, pullDistance])

  if (!Capacitor.isNativePlatform() || (!isRefreshing && pullDistance === 0)) return null

  return (
    <div
      className="fixed left-1/2 z-[100] flex -translate-x-1/2 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg"
      style={{ top: `${Math.max(12, pullDistance - 20)}px`, width: 42, height: 42 }}
      aria-live="polite"
      aria-label={isRefreshing ? 'Refreshing' : 'Pull to refresh'}
    >
      <span className={isRefreshing ? 'animate-spin text-xl' : 'text-xl'} aria-hidden="true">↻</span>
    </div>
  )
}
