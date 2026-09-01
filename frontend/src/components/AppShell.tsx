import { Outlet, useLocation } from 'react-router-dom'
import { DashboardHeader } from './DashboardHeader'
import { Footer } from './Footer'
import { Header } from './Header'

const dashboardRoutes = ['/farmer', '/retailer', '/marketplace', '/buyer']

export function AppShell() {
  const { pathname } = useLocation()
  const isDashboard = dashboardRoutes.includes(pathname)

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-slate-900">
      {isDashboard ? <DashboardHeader /> : <Header />}

      <main>
        <Outlet />
      </main>

      {!isDashboard && <Footer />}
    </div>
  )
}