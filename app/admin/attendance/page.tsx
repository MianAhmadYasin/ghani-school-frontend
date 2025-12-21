'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import {
  Calendar, Users, Clock, Upload, Download, Settings, Calculator, 
  CheckCircle, XCircle, AlertCircle, Plus, Edit2, Trash2, Eye,
  FileSpreadsheet, DollarSign, TrendingUp, TrendingDown, Save, X,
  FileText, BarChart3
} from 'lucide-react'
import { attendanceService } from '@/services/attendanceService'
import { teacherService } from '@/services/teacherService'
import { studentService } from '@/services/studentService'
import { classService } from '@/services/classService'
import { AttendanceStatus } from '@/types'

type TabId = 'teachers' | 'students' | 'bulk' | 'reports' | 'settings'

export default function AttendancePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabId>('teachers')
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0])
  const [selectedClass, setSelectedClass] = useState<string>(searchParams.get('class_id') || '')
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [showCSVUpload, setShowCSVUpload] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState<any>(null)

  // Fetch data
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherService.getTeachers({ limit: 1000 }),
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classService.getClasses({ limit: 1000 }),
  })

  const { data: students = [] } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: () => studentService.getStudents({ 
      class_id: selectedClass || undefined,
      limit: 1000 
    }),
    enabled: !!selectedClass
  })

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: () => attendanceService.getAttendance({ 
      date_from: selectedDate, 
      date_to: selectedDate,
      limit: 1000 
      }),
  })

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: (data: {
      user_id: string
      date: string
      status: AttendanceStatus
      remarks?: string
    }) => {
      // Validate date is not in the future
      const attendanceDate = new Date(data.date)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      
      if (attendanceDate > today) {
        throw new Error('Attendance date cannot be in the future')
      }
      
      return attendanceService.markAttendance(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance marked successfully!')
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Failed to mark attendance'
      toast.error(errorMessage)
      console.error('Attendance marking error:', error)
    }
  })

  // Bulk attendance mutation
  const bulkAttendanceMutation = useMutation({
    mutationFn: (attendances: Array<{
      user_id: string
      date: string
      status: AttendanceStatus
      remarks?: string
    }>) => {
      // Validate all dates are not in the future
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      
      for (const att of attendances) {
        const attendanceDate = new Date(att.date)
        if (attendanceDate > today) {
          throw new Error(`Attendance date ${att.date} cannot be in the future`)
        }
      }
      
      return attendanceService.markBulkAttendance(attendances)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      
      // Show detailed success message if there were errors
      if (result.errors && result.errors.length > 0) {
        toast.success(
          `Bulk attendance completed: ${result.success_count}/${result.total_count} successful. Some records had errors.`
        )
      } else {
        toast.success('Bulk attendance marked successfully!')
      }
      
      setShowBulkForm(false)
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Failed to mark bulk attendance'
      toast.error(errorMessage)
      console.error('Bulk attendance error:', error)
    }
  })

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: AttendanceStatus; remarks?: string } }) =>
      attendanceService.updateAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance updated successfully!')
      setEditingAttendance(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update attendance')
    }
  })

  const tabs = [
    { id: 'teachers' as TabId, name: 'Teachers Attendance', icon: Users },
    { id: 'students' as TabId, name: 'Students Attendance', icon: Calendar },
    { id: 'bulk' as TabId, name: 'Bulk Attendance', icon: Plus },
    { id: 'reports' as TabId, name: 'Reports', icon: TrendingUp },
    { id: 'settings' as TabId, name: 'Settings', icon: Settings },
  ]

  const handleMarkAttendance = (userId: string, status: AttendanceStatus) => {
    markAttendanceMutation.mutate({
      user_id: userId,
      date: selectedDate,
      status: status
    })
  }

  const handleUpdateAttendance = (id: string, status: AttendanceStatus, remarks?: string) => {
    updateAttendanceMutation.mutate({
      id,
      data: { status, remarks }
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'late':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'excused':
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'late':
        return 'bg-yellow-100 text-yellow-800'
      case 'excused':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAttendanceForUser = (userId: string) => {
    return attendanceRecords.find(record => record.user_id === userId)
  }

  return (
    <DashboardLayout allowedRoles={['admin', 'principal', 'teacher']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600 mt-1">Manage teacher and student attendance</p>
          </div>
          <div className="flex gap-3">
            {selectedClass && (
              <Button 
                variant="outline"
                onClick={() => router.push(`/admin/reports?type=attendance&class_id=${selectedClass}&date_from=${selectedDate}`)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Class Report
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowCSVUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
            <Button onClick={() => setShowBulkForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Bulk Attendance
            </Button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex gap-4 items-center">
          <div>
            <Label htmlFor="date">Select Date</Label>
            <Input
              type="date"
              id="date"
              value={selectedDate}
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
              onChange={(e) => {
                const dateValue = e.target.value
                const selected = new Date(dateValue)
                const today = new Date()
                today.setHours(23, 59, 59, 999)
                
                if (selected > today) {
                  toast.error('Cannot select a future date')
                  return
                }
                
                setSelectedDate(dateValue)
              }}
              className="w-40"
            />
          </div>
          {activeTab === 'students' && (
            <div>
              <Label htmlFor="class">Select Class</Label>
              <select
                id="class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a class</option>
                {classes.map((classItem: any) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name} - {classItem.section}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Teachers Attendance Tab */}
          {activeTab === 'teachers' && (
          <Card>
              <CardHeader>
                <CardTitle>Teachers Attendance - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
                <CardDescription>Mark attendance for all teachers</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Teacher</th>
                        <th className="text-left py-3 px-4">Employee ID</th>
                        <th className="text-center py-3 px-4">Status</th>
                        <th className="text-center py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((teacher: any) => {
                        const attendance = getAttendanceForUser(teacher.user_id)
                        return (
                          <tr key={teacher.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium">{teacher.user?.full_name || 'Unknown'}</div>
                                  <div className="text-sm text-gray-600">{teacher.subjects?.join(', ') || 'No subjects'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">{teacher.employee_id}</td>
                            <td className="py-3 px-4 text-center">
                              {attendance ? (
                                <div className="flex items-center justify-center gap-2">
                                  {getStatusIcon(attendance.status)}
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(attendance.status)}`}>
                                    {attendance.status}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">Not marked</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center gap-2">
                                {attendance ? (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => setEditingAttendance(attendance)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleMarkAttendance(teacher.user_id, 'present')}
                                      disabled={markAttendanceMutation.isPending}
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleMarkAttendance(teacher.user_id, 'absent')}
                                      disabled={markAttendanceMutation.isPending}
                                    >
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                ) : (
                                  <div className="flex gap-1">
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleMarkAttendance(teacher.user_id, 'present')}
                                      disabled={markAttendanceMutation.isPending}
                                    >
                                      Present
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleMarkAttendance(teacher.user_id, 'absent')}
                                      disabled={markAttendanceMutation.isPending}
                                    >
                                      Absent
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleMarkAttendance(teacher.user_id, 'late')}
                                      disabled={markAttendanceMutation.isPending}
                                    >
                                      Late
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
            </CardContent>
          </Card>
          )}

          {/* Students Attendance Tab */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              {!selectedClass ? (
          <Card>
                  <CardHeader>
                    <CardTitle>Select a Class</CardTitle>
                    <CardDescription>Choose a class to mark student attendance</CardDescription>
            </CardHeader>
            <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {classes.map((classItem: any) => (
                        <div 
                          key={classItem.id} 
                          className="p-4 border rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
                          onClick={() => setSelectedClass(classItem.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{classItem.name} - {classItem.section}</h4>
                              <p className="text-sm text-gray-600">{classItem.academic_year}</p>
                              <p className="text-xs text-gray-500">
                                Teacher: {classItem.teacher?.user?.full_name || 'Not assigned'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Students Attendance</CardTitle>
                        <CardDescription>
                          {classes.find(c => c.id === selectedClass)?.name} - {classes.find(c => c.id === selectedClass)?.section}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => router.push(`/admin/reports?type=attendance&class_id=${selectedClass}&date_from=${selectedDate}`)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Class Report
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedClass('')}>
                          <X className="h-4 w-4 mr-2" />
                          Back to Classes
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Student</th>
                            <th className="text-left py-3 px-4">Admission Number</th>
                            <th className="text-center py-3 px-4">Status</th>
                            <th className="text-center py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student: any) => {
                            const attendance = getAttendanceForUser(student.user_id)
                            return (
                              <tr key={student.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                      <Users className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                      <div 
                                        className="font-medium cursor-pointer hover:text-blue-600 hover:underline"
                                        onClick={() => router.push(`/admin/students?student_id=${student.id}`)}
                                        title="View Student Details"
                                      >
                                        {student.user?.full_name || 'Unknown'}
                                      </div>
                                      <div className="text-sm text-gray-600">{student.guardian_info?.name || 'No guardian'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">{student.admission_number}</td>
                                <td className="py-3 px-4 text-center">
                                  {attendance ? (
                                    <div className="flex items-center justify-center gap-2">
                                      {getStatusIcon(attendance.status)}
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(attendance.status)}`}>
                                        {attendance.status}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">Not marked</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex justify-center gap-1">
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => router.push(`/admin/students?student_id=${student.id}`)}
                                      title="View Student Profile"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => router.push(`/admin/grades?student_id=${student.id}`)}
                                      title="View Grades"
                                      className="h-8 w-8 p-0"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                    {attendance ? (
                                      <>
                                        <Button 
                                          size="sm" 
                                          variant="ghost"
                                          onClick={() => setEditingAttendance(attendance)}
                                          title="Edit Attendance"
                                          className="h-8 w-8 p-0"
                                        >
                                          <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="ghost"
                                          onClick={() => handleMarkAttendance(student.user_id, 'present')}
                                          disabled={markAttendanceMutation.isPending}
                                          title="Mark Present"
                                          className="h-8 w-8 p-0"
                                        >
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="ghost"
                                          onClick={() => handleMarkAttendance(student.user_id, 'absent')}
                                          disabled={markAttendanceMutation.isPending}
                                          title="Mark Absent"
                                          className="h-8 w-8 p-0"
                                        >
                                          <XCircle className="h-4 w-4 text-red-600" />
                                        </Button>
                                      </>
                                    ) : (
                                      <div className="flex gap-1">
                                        <Button 
                                          size="sm" 
                                          onClick={() => handleMarkAttendance(student.user_id, 'present')}
                                          disabled={markAttendanceMutation.isPending}
                                        >
                                          Present
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => handleMarkAttendance(student.user_id, 'absent')}
                                          disabled={markAttendanceMutation.isPending}
                                        >
                                          Absent
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => handleMarkAttendance(student.user_id, 'late')}
                                          disabled={markAttendanceMutation.isPending}
                                        >
                                          Late
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
            </CardContent>
          </Card>
              )}
            </div>
          )}

          {/* Bulk Attendance Tab */}
          {activeTab === 'bulk' && (
          <Card>
              <CardHeader>
                <CardTitle>Bulk Attendance</CardTitle>
                <CardDescription>Mark attendance for multiple users at once</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Plus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Bulk attendance functionality coming soon...</p>
                  <Button className="mt-4" onClick={() => setShowBulkForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start Bulk Attendance
                  </Button>
                </div>
            </CardContent>
          </Card>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
          <Card>
              <CardHeader>
                <CardTitle>Attendance Reports</CardTitle>
                <CardDescription>View attendance statistics and reports</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto p-6 flex flex-col items-start"
                      onClick={() => router.push('/admin/reports?type=attendance')}
                    >
                      <BarChart3 className="h-8 w-8 mb-2 text-blue-600" />
                      <span className="font-semibold">View All Attendance Reports</span>
                      <span className="text-sm text-gray-600 mt-1">Comprehensive attendance analytics</span>
                    </Button>
                    {selectedClass && (
                      <Button 
                        variant="outline" 
                        className="h-auto p-6 flex flex-col items-start"
                        onClick={() => router.push(`/admin/reports?type=attendance&class_id=${selectedClass}`)}
                      >
                        <Calendar className="h-8 w-8 mb-2 text-purple-600" />
                        <span className="font-semibold">Class Attendance Report</span>
                        <span className="text-sm text-gray-600 mt-1">View attendance for selected class</span>
                      </Button>
                    )}
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-4">Quick Report Links:</p>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => router.push('/admin/reports?type=attendance')}
                      >
                        Overall Attendance
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/reports?type=attendance&date_from=${selectedDate}`)}
                      >
                        Today's Report
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const today = new Date()
                          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
                          router.push(`/admin/reports?type=attendance&date_from=${monthStart}`)
                        }}
                      >
                        This Month
                      </Button>
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
          <Card>
              <CardHeader>
                <CardTitle>Attendance Settings</CardTitle>
                <CardDescription>Configure attendance rules and settings</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Settings configuration coming soon...</p>
                </div>
            </CardContent>
          </Card>
          )}
        </div>

        {/* Edit Attendance Modal */}
        {editingAttendance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Edit Attendance</h2>
                <button
                  onClick={() => setEditingAttendance(null)}
                  className="rounded-full p-1 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
              <select
                    id="status"
                    value={editingAttendance.status}
                    onChange={(e) => setEditingAttendance({...editingAttendance, status: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
              </div>
                      <div>
                  <Label htmlFor="remarks">Remarks</Label>
                  <Input
                    id="remarks"
                    value={editingAttendance.remarks || ''}
                    onChange={(e) => setEditingAttendance({...editingAttendance, remarks: e.target.value})}
                    placeholder="Optional remarks"
                  />
                    </div>
                    <div className="flex gap-2">
                      <Button
                    onClick={() => handleUpdateAttendance(editingAttendance.id, editingAttendance.status, editingAttendance.remarks)}
                    disabled={updateAttendanceMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateAttendanceMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                  <Button variant="outline" onClick={() => setEditingAttendance(null)}>
                    Cancel
                      </Button>
                    </div>
                  </div>
            </div>
              </div>
            )}

        {/* CSV Upload Modal */}
        {showCSVUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Upload CSV</h2>
                <button
                  onClick={() => setShowCSVUpload(false)}
                  className="rounded-full p-1 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
      </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <Input
                    type="file"
                    id="csv-file"
                    accept=".csv,.xlsx"
                    className="mt-1"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Expected format:</strong></p>
                  <p>• Name: Teacher/Student name</p>
                  <p>• Date: Attendance date</p>
                  <p>• Status: Present/Absent/Late</p>
                </div>
                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}