'use client'

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

let toastListeners: Array<(toast: ToastMessage) => void> = []

export const toast = {
  success: (message: string) => {
    const id = Math.random().toString(36).substring(7)
    toastListeners.forEach(listener => listener({ id, type: 'success', message }))
  },
  error: (message: string) => {
    const id = Math.random().toString(36).substring(7)
    toastListeners.forEach(listener => listener({ id, type: 'error', message }))
  },
  info: (message: string) => {
    const id = Math.random().toString(36).substring(7)
    toastListeners.forEach(listener => listener({ id, type: 'info', message }))
  },
  warning: (message: string) => {
    const id = Math.random().toString(36).substring(7)
    toastListeners.forEach(listener => listener({ id, type: 'warning', message }))
  }
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const listener = (toast: ToastMessage) => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 4000)
    }

    toastListeners.push(listener)

    return () => {
      toastListeners = toastListeners.filter(l => l !== listener)
    }
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-md">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in slide-in-from-right ${getToastStyles(toast.type)}`}
        >
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="rounded-full p-1 hover:bg-black/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

