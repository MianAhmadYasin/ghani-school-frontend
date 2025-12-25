"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authService } from '@/services/authService'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Clear session helper
  const clearSession = useCallback(() => {
    
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('auth_timestamp')

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const secure = isHttps ? '; Secure' : ''
    document.cookie = `access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax${secure}`

    setUser(null)
    setIsAuthenticated(false)
  }, [])

  // Load session from storage
  const loadSession = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const storedUser = localStorage.getItem('user')
      const authTimestamp = localStorage.getItem('auth_timestamp')
      

      if (!token || !storedUser) {
        setIsLoading(false)
        return
      }

      // Check if token is expired (30 days)
      if (authTimestamp) {
        const tokenAge = Date.now() - parseInt(authTimestamp)
        const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
        const daysOld = (tokenAge / (24 * 60 * 60 * 1000)).toFixed(1)


        if (tokenAge > maxAge) {
          clearSession()
          setIsLoading(false)
          return
        }
      }

      // Parse user with error handling
      let parsedUser
      try {
        parsedUser = JSON.parse(storedUser)
        if (!parsedUser || !parsedUser.id || !parsedUser.email || !parsedUser.role) {
          throw new Error('Invalid user data structure')
        }
      } catch (parseError) {
        console.error('❌ Failed to parse stored user:', parseError)
        clearSession()
        setIsLoading(false)
        return
      }

      
      // Set user immediately from storage (fast app start)
      setUser(parsedUser)
      setIsAuthenticated(true)
      setIsLoading(false)
      
      // REMOVED: Backend verification - causes session clearing issues
      // We trust the stored token unless explicitly invalidated
    } catch (error) {
      console.error('❌ Failed to load session:', error)
      clearSession()
      setIsLoading(false)
    }
  }, [clearSession])

  // Initialize session on mount - only once
  useEffect(() => {
    loadSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentionally empty - only run once on mount

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await authService.login(email, password)
      
      // Validate response structure
      if (!response || !response.access_token || !response.user) {
        throw new Error('Invalid login response: missing access_token or user data')
      }

      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        full_name: response.user.full_name || '',
        role: response.user.role,
        phone: response.user.phone,
        address: response.user.address,
        avatar_url: response.user.avatar_url,
        created_at: response.user.created_at || new Date().toISOString(),
      }

      // Validate user data
      if (!userData.id || !userData.email || !userData.role) {
        throw new Error('Invalid user data in login response')
      }


      // Store in localStorage
      try {
        localStorage.setItem('access_token', response.access_token)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('auth_timestamp', Date.now().toString())
      } catch (storageError) {
        console.error('❌ Failed to store session:', storageError)
        throw new Error('Failed to save session. Please check browser storage permissions.')
      }

      // Store in cookie for middleware
      try {
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
        const secure = isHttps ? '; Secure' : ''
        const maxAge = 30 * 24 * 60 * 60 // 30 days
        document.cookie = `access_token=${response.access_token}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`
      } catch (cookieError) {
        console.warn('⚠️ Failed to set cookie:', cookieError)
        // Non-fatal, continue with localStorage only
      }

      setUser(userData)
      setIsAuthenticated(true)

      // Redirect based on role
      const redirectPaths: Record<string, string> = {
        admin: '/admin/dashboard',
        principal: '/principal/dashboard',
        teacher: '/teacher/dashboard',
        student: '/student/dashboard',
      }
      
      const redirectPath = redirectPaths[userData.role] || '/admin/dashboard'
      
      // Use router.replace to avoid adding to history
      router.replace(redirectPath)
    } catch (error: any) {
      console.error('❌ Login failed:', error)
      
      // Clear any partial session data on error
      clearSession()
      
      // Re-throw with better error message
      if (error.response) {
        // Axios error
        const message = error.response.data?.detail || error.response.data?.message || 'Login failed'
        throw new Error(message)
      } else if (error.message) {
        // Custom error message
        throw error
      } else {
        throw new Error('Login failed. Please check your credentials and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = useCallback(() => {
    clearSession()
    router.push('/login')
  }, [clearSession, router])

  const refreshSession = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      localStorage.setItem('user', JSON.stringify(currentUser))
      localStorage.setItem('auth_timestamp', Date.now().toString())
    } catch (error: any) {
      console.warn('⚠️ Session refresh failed (will retry later):', error.message)
      // Don't clear session on refresh failure - keep user logged in
      // Only log the error for monitoring
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


