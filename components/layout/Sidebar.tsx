'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Bell,
  Trophy,
  BarChart3,
  Award,
  ClipboardCheck,
  FileCheck,
  Upload,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types'

interface SidebarProps {
  role: UserRole
}

const sidebarLinks = {
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/teachers', label: 'Teachers', icon: GraduationCap },
    { href: '/admin/classes', label: 'Classes', icon: BookOpen },
    { href: '/admin/attendance', label: 'Attendance', icon: Calendar },
    { href: '/admin/grades', label: 'Grades', icon: FileText },
    { href: '/admin/exams', label: 'Exams', icon: ClipboardCheck },
    { href: '/admin/results', label: 'Results', icon: FileCheck },
    { href: '/admin/papers', label: 'Papers', icon: Upload },
    { href: '/admin/grading-schemes', label: 'Grading Schemes', icon: Award },
    { href: '/admin/finance', label: 'Finance', icon: DollarSign },
    { href: '/admin/announcements', label: 'Announcements', icon: Bell },
    { href: '/admin/events', label: 'Events', icon: Calendar },
    { href: '/admin/stationery', label: 'Stationery', icon: BookOpen },
    { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  principal: [
    { href: '/principal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/principal/teachers', label: 'Teachers', icon: GraduationCap },
    { href: '/principal/students', label: 'Students', icon: Users },
    { href: '/admin/exams', label: 'Exams', icon: ClipboardCheck },
    { href: '/admin/results', label: 'Results', icon: FileCheck },
    { href: '/admin/papers', label: 'Papers', icon: Upload },
    { href: '/principal/reports', label: 'Reports', icon: FileText },
    { href: '/principal/finance', label: 'Finance', icon: DollarSign },
  ],
  teacher: [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teacher/classes', label: 'My Classes', icon: BookOpen },
    { href: '/teacher/attendance', label: 'Attendance', icon: Calendar },
    { href: '/teacher/grades', label: 'Grades', icon: FileText },
    { href: '/teacher/exams', label: 'Exams', icon: ClipboardCheck },
    { href: '/teacher/results', label: 'Results', icon: FileCheck },
    { href: '/teacher/profile', label: 'Profile', icon: Settings },
  ],
  student: [
    { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/grades', label: 'My Grades', icon: FileText },
    { href: '/student/attendance', label: 'Attendance', icon: Calendar },
    { href: '/student/stationery', label: 'Stationery', icon: BookOpen },
    { href: '/student/profile', label: 'Profile', icon: Settings }
  ],
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const links = sidebarLinks[role] || []

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">SMS</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-gray-800 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800">
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user?.full_name}</p>
            <p className="truncate text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )
}




