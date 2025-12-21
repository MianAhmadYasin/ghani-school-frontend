'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teacherService } from '@/services/teacherService'
import { classService } from '@/services/classService'
import { studentService } from '@/services/studentService'
import { attendanceService } from '@/services/attendanceService'
import { 
  Calendar, CheckCircle, XCircle, AlertCircle, Clock, Users,
  Save, Plus
} from 'lucide-react'
import { AttendanceStatus } from '@/types'

export default function TeacherAttendancePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedClassId, setSelectedClassId] = useState<string>(searchParams.get('class_id') || '')
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({})

  // Fetch teacher's classes
  const { data: classes = [] } = useQuery({
    queryKey: ['my-classes'],
    queryFn: () => teacherService.getMyClasses(),
  })

  // Fetch students for selected class
  const { data: students = [] } = useQuery({
    queryKey: ['class-students', selectedClassId],
    queryFn: () => classService.getClassStudents(selectedClassId),
    enabled: !!selectedClassId,
  })

  // Fetch existing attendance
  const { data: existingAttendance = [] } = useQuery({
    queryKey: ['attendance', selectedDate, selectedClassId],
    queryFn: () => attendanceService.getAttendance({
      date_from: selectedDate,
      date_to: selectedDate,
      limit: 1000,
    }),
    enabled: !!selectedDate && !!selectedClassId,
  })

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: (attendances: Array<{
      user_id: string
      date: string
      status: AttendanceStatus
    }>) => attendanceService.markBulkAttendance(attendances),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance marked successfully!')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to mark attendance')
    }
  })

  const handleStatusChange = (userId: string, status: AttendanceStatus) => {
    setAttendanceData(prev => ({ ...prev, [userId]: status }))
  }

  const handleSaveAttendance = () => {
    const attendances = Object.entries(attendanceData).map(([user_id, status]) => ({
      user_id,
      date: selectedDate,
      status,
    }))

    if (attendances.length === 0) {
      toast.error('Please mark attendance for at least one student')
      return
    }

    markAttendanceMutation.mutate(attendances)
  }

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'late': return 'bg-yellow-100 text-yellow-800'
      case 'excused': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout allowedRoles={['teacher']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="text-gray-600 mt-1">Mark attendance for your assigned classes</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="class">Class</Label>
                <Select value={selectedClassId || "all"} onValueChange={(value) => setSelectedClassId(value === "all" ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        {selectedClassId ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Student Attendance</CardTitle>
                <Button 
                  onClick={handleSaveAttendance}
                  disabled={markAttendanceMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Attendance
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No students in this class</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Student</th>
                        <th className="text-center py-3 px-4">Status</th>
                        <th className="text-center py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student: any) => {
                        const existingRecord = existingAttendance.find((a: any) => a.user_id === student.user_id)
                        const currentStatus = attendanceData[student.user_id] || existingRecord?.status || 'present'
                        
                        return (
                          <tr key={student.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium">{student.user?.full_name || 'Unknown'}</div>
                                  <div className="text-sm text-gray-600">{student.admission_number}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={getStatusColor(currentStatus)}>
                                {currentStatus}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant={currentStatus === 'present' ? 'default' : 'outline'}
                                  onClick={() => handleStatusChange(student.user_id, 'present')}
                                  className="h-8"
                                >
                                  Present
                                </Button>
                                <Button
                                  size="sm"
                                  variant={currentStatus === 'absent' ? 'default' : 'outline'}
                                  onClick={() => handleStatusChange(student.user_id, 'absent')}
                                  className="h-8"
                                >
                                  Absent
                                </Button>
                                <Button
                                  size="sm"
                                  variant={currentStatus === 'late' ? 'default' : 'outline'}
                                  onClick={() => handleStatusChange(student.user_id, 'late')}
                                  className="h-8"
                                >
                                  Late
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600 mb-2">Select a Class</p>
              <p className="text-gray-500">Choose a class to mark attendance</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}









