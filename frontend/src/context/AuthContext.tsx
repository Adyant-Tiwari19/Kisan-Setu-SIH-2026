import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  authService,
  type User,
  type LoginCredentials,
  type RegisterData,
  type AuthResponse,
} from '../services/authService'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isProfileVisible: boolean
  toggleProfile: () => void
  login: (credentials: LoginCredentials) => Promise<AuthResponse>
  verifyLoginOtp: (phone: string, otp: string) => Promise<AuthResponse>
  verifyRegisterOtp: (data: RegisterData, otp: string) => Promise<AuthResponse>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser())
  const [token, setToken] = useState<string | null>(() => authService.getAuthToken())
  const [isLoading, setIsLoading] = useState(false)
  const [isProfileVisible, setIsProfileVisible] = useState(false)

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== 'farm_direct_auth_session') return
      setUser(authService.getCurrentUser())
      setToken(authService.getAuthToken())
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true)
    try {
      const res = await authService.login(credentials)
      if (res.success && res.user) {
        setUser(res.user)
        setToken(res.token || authService.getAuthToken())
      }
      return res
    } finally {
      setIsLoading(false)
    }
  }

  const verifyLoginOtp = async (phone: string, otp: string): Promise<AuthResponse> => {
    setIsLoading(true)
    try {
      const res = await authService.verifyLoginOtp(phone, otp)
      if (res.success && res.user) {
        setUser(res.user)
        setToken(res.token || authService.getAuthToken())
      }
      return res
    } finally {
      setIsLoading(false)
    }
  }

  const verifyRegisterOtp = async (data: RegisterData, otp: string): Promise<AuthResponse> => {
    setIsLoading(true)
    try {
      const res = await authService.verifyRegisterOtp(data, otp)
      if (res.success && res.user) {
        setUser(res.user)
        setToken(res.token || authService.getAuthToken())
      }
      return res
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    setToken(null)
    setIsProfileVisible(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isProfileVisible,
        toggleProfile: () => setIsProfileVisible((visible) => !visible),
        login,
        verifyLoginOtp,
        verifyRegisterOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
