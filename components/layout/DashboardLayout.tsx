'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from './Sidebar'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface DashboardLayoutProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard
      router.push(`/${user.role}/dashboard`)
    }
  }, [isAuthenticated, user, allowedRoles, router])

  if (!isAuthenticated || !user) {
    return null
  }

  if (!allowedRoles.includes(user.role)) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar role={user.role} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}








