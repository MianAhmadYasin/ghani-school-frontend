'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { studentService } from '@/services/studentService'
import { teacherService } from '@/services/teacherService'
import { toast } from '@/components/ui/toast'
import { X } from 'lucide-react'

interface AttendanceFormProps {
  onClose: () => void
  onSuccess?: () => void
  initialData?: any
}

type AttendanceFormData = {
  user_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  remarks?: string
}

export function AttendanceForm({ onClose, onSuccess, initialData }: AttendanceFormProps) {
  const queryClient = useQueryClient()
  const [userType, setUserType] = useState<'student' | 'teacher'>('student')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AttendanceFormData>({
    defaultValues: initialData || {
      date: new Date().toISOString().split('T')[0],
      status: 'present',
    },
  })

  // Fetch users based on type
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentService.getStudents({ limit: 1000 }),
    enabled: userType === 'student',
  })

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherService.getTeachers({ limit: 1000 }),
    enabled: userType === 'teacher',
  })

  const createMutation = useMutation({
    mutationFn: (data: AttendanceFormData) => attendanceService.markAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance marked successfully!')
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to mark attendance')
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: AttendanceFormData) =>
      attendanceService.updateAttendance(initialData.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance updated successfully!')
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update attendance')
    }
  })

  const onSubmit = (data: AttendanceFormData) => {
    if (initialData) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const users = userType === 'student' ? students : teachers
  const status = watch('status')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {initialData ? 'Edit Attendance' : 'Mark Attendance'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!initialData && (
            <>
              <div className="space-y-2">
                <Label>User Type</Label>
                <Select
                  value={userType}
                  onValueChange={(value: 'student' | 'teacher') => {
                    setUserType(value)
                    setValue('user_id', '')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_id">
                  {userType === 'student' ? 'Student' : 'Teacher'} *
                </Label>
                <Select
                  value={watch('user_id')}
                  onValueChange={(value) => setValue('user_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${userType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.user?.full_name || user.admission_number || user.employee_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.user_id && (
                  <p className="text-sm text-red-600">{errors.user_id.message}</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              type="date"
              id="date"
              {...register('date', { required: 'Date is required' })}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={watch('status')}
              onValueChange={(value: any) => setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Present
                  </span>
                </SelectItem>
                <SelectItem value="absent">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    Absent
                  </span>
                </SelectItem>
                <SelectItem value="late">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                    Late
                  </span>
                </SelectItem>
                <SelectItem value="excused">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    Excused
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <textarea
              id="remarks"
              {...register('remarks')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add any remarks..."
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : initialData
                ? 'Update Attendance'
                : 'Mark Attendance'}
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






