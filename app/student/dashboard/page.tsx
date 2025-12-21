'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { studentService } from '@/services/studentService'
import { gradeService } from '@/services/gradeService'
import { attendanceService } from '@/services/attendanceService'
import { announcementService } from '@/services/announcementService'
import { useAuth } from '@/contexts/AuthContext'
import { 
  User, BookOpen, Award, Calendar, Clock, TrendingUp,
  CheckCircle, AlertTriangle, Star, Target, Bell
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toast'

interface StudentProfile {
  id: string
  name: string
  roll: string
  class: string
  admission_date: string
  guardian_name: string
  guardian_phone: string
  address: string
  status: string
}

interface StudentGrade {
  subject: string
  term: number
  marks: number
  max_marks: number
  grade: string
  status: string
  exam_date: string
}

interface AttendanceRecord {
  date: string
  status: 'present' | 'absent' | 'late'
  subject: string
  teacher: string
}

interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  date: string
  status: string
}

export default function StudentDashboard() {
  const { user } = useAuth()

  // Fetch student profile
  const { data: studentProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => studentService.getMyProfile(),
    enabled: !!user,
  })

  // Fetch grades
  const { data: gradesData = [], isLoading: gradesLoading } = useQuery({
    queryKey: ['student-grades'],
    queryFn: () => gradeService.getGrades({ student_id: studentProfile?.id }),
    enabled: !!studentProfile?.id,
  })

  // Fetch recent attendance
  const { data: attendanceData = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: () => attendanceService.getAttendance({ 
      user_id: studentProfile?.user_id,
      limit: 10 
    }),
    enabled: !!studentProfile?.user_id,
  })

  // Fetch recent announcements
  const { data: announcements = [], isLoading: announcementsLoading } = useQuery({
    queryKey: ['announcements-recent'],
    queryFn: () => announcementService.getAll({ is_active: true, limit: 5 }),
  })

  const isLoading = profileLoading || gradesLoading || attendanceLoading || announcementsLoading

  // Transform data for display
  const profile = studentProfile ? {
    id: studentProfile.id,
    name: studentProfile.user?.full_name || 'N/A',
    roll: studentProfile.admission_number,
    class: studentProfile.class_id || 'N/A',
    admission_date: studentProfile.admission_date,
    guardian_name: studentProfile.guardian_info?.name || 'N/A',
    guardian_phone: studentProfile.guardian_info?.phone || 'N/A',
    address: studentProfile.user?.address || 'N/A',
    status: studentProfile.status
  } : null

  const grades: StudentGrade[] = gradesData.map((g: any) => ({
    subject: g.subject,
    term: g.term === 'Final' || g.term === 'Annual' ? 3 : g.term === 'Second Term' ? 2 : 1,
    marks: Number(g.marks),
    max_marks: 100,
    grade: g.grade,
    status: Number(g.marks) >= 50 ? 'pass' : 'fail',
    exam_date: g.created_at || new Date().toISOString()
  }))

  const attendance: AttendanceRecord[] = attendanceData.slice(0, 10).map((a: any) => ({
    date: a.date,
    status: a.status as 'present' | 'absent' | 'late',
    subject: 'General',
    teacher: 'N/A'
  }))

  const recentActivities: RecentActivity[] = [
    ...grades.slice(0, 3).map((g, idx) => ({
      id: `grade-${idx}`,
      type: 'grade',
      title: 'New Grade Posted',
      description: `${g.subject} Result: ${g.grade} (${g.marks}/100)`,
      date: g.exam_date,
      status: 'success'
    })),
    ...announcements.slice(0, 2).map((a: any) => ({
      id: a.id,
      type: 'announcement',
      title: a.title,
      description: a.content?.substring(0, 50) || '',
      date: a.created_at,
      status: 'info'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-100 text-green-800'
      case 'A': return 'bg-blue-100 text-blue-800'
      case 'B+': return 'bg-yellow-100 text-yellow-800'
      case 'B': return 'bg-orange-100 text-orange-800'
      case 'C': return 'bg-red-100 text-red-800'
      case 'D': return 'bg-gray-100 text-gray-800'
      case 'F': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'late': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'grade': return <Award className="h-4 w-4 text-green-600" />
      case 'attendance': return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'announcement': return <Bell className="h-4 w-4 text-yellow-600" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  // Calculate statistics
  const totalSubjects = grades.length
  const averageMarks = grades.length > 0 ? Math.round(grades.reduce((sum, grade) => sum + grade.marks, 0) / grades.length) : 0
  const attendancePercentage = attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) : 0
  const excellentGrades = grades.filter(grade => {
    const gradeUpper = grade.grade?.toUpperCase() || ''
    return gradeUpper === 'A+' || gradeUpper === 'A'
  }).length

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout allowedRoles={['student']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile?.name}! Here's your academic overview.
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Student Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{profile?.name}</h3>
                  <p className="text-gray-600">Roll Number: {profile?.roll}</p>
                  <p className="text-gray-600">Class: {profile?.class}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Guardian Information</h4>
                  <p className="text-gray-600">{profile?.guardian_name}</p>
                  <p className="text-gray-600">{profile?.guardian_phone}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Admission Details</h4>
                  <p className="text-gray-600">Admission Date: {formatDate(profile?.admission_date || '')}</p>
                  <Badge className="bg-green-100 text-green-800">
                    {profile?.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Address</h4>
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
                  <p className="text-sm font-medium text-gray-600">Average Marks</p>
                  <p className="text-3xl font-bold text-blue-600">{averageMarks}</p>
                </div>
                <TrendingUp className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance</p>
                  <p className="text-3xl font-bold text-green-600">{attendancePercentage}%</p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Excellent Grades</p>
                  <p className="text-3xl font-bold text-purple-600">{excellentGrades}</p>
                </div>
                <Star className="h-12 w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                  <p className="text-3xl font-bold text-orange-600">{totalSubjects}</p>
                </div>
                <BookOpen className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Grades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Recent Grades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {grades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{grade.subject}</p>
                      <p className="text-sm text-gray-500">Term {grade.term} • {formatDate(grade.exam_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{grade.marks}/{grade.max_marks}</p>
                      <Badge className={getGradeColor(grade.grade)}>
                        {grade.grade}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Recent Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attendance.length > 0 ? (
                  attendance.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{record.subject}</p>
                        <p className="text-sm text-gray-500">{record.teacher} • {formatDate(record.date)}</p>
                      </div>
                      <Badge className={getAttendanceColor(record.status)}>
                        {record.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No attendance records available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
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