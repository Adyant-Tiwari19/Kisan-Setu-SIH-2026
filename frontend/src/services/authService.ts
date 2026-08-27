/**
 * Fresh Ferme - Authentication Service
 * 
 * Backend-Ready Architecture:
 * - Define standard DTOs (Data Transfer Objects) and interface contracts.
 * - Supports configurable REST API endpoints via `VITE_API_URL`.
 * - Currently implements a fully featured mock layer with realistic network delays,
 *   token generation, and multi-role simulation so all 3 UIs can be accessed seamlessly.
 */

export type UserRole = 'farmer' | 'retailer' | 'bulk-buyer'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  organization?: string
  location?: string
  avatar?: string
  createdAt: string
}

export interface LoginCredentials {
  emailOrPhone: string
  password: string
  role?: UserRole
  rememberMe?: boolean
}

export interface RegisterData {
  name: string
  email: string
  phone: string
  password: string
  role: UserRole
  organization?: string
  location?: string
}

export interface AuthResponse {
  success: boolean
  token?: string
  user?: User
  message?: string
  error?: string
}

const STORAGE_KEY = 'farm_direct_auth_session'
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// Demo accounts for instant testing of all three UIs
export const DEMO_USERS: Record<UserRole, User> = {
  farmer: {
    id: 'usr_farmer_01',
    name: 'Ravi Kumar',
    email: 'ravi.farmer@freshferme.ai',
    phone: '+91 98450 12345',
    role: 'farmer',
    organization: 'Green Valley FPO',
    location: 'Nashik, Maharashtra',
    createdAt: new Date().toISOString(),
  },
  retailer: {
    id: 'usr_retailer_02',
    name: 'Priya Sharma',
    email: 'priya.retail@freshmart.in',
    phone: '+91 98765 43210',
    role: 'retailer',
    organization: 'FreshMart Organics',
    location: 'Bengaluru, Karnataka',
    createdAt: new Date().toISOString(),
  },
  'bulk-buyer': {
    id: 'usr_buyer_03',
    name: 'Vikram Mehta',
    email: 'v.mehta@metroagro.com',
    phone: '+91 97654 32100',
    role: 'bulk-buyer',
    organization: 'Metro Procurement & Cold Chain',
    location: 'Kurnool / Hyderabad',
    createdAt: new Date().toISOString(),
  },
}

class AuthService {
  /**
   * Login with email/phone and password.
   * Connects to backend API if configured, otherwise uses simulated auth layer.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // If a real backend URL is configured, forward the request
    if (API_BASE_URL) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        })
        const data = (await response.json()) as AuthResponse
        if (data.success && data.user && data.token) {
          this.saveSession(data.token, data.user)
        }
        return data
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Network error during login',
        }
      }
    }

    // Simulated local authentication with realistic latency
    await new Promise((resolve) => setTimeout(resolve, 600))

    if (!credentials.emailOrPhone.trim() || !credentials.password.trim()) {
      return {
        success: false,
        error: 'Please enter both your email/phone and password.',
      }
    }

    if (credentials.password.length < 4) {
      return {
        success: false,
        error: 'Password must be at least 4 characters.',
      }
    }

    // Determine target role (use provided role, or find matching demo, or default to retailer)
    let selectedRole: UserRole = credentials.role || 'farmer'
    const lowerInput = credentials.emailOrPhone.toLowerCase()

    if (lowerInput.includes('farmer') || lowerInput.includes('ravi')) {
      selectedRole = 'farmer'
    } else if (lowerInput.includes('retail') || lowerInput.includes('priya') || lowerInput.includes('mart')) {
      selectedRole = 'retailer'
    } else if (lowerInput.includes('buyer') || lowerInput.includes('bulk') || lowerInput.includes('metro')) {
      selectedRole = 'bulk-buyer'
    }

    const demoUser = DEMO_USERS[selectedRole]
    const user: User = {
      ...demoUser,
      email: credentials.emailOrPhone.includes('@') ? credentials.emailOrPhone : demoUser.email,
      phone: !credentials.emailOrPhone.includes('@') ? credentials.emailOrPhone : demoUser.phone,
    }

    const token = `jwt_mock_${user.role}_${Date.now()}`
    this.saveSession(token, user)

    return {
      success: true,
      token,
      user,
      message: `Welcome back, ${user.name}!`,
    }
  }

  /**
   * Register a new user account.
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    if (API_BASE_URL) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = (await response.json()) as AuthResponse
        if (result.success && result.user && result.token) {
          this.saveSession(result.token, result.user)
        }
        return result
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Network error during registration',
        }
      }
    }

    // Simulated local registration
    await new Promise((resolve) => setTimeout(resolve, 700))

    if (!data.name.trim() || !data.email.trim() || !data.password.trim()) {
      return {
        success: false,
        error: 'Please fill in all required fields.',
      }
    }

    if (data.password.length < 6) {
      return {
        success: false,
        error: 'Password should be at least 6 characters long.',
      }
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      role: data.role,
      organization: data.organization?.trim() || `${data.name.trim()}'s Agricultural Venture`,
      location: data.location?.trim() || 'India',
      createdAt: new Date().toISOString(),
    }

    const token = `jwt_mock_${newUser.role}_${Date.now()}`
    this.saveSession(token, newUser)

    return {
      success: true,
      token,
      user: newUser,
      message: `Account created successfully! Welcome to Fresh Ferme, ${newUser.name}.`,
    }
  }

  /**
   * Instant Demo Login for testing specific roles
   */
  async demoLogin(role: UserRole): Promise<AuthResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const user = DEMO_USERS[role]
    const token = `jwt_demo_${role}_${Date.now()}`
    this.saveSession(token, user)
    return {
      success: true,
      token,
      user,
      message: `Logged in as demo ${role.replace('-', ' ')}.`,
    }
  }

  /**
   * Switch the active user role dynamically to test all 3 UIs
   */
  switchRole(targetRole: UserRole): User | null {
    const current = this.getCurrentUser()
    if (!current) {
      const demo = DEMO_USERS[targetRole]
      this.saveSession(`jwt_demo_${targetRole}_${Date.now()}`, demo)
      return demo
    }

    const updatedUser: User = {
      ...current,
      role: targetRole,
      organization: DEMO_USERS[targetRole].organization,
    }
    const token = this.getAuthToken() || `jwt_mock_${targetRole}_${Date.now()}`
    this.saveSession(token, updatedUser)
    return updatedUser
  }

  /**
   * Save session to LocalStorage
   */
  saveSession(token: string, user: User) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token, user, timestamp: Date.now() })
      )
      localStorage.setItem('farm-direct-logged-in', 'true')
    } catch {
      // Ignore storage errors in private browsing
    }
  }

  /**
   * Retrieve active user session
   */
  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed.user || null
    } catch {
      return null
    }
  }

  /**
   * Retrieve auth token for HTTP headers
   */
  getAuthToken(): string | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed.token || null
    } catch {
      return null
    }
  }

  /**
   * Log out and clear session
   */
  async logout(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('farm-direct-logged-in')
    } catch {
      // ignore
    }
  }
}

export const authService = new AuthService()
