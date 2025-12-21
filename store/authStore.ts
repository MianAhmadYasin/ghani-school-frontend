import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  checkAuth: () => Promise<boolean>
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (user, token) => {
        // Store in localStorage for persistence
        localStorage.setItem('access_token', token)
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('auth_timestamp', Date.now().toString())
        
        // Also store in cookie for middleware (30 days)
        const maxAge = 30 * 24 * 60 * 60 // 30 days in seconds
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
        const secure = isHttps ? '; Secure' : ''
        document.cookie = `access_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`
        
        set({ user, token, isAuthenticated: true, isLoading: false })
      },
      clearAuth: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        localStorage.removeItem('auth_timestamp')
        
        // Clear cookie as well (match attributes)
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
        const secure = isHttps ? '; Secure' : ''
        document.cookie = `access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax${secure}`
        
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
      },
      setLoading: (loading) => set({ isLoading: loading }),
      checkAuth: async () => {
        const { token } = get()
        
        if (!token) {
          // Try to restore from localStorage
          const storedToken = localStorage.getItem('access_token')
          const storedUser = localStorage.getItem('user')
          const authTimestamp = localStorage.getItem('auth_timestamp')
          
          if (storedToken && storedUser) {
            // Check if token is not expired (30 days)
            if (authTimestamp) {
              const tokenAge = Date.now() - parseInt(authTimestamp)
              const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
              
              if (tokenAge >= maxAge) {
                get().clearAuth()
                return false
              }
            }
            
            try {
              const user = JSON.parse(storedUser)
              set({ user, token: storedToken, isAuthenticated: true, isLoading: false })
              return true
            } catch (error) {
              console.error('Failed to parse stored user:', error)
              get().clearAuth()
              return false
            }
          }
          return false
        }

        // Token exists in state, just validate age
        const authTimestamp = localStorage.getItem('auth_timestamp')
        if (authTimestamp) {
          const tokenAge = Date.now() - parseInt(authTimestamp)
          const maxAge = 30 * 24 * 60 * 60 * 1000
          
          if (tokenAge >= maxAge) {
            get().clearAuth()
            return false
          }
        }

        // Session is valid
        set({ isAuthenticated: true, isLoading: false })
        return true
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)



