"use client"

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function SessionManager() {
  const { isAuthenticated } = useAuth()

  // Simple heartbeat: Update activity timestamp
  useEffect(() => {
    if (!isAuthenticated) return

    // Update activity timestamp every 5 minutes
    const heartbeat = setInterval(() => {
      // Just update the timestamp to keep session fresh
      localStorage.setItem('auth_timestamp', Date.now().toString())
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(heartbeat)
  }, [isAuthenticated])

  // This component doesn't render anything visible
  return null
}

