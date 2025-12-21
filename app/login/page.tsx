'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const { login, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      // AuthContext handles the redirect automatically
    } catch (err: any) {
      console.error('Login error:', err)
      
      // User-friendly error messages
      if (err.response) {
        const status = err.response.status
        const data = err.response.data
        // Handle both old format (detail) and new format (message/error)
        const detail = data?.detail || data?.message || (data?.error ? data.message : null)
        
        if (status === 401) {
          setError(detail || 'Invalid email or password. Please check your credentials.')
        } else if (status === 403) {
          setError(detail || 'Your account has been disabled. Please contact administrator.')
        } else if (status === 500) {
          setError(detail || 'Server error. Please try again later.')
        } else if (status === 422) {
          setError(detail || 'Validation error. Please check your input.')
        } else {
          setError(detail || 'Login failed. Please try again.')
        }
      } else if (err.message?.includes('Network') || err.message?.includes('fetch') || err.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please ensure the backend is running at http://localhost:8000')
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            School Management System
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



