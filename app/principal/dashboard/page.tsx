'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { teacherService } from '@/services/teacherService'
import { studentService } from '@/services/studentService'
import { classService } from '@/services/classService'
import { gradeService } from '@/services/gradeService'
import { attendanceService } from '@/services/attendanceService'
import { financeService } from '@/services/financeService'
import { announcementService } from '@/services/announcementService'
import { eventService } from '@/services/eventService'
import { useAuth } from '@/contexts/AuthContext'
import { 
  User, Users, GraduationCap, BookOpen, TrendingUp, 
  CheckCircle, AlertTriangle, Award, Calendar, Clock,
  BarChart3, Target, Bell, DollarSign, Activity
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toast'

interface PrincipalProfile {
  id: string
  name: string
  employee_id: string
  qualification: string
  join_date: string
  salary: number
  status: string
  phone: string
  address: string
}

interface SchoolStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  averageAttendance: number
  passPercentage: number
  totalRevenue: number
  monthlyExpenses: number
}

interface RecentAnnouncement {
  id: string
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
  created_at: string
  status: 'active' | 'inactive'
}

interface UpcomingEvent {
  id: string
  title: string
  date: string
  time: string
  location: string
  type: string
}

interface PerformanceMetric {
  metric: string
  value: number
  target: number
  trend: 'up' | 'down' | 'stable'
  percentage: number
}

