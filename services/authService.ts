import api from '@/lib/api'
import { LoginResponse, User } from '@/types'

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      })
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response from server')
      }
      
      if (!response.data.access_token) {
        throw new Error('No access token received from server')
      }
      
      if (!response.data.user || typeof response.data.user !== 'object') {
        throw new Error('No user data received from server')
      }
      
      return response.data
    } catch (error: any) {
      // Enhance error message for better debugging
      if (error.response) {
        const data = error.response.data
        // Handle both old format (detail) and new format (message/error)
        const detail = data?.detail || data?.message || (data?.error ? data.message : null)
        if (detail) {
          error.message = detail
        } else if (data?.error && typeof data === 'object') {
          // Our custom error format
          error.message = data.message || 'An error occurred'
        }
      }
      throw error
    }
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    })
  },
}












