import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RoleSelection } from './components/RoleSelection'
import { FarmerDashboard } from './components/FarmerDashboard'
import { RetailMarketplace } from './components/RetailMarketplace'
import { BulkBuyerDashboard } from './components/BulkBuyerDashboard'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { Benefits } from './components/Benefits'
import { EditProfile } from './components/EditProfile'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import { Capacitor } from '@capacitor/core'

function StartupRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null
  if (!Capacitor.isNativePlatform() || !user) return null

  const dashboardPath = user.backendRole === 'FARMER_FPO' || user.role === 'farmer'
    ? '/farmer'
    : user.backendRole === 'BULK_BUYER' || user.role === 'bulk-buyer'
      ? '/buyer'
      : '/retailer'

  return <Navigate to={dashboardPath} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={
          <>
            <StartupRoute />
            <Hero />
            <HowItWorks />
            <Benefits />
          </>
        } />
        <Route path="sign-in" element={<RoleSelection key="sign-in" />} />
        <Route path="join-now" element={<RoleSelection key="join-now" />} />
        <Route path="role-selection" element={<Navigate to="/sign-in" replace />} />
        <Route element={<ProtectedRoute />}>
          <Route path="farmer" element={<FarmerDashboard />} />
          <Route path="retailer" element={<RetailMarketplace />} />
          <Route path="marketplace" element={<RetailMarketplace />} />
          <Route path="buyer" element={<BulkBuyerDashboard />} />
          <Route path="profile/edit" element={<EditProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
