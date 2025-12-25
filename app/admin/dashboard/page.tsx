'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, GraduationCap, BookOpen, DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle,
  UserCheck, UserX, Clock, Award, Target, Activity, ArrowUpRight, ArrowDownRight,
  Bell, Settings, BarChart3, RefreshCw
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { studentService } from '@/services/studentService'
import { teacherService } from '@/services/teacherService'
import { classService } from '@/services/classService'
import { gradeService } from '@/services/gradeService'
import { attendanceService } from '@/services/attendanceService'
import { financeService } from '@/services/financeService'
import { announcementService } from '@/services/announcementService'
import { useSettings } from '@/contexts/SettingsContext'
import { Student, Class, Teacher, Grade, Attendance, Expense, Donation, Announcement } from '@/types'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'

export default function AdminDashboard() {
  const { schoolName, currentAcademicYear } = useSettings()
  const queryClient = useQueryClient()

  // Refresh all data
  const handleRefresh = () => {
    queryClient.invalidateQueries()
  }

  // Fetch all data - filter by current academic year if available
  const academicYearFilter = currentAcademicYear?.year_name || new Date().getFullYear().toString()
  
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => studentService.getStudents({ limit: 1000 }),
  })

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['classes', academicYearFilter],
    queryFn: () => classService.getClasses({ 
      academic_year: academicYearFilter,
      limit: 1000 
    }),
  })

  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => teacherService.getTeachers({ limit: 1000 }),
  })

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ['grades', academicYearFilter],
    queryFn: () => gradeService.getGrades({ 
      academic_year: academicYearFilter,
      limit: 1000 
    }),
  })

  const { data: attendanceRecords = [] } = useQuery<Attendance[]>({
    queryKey: ['attendance-recent'],
    queryFn: () => attendanceService.getAttendance({ limit: 1000 }),
  })

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: () => financeService.getExpenses({}),
  })

  const { data: donations = [] } = useQuery<Donation[]>({
    queryKey: ['donations'],
    queryFn: () => financeService.getDonations({}),
  })

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['announcements-active'],
    queryFn: () => announcementService.getAll({ is_active: true, limit: 5 }),
  })

  // Calculate comprehensive statistics
  const activeStudents = students.filter((s: Student) => s.status === 'active').length
  const activeTeachers = teachers.filter((t: Teacher) => t.status === 'active').length
  
  // Today's attendance
  const today = new Date().toISOString().split('T')[0]
  const todayAttendance = attendanceRecords.filter((a: Attendance) => a.date === today)
  const presentToday = todayAttendance.filter((a: Attendance) => a.status === 'present').length
  const absentToday = todayAttendance.filter((a: Attendance) => a.status === 'absent').length
  const lateToday = todayAttendance.filter((a: Attendance) => a.status === 'late').length
  const attendanceRate = todayAttendance.length > 0 
    ? Math.round((presentToday / todayAttendance.length) * 100) 
    : 0

  // This month's attendance
  const currentMonth = new Date().getMonth()
  const monthAttendance = attendanceRecords.filter((a: Attendance) => {
    const recordMonth = new Date(a.date).getMonth()
    return recordMonth === currentMonth
  })
  const monthAttendanceRate = monthAttendance.length > 0
    ? Math.round((monthAttendance.filter((a: Attendance) => a.status === 'present').length / monthAttendance.length) * 100)
    : 0
  
  // Academic performance
  const passingGrades = grades.filter((g: Grade) => Number(g.marks) >= 50).length
  const failingGrades = grades.length - passingGrades
  const averageGrade = grades.length > 0 
    ? (grades.reduce((sum: number, g: Grade) => sum + Number(g.marks), 0) / grades.length).toFixed(1)
    : '0'
  const passRate = grades.length > 0 
    ? Math.round((passingGrades / grades.length) * 100)
    : 0

  // Financial overview
  const totalExpenses = expenses.reduce((sum: number, e: Expense) => sum + Number(e.amount), 0)
  const totalDonations = donations.reduce((sum: number, d: Donation) => sum + Number(d.amount), 0)
  const financialBalance = totalDonations - totalExpenses

  // This month's finances
  const thisMonthExpenses = expenses.filter((e: Expense) => {
    const expenseMonth = new Date(e.date).getMonth()
    return expenseMonth === currentMonth
  }).reduce((sum: number, e: Expense) => sum + Number(e.amount), 0)

  const thisMonthIncome = donations.filter((d: Donation) => {
    const donationMonth = new Date(d.date).getMonth()
    return donationMonth === currentMonth
  }).reduce((sum: number, d: Donation) => sum + Number(d.amount), 0)

  // Main statistics cards
  const mainStats = [
    {
      title: 'Total Students',
      value: students.length,
      subtitle: `${activeStudents} active, ${students.length - activeStudents} inactive`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: '+12%',
      trendUp: true,
      link: '/admin/students'
    },
    {
      title: 'Total Teachers',
      value: teachers.length,
      subtitle: `${activeTeachers} active staff members`,
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: '+5%',
      trendUp: true,
      link: '/admin/teachers'
    },
    {
      title: 'Active Classes',
      value: classes.length,
      subtitle: 'Current academic year',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: '+8%',
      trendUp: true,
      link: '/admin/classes'
    },
    {
      title: 'Today\'s Attendance',
      value: `${attendanceRate}%`,
      subtitle: `${presentToday} present, ${absentToday} absent`,
      icon: Calendar,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      trend: monthAttendanceRate > attendanceRate ? '-2%' : '+2%',
      trendUp: monthAttendanceRate <= attendanceRate,
      link: `/admin/attendance?date=${new Date().toISOString().split('T')[0]}`
    },
  ]

  // Secondary statistics
  const secondaryStats = [
    {
      title: 'Average Grade',
      value: `${averageGrade}%`,
      subtitle: `${passingGrades} passing`,
      icon: Award,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      link: '/admin/grades'
    },
    {
      title: 'Pass Rate',
      value: `${passRate}%`,
      subtitle: `${failingGrades} need support`,
      icon: Target,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      link: '/admin/grades?tab=analytics'
    },
    {
      title: 'Monthly Income',
      value: `$${thisMonthIncome.toLocaleString()}`,
      subtitle: 'This month',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/admin/finance'
    },
    {
      title: 'Monthly Expenses',
      value: `$${thisMonthExpenses.toLocaleString()}`,
      subtitle: 'This month',
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      link: '/admin/finance'
    },
  ]

  // Quick actions
  const quickActions = [
    { label: 'Add Student', icon: Users, link: '/admin/students', color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'Add Teacher', icon: GraduationCap, link: '/admin/teachers', color: 'bg-green-500 hover:bg-green-600' },
    { label: 'Create Class', icon: BookOpen, link: '/admin/classes', color: 'bg-purple-500 hover:bg-purple-600' },
    { label: 'Mark Attendance', icon: CheckCircle, link: '/admin/attendance', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { label: 'Enter Grades', icon: Award, link: '/admin/grades', color: 'bg-indigo-500 hover:bg-indigo-600' },
    { label: 'Finance', icon: DollarSign, link: '/admin/finance', color: 'bg-green-500 hover:bg-green-600' },
    { label: 'Announcements', icon: Bell, link: '/admin/announcements', color: 'bg-pink-500 hover:bg-pink-600' },
    { label: 'Settings', icon: Settings, link: '/admin/settings', color: 'bg-gray-500 hover:bg-gray-600' },
  ]

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{schoolName}</h1>
            <p className="text-gray-600 mt-1">
              Dashboard - {currentAcademicYear?.year_name || 'Current Academic Year'}
              {currentAcademicYear && (
                <span className="text-sm ml-2">
                  ({new Date(currentAcademicYear.start_date).toLocaleDateString()} - {new Date(currentAcademicYear.end_date).toLocaleDateString()})
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleRefresh} title="Refresh Data">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link href="/admin/reports">
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Link key={index} href={stat.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <div className="flex items-baseline gap-2 mt-2">
                          <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                          <span className={`text-sm font-medium flex items-center ${
                            stat.trendUp ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.trendUp ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )}
                            {stat.trend}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                      </div>
                      <div className={`${stat.bgColor} p-3 rounded-lg`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Secondary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {secondaryStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Link key={index} href={stat.link || '#'}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`${stat.bgColor} p-3 rounded-lg`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used actions for quick access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Link key={index} href={action.link}>
                    <Button
                      className={`w-full h-auto flex-col gap-2 py-4 ${action.color} text-white`}
                      variant="default"
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance Overview</CardTitle>
              <CardDescription>Real-time attendance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Present</p>
                      <p className="text-sm text-green-700">{presentToday} students</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {todayAttendance.length > 0 ? Math.round((presentToday / todayAttendance.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserX className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">Absent</p>
                      <p className="text-sm text-red-700">{absentToday} students</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-red-600">
                    {todayAttendance.length > 0 ? Math.round((absentToday / todayAttendance.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-900">Late</p>
                      <p className="text-sm text-yellow-700">{lateToday} students</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">
                    {todayAttendance.length > 0 ? Math.round((lateToday / todayAttendance.length) * 100) : 0}%
                  </span>
                </div>
                <div className="mt-4">
                  <Link href="/admin/attendance">
                    <Button className="w-full">View Full Attendance</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Income and expenses summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Total Income</span>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    ${totalDonations.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    ${thisMonthIncome.toLocaleString()} this month
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-700">Total Expenses</span>
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-600">
                    ${totalExpenses.toLocaleString()}
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    ${thisMonthExpenses.toLocaleString()} this month
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${financialBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${financialBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      Net Balance
                    </span>
                    <Activity className={`h-4 w-4 ${financialBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                  </div>
                  <p className={`text-3xl font-bold ${financialBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    ${Math.abs(financialBalance).toLocaleString()}
                  </p>
                  <p className={`text-xs mt-1 ${financialBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    {financialBalance >= 0 ? 'Surplus' : 'Deficit'}
                  </p>
                </div>
                <div className="mt-4">
                  <Link href="/admin/finance">
                    <Button className="w-full">View Finance Details</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Announcements */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Announcements</CardTitle>
                <CardDescription>Latest updates and notices</CardDescription>
              </div>
              <Link href="/admin/announcements">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.slice(0, 5).map((announcement: Announcement) => (
                  <div key={announcement.id} className="flex items-start gap-3 p-3 border rounded-lg hover:border-blue-500 transition-colors">
                    <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{announcement.title}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="capitalize">{announcement.target_audience}</span>
                        <span>•</span>
                        <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                        <span className={`px-2 py-0.5 rounded-full ${
                          announcement.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          announcement.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {announcement.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No active announcements</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Performance Overview</CardTitle>
            <CardDescription>Student grade distribution and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-green-600">{passingGrades}</p>
                <p className="text-sm text-green-700 mt-1">Passing Students</p>
                <p className="text-xs text-green-600 mt-2">{passRate}% pass rate</p>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-lg">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-red-600">{failingGrades}</p>
                <p className="text-sm text-red-700 mt-1">Need Support</p>
                <p className="text-xs text-red-600 mt-2">{100 - passRate}% need help</p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <Award className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-blue-600">{averageGrade}%</p>
                <p className="text-sm text-blue-700 mt-1">Average Grade</p>
                <p className="text-xs text-blue-600 mt-2">Across all subjects</p>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/admin/grades">
                <Button className="w-full">View All Grades</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}