interface PendingApproval {
  id: string
  type: string
  title: string
  submitted_by: string
  submitted_at: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function PrincipalDashboard() {
  const { user } = useAuth()

  // Fetch all data
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentService.getStudents({ limit: 1000 }),
  })

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherService.getTeachers({ limit: 1000 }),
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classService.getClasses({ limit: 1000 }),
  })

  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: () => gradeService.getGrades({ limit: 1000 }),
  })

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => attendanceService.getAttendance({ limit: 1000 }),
  })

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => financeService.getExpenses({}),
  })

  const { data: donations = [] } = useQuery({
    queryKey: ['donations'],
    queryFn: () => financeService.getDonations({}),
  })

  const { data: announcementsData = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementService.getAll({ is_active: true, limit: 5 }),
  })

  const { data: eventsData = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getEvents({ limit: 5 }),
  })

  // Fetch principal profile (teacher with principal role)
  const { data: principalProfile } = useQuery({
    queryKey: ['principal-profile'],
    queryFn: () => teacherService.getMyProfile(),
    enabled: !!user && user.role === 'principal',
  })

  const isLoading = false // All queries handle their own loading

  // Transform data
  const profile = principalProfile ? {
    id: principalProfile.id,
    name: principalProfile.user?.full_name || 'N/A',
    employee_id: principalProfile.employee_id,
    qualification: principalProfile.qualification,
    join_date: principalProfile.join_date,
    salary: principalProfile.salary_info?.basic_salary || 0,
    status: principalProfile.status,
    phone: principalProfile.user?.phone || 'N/A',
    address: principalProfile.user?.address || 'N/A'
  } : null

  // Calculate statistics
  const activeStudents = students.filter((s: any) => s.status === 'active').length
  const activeTeachers = teachers.filter((t: any) => t.status === 'active').length
  const totalClassesCount = classes.length

  // Attendance rate
  const presentCount = attendanceRecords.filter((a: any) => a.status === 'present').length
  const totalAttendance = attendanceRecords.length
  const averageAttendance = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

  // Pass rate
  const passingGrades = grades.filter((g: any) => Number(g.marks) >= 50).length
  const passPercentage = grades.length > 0 ? Math.round((passingGrades / grades.length) * 100) : 0

  // Financial data
  const totalRevenue = donations.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0)
  const monthlyExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)

  const schoolStats: SchoolStats = {
    totalStudents: activeStudents,
    totalTeachers: activeTeachers,
    totalClasses: totalClassesCount,
    averageAttendance,
    passPercentage,
    totalRevenue,
    monthlyExpenses
  }

  const announcements: RecentAnnouncement[] = announcementsData.slice(0, 5).map((a: any) => ({
    id: a.id,
    title: a.title,
    content: a.content || '',
    priority: (a.priority || 'medium') as 'high' | 'medium' | 'low',
    created_at: a.created_at,
    status: (a.status || 'active') as 'active' | 'inactive'
  }))

  const upcomingEvents: UpcomingEvent[] = eventsData.slice(0, 5).map((e: any) => ({
    id: e.id,
    title: e.title,
    date: e.event_date || e.date || '',
    time: e.event_time || e.time || '',
    location: e.location || '',
    type: e.event_type || e.type || ''
  }))

  const performanceMetrics: PerformanceMetric[] = [
    {
      metric: 'Student Enrollment',
      value: activeStudents,
      target: 500,
      trend: activeStudents >= 450 ? 'up' : 'down',
      percentage: (activeStudents / 500) * 100
    },
    {
      metric: 'Teacher Retention',
      value: activeTeachers,
      target: 50,
      trend: activeTeachers >= 45 ? 'up' : 'down',
      percentage: (activeTeachers / 50) * 100
    },
    {
      metric: 'Pass Rate',
      value: passPercentage,
      target: 85,
      trend: passPercentage >= 85 ? 'up' : 'down',
      percentage: (passPercentage / 85) * 100
    },
    {
      metric: 'Attendance Rate',
      value: averageAttendance,
      target: 90,
      trend: averageAttendance >= 90 ? 'up' : 'down',
      percentage: (averageAttendance / 90) * 100
    }
  ]

  // Pending approvals - placeholder (would need approval API)
  const pendingApprovals: PendingApproval[] = []

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
      case 'stable': return <Activity className="h-4 w-4 text-blue-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout allowedRoles={['principal']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Principal Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile?.name || user?.full_name || 'Principal'}! Here&apos;s your school overview.
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Principal Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{profile?.name}</h3>
                  <p className="text-gray-600">Employee ID: {profile?.employee_id}</p>
                  <p className="text-gray-600">Qualification: {profile?.qualification}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                  <p className="text-gray-600">{profile?.phone}</p>
                  <p className="text-gray-600">{profile?.address}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Employment Details</h4>
                  <p className="text-gray-600">Join Date: {formatDate(profile?.join_date || '')}</p>
                  <p className="text-gray-600">Salary: ${profile?.salary?.toLocaleString()}</p>
                  <Badge className="bg-green-100 text-green-800">
                    {profile?.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* School Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-blue-600">{schoolStats?.totalStudents}</p>
                </div>
                <Users className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                  <p className="text-3xl font-bold text-green-600">{schoolStats?.totalTeachers}</p>
                </div>
                <GraduationCap className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-3xl font-bold text-purple-600">{schoolStats?.averageAttendance}%</p>
                </div>
                <CheckCircle className="h-12 w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                  <p className="text-3xl font-bold text-orange-600">{schoolStats?.passPercentage}%</p>
                </div>
                <Award className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{metric.metric}</h4>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-blue-600">{metric.value}</span>
                    <span className="text-sm text-gray-600">Target: {metric.target}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{metric.percentage.toFixed(1)}% of target</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-600" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.length > 0 ? (
                  announcements.map((announcement) => (
                    <div key={announcement.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                        <Badge className={getPriorityColor(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{announcement.content}</p>
                      <p className="text-xs text-gray-500">{formatDate(announcement.created_at)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No announcements available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <div key={event.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">{event.title}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {event.type}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No upcoming events</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{approval.title}</h4>
                      <p className="text-sm text-gray-500">
                        Submitted by: {approval.submitted_by} • {formatDate(approval.submitted_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getApprovalStatusColor(approval.status)}>
                        {approval.status}
                      </Badge>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-green-600">
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No pending approvals</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Total Revenue</h4>
                <p className="text-3xl font-bold text-green-600">
                  ${schoolStats?.totalRevenue?.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Monthly Expenses</h4>
                <p className="text-3xl font-bold text-red-600">
                  ${schoolStats?.monthlyExpenses?.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Net Profit</h4>
                <p className="text-3xl font-bold text-blue-600">
                  ${((schoolStats?.totalRevenue || 0) - (schoolStats?.monthlyExpenses || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}