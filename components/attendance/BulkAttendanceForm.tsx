'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { attendanceService } from '@/services/attendanceService'
import { classService } from '@/services/classService'
import { studentService } from '@/services/studentService'
import { toast } from '@/components/ui/toast'
import { X, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

interface BulkAttendanceFormProps {
  onClose: () => void
  onSuccess?: () => void
}

type StudentAttendance = {
  user_id: string
  student_name: string
  admission_number: string
  status: 'present' | 'absent' | 'late' | 'excused'
}

export function BulkAttendanceForm({ onClose, onSuccess }: BulkAttendanceFormProps) {
  const queryClient = useQueryClient()
  const [selectedClass, setSelectedClass] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>([])

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classService.getClasses({ limit: 1000 }),
  })

  const { data: students = [] } = useQuery({
    queryKey: ['class-students', selectedClass],
    queryFn: () => studentService.getStudents({ class_id: selectedClass, limit: 1000 }),
    enabled: !!selectedClass,
  })

  // Initialize attendance data when students load
  useEffect(() => {
    if (students.length > 0 && attendanceData.length === 0) {
      const initialData: StudentAttendance[] = students.map((student: any) => ({
        user_id: student.user_id,
        student_name: student.user?.full_name || 'Unknown',
        admission_number: student.admission_number,
        status: 'present' as const,
      }))
      setAttendanceData(initialData)
    }
  }, [students, attendanceData.length])

  const markAllMutation = useMutation({
    mutationFn: async () => {
      const attendances = attendanceData.map((item) => ({
        user_id: item.user_id,
        date,
        status: item.status,
        remarks: '',
      }))
      return attendanceService.markBulkAttendance(attendances)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success(`Bulk attendance marked for ${attendanceData.length} students!`)
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to mark bulk attendance')
    }
  })

  const updateStatus = (user_id: string, status: StudentAttendance['status']) => {
    setAttendanceData((prev) =>
      prev.map((item) =>
        item.user_id === user_id ? { ...item, status } : item
      )
    )
  }

  const setAllStatus = (status: StudentAttendance['status']) => {
    setAttendanceData((prev) => prev.map((item) => ({ ...item, status })))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    markAllMutation.mutate()
  }

  const stats = {
    present: attendanceData.filter((a) => a.status === 'present').length,
    absent: attendanceData.filter((a) => a.status === 'absent').length,
    late: attendanceData.filter((a) => a.status === 'late').length,
    excused: attendanceData.filter((a) => a.status === 'excused').length,
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'excused':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'excused':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Bulk Attendance Marking</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Class and Date Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.section} ({cls.academic_year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Quick Actions */}
          {selectedClass && attendanceData.length > 0 && (
            <div className="rounded-lg border bg-gray-50 p-4">
              <Label className="mb-2 block">Quick Mark All As:</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAllStatus('present')}
                  className="bg-green-50 hover:bg-green-100"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  All Present
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAllStatus('absent')}
                  className="bg-red-50 hover:bg-red-100"
                >
                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                  All Absent
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAllStatus('late')}
                  className="bg-yellow-50 hover:bg-yellow-100"
                >
                  <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                  All Late
                </Button>
              </div>
            </div>
          )}

          {/* Statistics */}
          {attendanceData.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm text-green-600">Present</p>
                <p className="text-2xl font-bold text-green-700">{stats.present}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">Absent</p>
                <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-sm text-yellow-600">Late</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.late}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm text-blue-600">Excused</p>
                <p className="text-2xl font-bold text-blue-700">{stats.excused}</p>
              </div>
            </div>
          )}

          {/* Student List */}
          {selectedClass && attendanceData.length === 0 && (
            <div className="rounded-lg border p-8 text-center">
              <p className="text-gray-600">No students found in this class.</p>
            </div>
          )}

          {attendanceData.length > 0 && (
            <div className="space-y-2">
              <Label>Students ({attendanceData.length})</Label>
              <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border p-4">
                {attendanceData.map((student) => (
                  <div
                    key={student.user_id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${getStatusColor(
                      student.status
                    )}`}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(student.status)}
                      <div>
                        <p className="font-medium">{student.student_name}</p>
                        <p className="text-sm opacity-75">
                          {student.admission_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => updateStatus(student.user_id, 'present')}
                        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                          student.status === 'present'
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-green-600 hover:bg-green-50'
                        }`}
                      >
                        P
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(student.user_id, 'absent')}
                        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                          student.status === 'absent'
                            ? 'bg-red-500 text-white'
                            : 'bg-white text-red-600 hover:bg-red-50'
                        }`}
                      >
                        A
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(student.user_id, 'late')}
                        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                          student.status === 'late'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-white text-yellow-600 hover:bg-yellow-50'
                        }`}
                      >
                        L
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(student.user_id, 'excused')}
                        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                          student.status === 'excused'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        E
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={!selectedClass || attendanceData.length === 0 || markAllMutation.isPending}
            >
              {markAllMutation.isPending
                ? 'Saving...'
                : `Mark Attendance (${attendanceData.length} students)`}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}






