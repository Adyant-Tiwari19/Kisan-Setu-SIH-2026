import { Outlet, useLocation } from 'react-router-dom'
import { DashboardHeader } from './DashboardHeader'
import { Footer } from './Footer'
import { Header } from './Header'
import { PullToRefresh } from './PullToRefresh'
import { Capacitor } from '@capacitor/core'

const dashboardRoutes = ['/farmer', '/retailer', '/marketplace', '/buyer', '/profile/edit']

export function AppShell() {
  const { pathname } = useLocation()
  const isDashboard = dashboardRoutes.includes(pathname)

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-[#f7f5ef] text-slate-900 ${Capacitor.isNativePlatform() ? 'native-mobile-app' : ''}`}>
      <PullToRefresh />
      {isDashboard ? <DashboardHeader /> : <Header />}

      <main className="min-h-[calc(100vh-5rem)] w-full max-w-full overflow-x-hidden bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-amber-50/40 px-4 py-6 sm:px-6 lg:px-10">
        <Outlet />
      </main>

      {!isDashboard && <Footer />}
    </div>
  )
}