"use client"

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  console.log('🛡️ AuthGate check:', { pathname, isLoading, isAuthenticated, hasUser: !!user })

  // Protected routes that require authentication
  const protectedPrefixes = ['/admin', '/teacher', '/student', '/principal']
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix))

  // Public routes that anyone can access
  const publicRoutes = ['/login', '/', '/debug']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Show loading spinner while checking auth (only on initial load)
  if (isLoading) {
    console.log('⏳ AuthGate: Loading session...')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your session...</p>
        </div>
      </div>
    )
  }

  // Redirect to login ONLY if accessing protected route without auth
  if (isProtectedRoute && !isAuthenticated && !isLoading) {
    console.log('⚠️ Protected route without auth - redirecting to login')
    router.push('/login')
    return null
  }

  // Redirect to dashboard if accessing login while authenticated
  if (pathname === '/login' && isAuthenticated && user) {
    const dashboardPaths: Record<string, string> = {
      admin: '/admin/dashboard',
      principal: '/principal/dashboard',
      teacher: '/teacher/dashboard',
      student: '/student/dashboard',
    }
    const redirectPath = dashboardPaths[user.role] || '/admin/dashboard'
    console.log('✅ Already authenticated - redirecting to:', redirectPath)
    router.push(redirectPath)
    return null
  }

  console.log('✅ AuthGate: Rendering page')
  return <>{children}</>
}


