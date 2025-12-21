'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'
import { AttendanceStatus } from '@/types'

interface AttendanceBadgeProps {
  status: AttendanceStatus | string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function AttendanceBadge({ status, showIcon = true, size = 'md' }: AttendanceBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'present':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          label: 'Present'
        }
      case 'absent':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          label: 'Absent'
        }
      case 'late':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: AlertCircle,
          label: 'Late'
        }
      case 'excused':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Clock,
          label: 'Excused'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock,
          label: status || 'Unknown'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <Badge className={`${config.color} ${sizeClasses[size]} flex items-center gap-1`}>
      {showIcon && <Icon className={`h-${size === 'sm' ? '3' : size === 'md' ? '4' : '5'} w-${size === 'sm' ? '3' : size === 'md' ? '4' : '5'}`} />}
      {config.label}
    </Badge>
  )
}









