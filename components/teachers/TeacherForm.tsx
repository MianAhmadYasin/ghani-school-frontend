'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { teacherService } from '@/services/teacherService'
import { useAuth } from '@/contexts/AuthContext'
import { Teacher, SalaryInfo } from '@/types'
import { Loader2, X, Plus, Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/toast'

const teacherSchema = z.object({
  employee_id: z.string()
    .min(1, 'Employee ID is required')
    .regex(/^[A-Z0-9]+$/, 'Employee ID should contain only uppercase letters and numbers'),
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name should contain only letters and spaces'),
  email: z.string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters'),
  phone: z.string()
    .regex(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number')
    .optional(),
  address: z.string()
    .max(200, 'Address must be less than 200 characters')
    .optional(),
  join_date: z.string().min(1, 'Join date is required'),
  qualification: z.string()
    .min(2, 'Qualification must be at least 2 characters')
    .max(100, 'Qualification must be less than 100 characters'),
  subjects: z.array(z.string()).min(1, 'At least one subject is required'),
  basic_salary: z.number()
    .min(0, 'Basic salary must be positive')
    .max(1000000, 'Basic salary seems too high'),
  allowances: z.number()
    .min(0, 'Allowances must be positive')
    .max(500000, 'Allowances seem too high')
    .optional(),
  currency: z.string().min(1, 'Currency is required'),
  status: z.enum(['active', 'inactive', 'terminated', 'retired']),
})

type TeacherFormData = z.infer<typeof teacherSchema>

interface TeacherFormProps {
  teacher?: Teacher
  onClose: () => void
  onSuccess: () => void
}

const SUBJECT_OPTIONS = [
  'Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology',
  'History', 'Geography', 'Computer Science', 'Art', 'Music', 'Physical Education',
  'Social Studies', 'Islamic Studies', 'Urdu', 'Arabic', 'French', 'Spanish',
  'Economics', 'Business Studies', 'Accounting', 'Psychology', 'Sociology'
]

const CURRENCY_OPTIONS = ['PKR', 'USD', 'EUR', 'GBP']

export function TeacherForm({ teacher, onClose, onSuccess }: TeacherFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const { user } = useAuth()
  
  const isEdit = !!teacher

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      employee_id: teacher?.employee_id || '',
      full_name: teacher?.user?.full_name || '',
      email: teacher?.user?.email || '',
      phone: teacher?.user?.phone || '',
      address: teacher?.user?.address || '',
      join_date: teacher?.join_date ? teacher.join_date.split('T')[0] : '',
      qualification: teacher?.qualification || '',
      subjects: teacher?.subjects || [],
      basic_salary: teacher?.salary_info?.basic_salary || 0,
      allowances: teacher?.salary_info?.allowances || 0,
      currency: teacher?.salary_info?.currency || 'PKR',
      status: (teacher?.status as any) || 'active',
    }
  })

  const watchedSubjects = watch('subjects')

  const addSubject = () => {
    if (newSubject.trim() && !watchedSubjects.includes(newSubject.trim())) {
      setValue('subjects', [...watchedSubjects, newSubject.trim()])
      setNewSubject('')
    }
  }

  const removeSubject = (subjectToRemove: string) => {
    setValue('subjects', watchedSubjects.filter(subject => subject !== subjectToRemove))
  }

  const onSubmit = async (data: TeacherFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
      const salaryInfo: SalaryInfo = {
        basic_salary: data.basic_salary,
        allowances: data.allowances || 0,
        currency: data.currency,
      }

      if (isEdit && teacher) {
        // For updates, send only the fields that can be updated
        const updateData = {
          full_name: data.full_name,
          phone: data.phone,
          address: data.address,
          qualification: data.qualification,
          subjects: data.subjects,
          salary_info: salaryInfo,
          status: data.status,
        }
        await teacherService.updateTeacher(teacher.id, updateData)
      } else {
        // For creation, send data in the format backend expects
        const createData = {
          // User info
          email: data.email,
          password: `${data.employee_id}@123`, // Auto-generate password
          full_name: data.full_name,
          phone: data.phone || undefined,
          address: data.address || undefined,
          // Teacher specific
          employee_id: data.employee_id,
          join_date: data.join_date,
          qualification: data.qualification,
          subjects: data.subjects,
          salary_info: salaryInfo,
        }
        await teacherService.createTeacher(createData)
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Failed to save teacher:', error)
      
      // Handle different error formats
      let errorMessage = 'Failed to save teacher'
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => 
            typeof err === 'string' ? err : err.msg || JSON.stringify(err)
          ).join(', ')
        } else if (typeof error.response.data.detail === 'object') {
          errorMessage = error.response.data.detail.message || JSON.stringify(error.response.data.detail)
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{isEdit ? 'Edit Teacher' : 'Add New Teacher'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Professional Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">👨‍🏫</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-green-900">Teacher Registration</h4>
                  <p className="text-sm text-green-700">Complete all required fields to register a new teacher</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-green-600">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Personal Info</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Academic Info</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Subjects</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Salary Info</span>
                </div>
              </div>
            </div>

            {/* Teacher Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Teacher Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee ID *</Label>
                  <Input
                    id="employee_id"
                    {...register('employee_id')}
                    placeholder="Enter employee ID"
                  />
                  {errors.employee_id && (
                    <p className="text-sm text-red-600">{errors.employee_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    {...register('full_name')}
                    placeholder="Enter full name"
                  />
                  {errors.full_name && (
                    <p className="text-sm text-red-600">{errors.full_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="join_date">Join Date *</Label>
                  <Input
                    id="join_date"
                    type="date"
                    {...register('join_date')}
                  />
                  {errors.join_date && (
                    <p className="text-sm text-red-600">{errors.join_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification *</Label>
                  <Input
                    id="qualification"
                    {...register('qualification')}
                    placeholder="e.g., BSc, MSc, PhD"
                  />
                  {errors.qualification && (
                    <p className="text-sm text-red-600">{errors.qualification.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={watch('status') || 'active'}
                    onValueChange={(value) => setValue('status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-red-600">{errors.status.message}</p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            {/* Subjects */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Subjects</h3>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Select
                    value={newSubject || 'placeholder'}
                    onValueChange={(value) => setNewSubject(value === 'placeholder' ? '' : value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select or type a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled>Select a subject</SelectItem>
                      {SUBJECT_OPTIONS.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addSubject}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Selected Subjects *</Label>
                  {watchedSubjects.length === 0 ? (
                    <p className="text-sm text-gray-500">No subjects selected</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {watchedSubjects.map((subject) => (
                        <span
                          key={subject}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800"
                        >
                          {subject}
                          <button
                            type="button"
                            onClick={() => removeSubject(subject)}
                            className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {errors.subjects && (
                    <p className="text-sm text-red-600">{errors.subjects.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Salary Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Salary Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basic_salary">Basic Salary *</Label>
                  <Input
                    id="basic_salary"
                    type="number"
                    step="0.01"
                    {...register('basic_salary', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.basic_salary && (
                    <p className="text-sm text-red-600">{errors.basic_salary.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowances">Allowances</Label>
                  <Input
                    id="allowances"
                    type="number"
                    step="0.01"
                    {...register('allowances', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.allowances && (
                    <p className="text-sm text-red-600">{errors.allowances.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Select
                    value={watch('currency') || 'PKR'}
                    onValueChange={(value) => setValue('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.currency && (
                    <p className="text-sm text-red-600">{errors.currency.message}</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Total Monthly Salary</h4>
                <p className="text-2xl font-bold text-green-600">
                  {watch('currency')} {(watch('basic_salary') || 0) + (watch('allowances') || 0)}
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update Teacher' : 'Create Teacher'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

