import axios from 'axios'

// Backend API URL - Set NEXT_PUBLIC_API_URL in Vercel environment variables
// Production: https://web-production-91537.up.railway.app/api/v1
// Development: http://localhost:8000/api/v1
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Never auto-clear session or redirect on errors
    // Let the AuthContext handle authentication errors properly
    // This prevents premature session clearing during network issues
    return Promise.reject(error)
  }
)

export default api







