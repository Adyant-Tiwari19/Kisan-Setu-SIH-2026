/**
 * Centralized API Client for Farm Direct
 * Handles authentication header injection, standard REST methods, and network error resilience.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')

export interface ApiError {
  status: number
  message: string
  detail?: any
}

class ApiClient {
  private getAuthToken(): string | null {
    try {
      const raw = localStorage.getItem('farm_direct_auth_session')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.token) return parsed.token
      }
      const directToken = localStorage.getItem('token') || localStorage.getItem('access_token')
      if (directToken) return directToken
      return null
    } catch {
      return null
    }
  }

  /**
   * Main request dispatcher
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
    const token = this.getAuthToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // If body is URLSearchParams or FormData, don't force application/json
    if (options.body instanceof URLSearchParams || options.body instanceof FormData) {
      delete headers['Content-Type']
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`
      let errorDetail = null
      try {
        const errorData = await response.json()
        errorDetail = errorData
        errorMessage = errorData.detail || errorData.message || errorMessage
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
        }
      } catch {
        // Response body was not JSON
      }

      const error: ApiError = {
        status: response.status,
        message: errorMessage,
        detail: errorDetail,
      }
      throw error
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return (await response.json()) as T
  }

  // Convenience methods
  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const isUrlEncoded = options?.headers && (options.headers as any)['Content-Type'] === 'application/x-www-form-urlencoded'
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isUrlEncoded ? data : (data !== undefined ? JSON.stringify(data) : undefined),
    })
  }

  patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  }

  put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  /**
   * Check if backend API server is reachable
   */
  async isOnline(): Promise<boolean> {
    try {
      const res = await fetch(API_BASE_URL.replace('/api/v1', '') || 'http://localhost:8000', {
        method: 'GET',
        signal: AbortSignal.timeout(1500),
      })
      return res.ok || res.status === 404 // At least server answered
    } catch {
      return false
    }
  }
}

export const apiClient = new ApiClient()
