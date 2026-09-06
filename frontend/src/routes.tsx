import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RoleSelection } from './components/RoleSelection'
import { FarmerDashboard } from './components/FarmerDashboard'
import { RetailMarketplace } from './components/RetailMarketplace'
import { BulkBuyerDashboard } from './components/BulkBuyerDashboard'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { Benefits } from './components/Benefits'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={
          <>
            <Hero />
            <HowItWorks />
            <Benefits />
          </>
        } />
        <Route path="sign-in" element={<RoleSelection key="sign-in" />} />
        <Route path="join-now" element={<RoleSelection key="join-now" />} />
        <Route path="role-selection" element={<Navigate to="/sign-in" replace />} />
        <Route path="farmer" element={<FarmerDashboard />} />
        <Route path="retailer" element={<RetailMarketplace />} />
        <Route path="marketplace" element={<RetailMarketplace />} />
        <Route path="buyer" element={<BulkBuyerDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
