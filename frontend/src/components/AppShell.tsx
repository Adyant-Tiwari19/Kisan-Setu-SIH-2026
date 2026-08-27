import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { DashboardHeader } from './DashboardHeader'
import { Footer } from './Footer'

export function AppShell() {
  const { pathname } = useLocation()
  const isDashboard = ['/farmer', '/retailer', '/marketplace', '/buyer'].includes(pathname)

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-slate-900">
      {isDashboard ? <DashboardHeader /> : <Header />}
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
