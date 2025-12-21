'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { teacherService } from '@/services/teacherService'
import { classService } from '@/services/classService'
import { gradeService } from '@/services/gradeService'
import { attendanceService } from '@/services/attendanceService'
import { useAuth } from '@/contexts/AuthContext'
import { 
  User, BookOpen, Users, Award, Calendar, Clock, 
  CheckCircle, AlertTriangle, TrendingUp, Target, Bell,
  GraduationCap, BarChart3
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toast'

interface TeacherProfile {
  id: string
  name: string
  employee_id: string
  qualification: string
  subjects: string[]
  join_date: string
  salary: number
  status: string
  phone: string
  address: string
}

interface AssignedClass {
  id: string
  name: string
  section: string
  total_students: number
  subjects: string[]
}

interface TodaySchedule {
  id: string
  time: string
  subject: string
  class: string
  room: string
}

interface PendingTask {
  id: string
  title: string
  type: 'grade' | 'attendance' | 'assignment' | 'meeting'
  due_date: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
}

interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  date: string
  status: string
}

export default function TeacherDashboard() {
  const { user } = useAuth()

  // Fetch teacher profile
  const { data: teacherProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: () => teacherService.getMyProfile(),
    enabled: !!user,
  })

  // Fetch assigned classes
  const { data: classesData = [], isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => teacherService.getMyClasses(),
    enabled: !!user,
  })

  // Fetch recent grades
  const { data: recentGrades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ['teacher-recent-grades'],
    queryFn: () => gradeService.getGrades({ limit: 10 }),
    enabled: !!user,
  })

  // Fetch recent attendance
  const { data: recentAttendance = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ['teacher-recent-attendance'],
    queryFn: () => attendanceService.getAttendance({ limit: 10 }),
    enabled: !!user,
  })

  const isLoading = profileLoading || classesLoading || gradesLoading || attendanceLoading

  // Transform data for display
  const profile = teacherProfile ? {
    id: teacherProfile.id,
    name: teacherProfile.user?.full_name || 'N/A',
    employee_id: teacherProfile.employee_id,
    qualification: teacherProfile.qualification,
    subjects: teacherProfile.subjects || [],
    join_date: teacherProfile.join_date,
    salary: teacherProfile.salary_info?.basic_salary || 0,
    status: teacherProfile.status,
    phone: teacherProfile.user?.phone || 'N/A',
    address: teacherProfile.user?.address || 'N/A'
  } : null

  const assignedClasses: AssignedClass[] = classesData.map((cls: any) => ({
    id: cls.id,
    name: cls.name,
    section: cls.section || '',
    total_students: 0, // Will be fetched separately if needed
    subjects: [] // Will be populated from teacher subjects
  }))

  // Today's schedule - placeholder (would need timetable API)
  const todaySchedule: TodaySchedule[] = []

  // Pending tasks - calculated from data
  const pendingTasks: PendingTask[] = [
    ...recentGrades.filter((g: any) => !g.grade).slice(0, 3).map((g: any, idx: number) => ({
      id: `grade-${idx}`,
      title: `Grade ${g.subject} for ${g.class_id || 'Class'}`,
      type: 'grade' as const,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'high' as const,
      status: 'pending' as const
    }))
  ]

  const recentActivities: RecentActivity[] = [
    ...recentGrades.slice(0, 3).map((g: any, idx: number) => ({
      id: `grade-${idx}`,
      type: 'grade',
      title: 'Grade Submitted',
      description: `${g.subject} grade for student`,
      date: g.created_at || new Date().toISOString(),
      status: 'success'
    })),
    ...recentAttendance.slice(0, 2).map((a: any, idx: number) => ({
      id: `attendance-${idx}`,
      type: 'attendance',
      title: 'Attendance Marked',
      description: `Attendance marked for ${a.date}`,
      date: a.date || a.created_at || new Date().toISOString(),
      status: 'success'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'grade': return <Award className="h-4 w-4 text-green-600" />
      case 'attendance': return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'meeting': return <Users className="h-4 w-4 text-purple-600" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  // Calculate statistics
  const totalStudents = assignedClasses.reduce((sum, cls) => sum + cls.total_students, 0)
  const totalClasses = assignedClasses.length
  const completedTasks = pendingTasks.filter(task => task.status === 'completed').length
  const pendingTasksCount = pendingTasks.filter(task => task.status === 'pending').length

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout allowedRoles={['teacher']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile?.name || user?.full_name || 'Teacher'}! Here's your teaching overview.
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Teacher Profile
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
                  <h4 className="font-medium text-gray-900 mb-2">Teaching Subjects</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile?.subjects.map((subject, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800">
                        {subject}
                      </Badge>
                    ))}
                  </div>
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
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Contact</h4>
                  <p className="text-gray-600">{profile?.phone}</p>
                  <p className="text-gray-600">{profile?.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-blue-600">{totalStudents}</p>
                </div>
                <Users className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned Classes</p>
                  <p className="text-3xl font-bold text-green-600">{totalClasses}</p>
                </div>
                <BookOpen className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                  <p className="text-3xl font-bold text-purple-600">{completedTasks}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingTasksCount}</p>
                </div>
                <AlertTriangle className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaySchedule.length > 0 ? (
                  todaySchedule.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{schedule.subject}</p>
                        <p className="text-sm text-gray-500">{schedule.class} • {schedule.room}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{schedule.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No schedule available for today</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-green-600" />
                Assigned Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignedClasses.length > 0 ? (
                  assignedClasses.map((cls) => (
                    <div key={cls.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900">{cls.name} {cls.section}</h4>
                        <span className="text-lg font-bold text-blue-600">{cls.total_students || 0} students</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile?.subjects && profile.subjects.length > 0 ? (
                          profile.subjects.slice(0, 3).map((subject, index) => (
                            <Badge key={index} className="bg-blue-100 text-blue-800">
                              {subject}
                            </Badge>
                          ))
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">No subjects assigned</Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No classes assigned yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTasks.length > 0 ? (
                pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-500">Due: {formatDate(task.due_date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getTaskPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className={getTaskStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No pending tasks</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No recent activities</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}