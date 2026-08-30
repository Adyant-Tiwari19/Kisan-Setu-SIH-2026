import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RoleSelection } from './components/RoleSelection'
import { FarmerDashboard } from './components/FarmerDashboard'
import { RetailMarketplace } from './components/RetailMarketplace'
import { BulkBuyerDashboard } from './components/BulkBuyerDashboard'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { Benefits } from './components/Benefits'
import { CustomerTypes } from './components/CustomerTypes'
import { AISection } from './components/AISection'
import { ImpactSection } from './components/ImpactSection'
import { useAuth } from './context/AuthContext'
import type { UserRole } from './services/authService'

function RoleProtectedRoute({
  allowedRole,
  children,
}: {
  allowedRole: UserRole
  children: React.ReactNode
}) {
  const { user } = useAuth()

  // If not logged in, prompt sign in
  if (!user) {
    return <Navigate to="/sign-in" replace />
  }

  // If logged in with a different role, redirect to their authorized workspace
  if (user.role !== allowedRole) {
    const userDefaultRoute =
      user.role === 'farmer' ? '/farmer' : user.role === 'retailer' ? '/retailer' : '/buyer'
    return <Navigate to={userDefaultRoute} replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  const { user } = useAuth()

  // Helper to direct logged-in user to their specific workspace from generic /dashboard
  const userRoute =
    user?.role === 'farmer' ? '/farmer' : user?.role === 'retailer' ? '/retailer' : '/buyer'

  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route
          index
          element={
            <>
              <Hero />
              <HowItWorks />
              <Benefits />
              <CustomerTypes />
              <AISection />
              <ImpactSection />
            </>
          }
        />
        <Route path="sign-in" element={user ? <Navigate to={userRoute} replace /> : <RoleSelection key="sign-in" />} />
        <Route path="join-now" element={user ? <Navigate to={userRoute} replace /> : <RoleSelection key="join-now" />} />
        <Route path="role-selection" element={<Navigate to="/sign-in" replace />} />
        <Route path="dashboard" element={<Navigate to={user ? userRoute : '/sign-in'} replace />} />

        {/* Role Protected Routes */}
        <Route
          path="farmer"
          element={
            <RoleProtectedRoute allowedRole="farmer">
              <FarmerDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="retailer"
          element={
            <RoleProtectedRoute allowedRole="retailer">
              <RetailMarketplace />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="marketplace"
          element={
            <RoleProtectedRoute allowedRole="retailer">
              <RetailMarketplace />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="buyer"
          element={
            <RoleProtectedRoute allowedRole="bulk-buyer">
              <BulkBuyerDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
