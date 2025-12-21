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
import { studentService } from '@/services/studentService'
import { classService } from '@/services/classService'
import { useAuth } from '@/contexts/AuthContext'
import { Student, Class, GuardianInfo } from '@/types'
import { Loader2, X } from 'lucide-react'
import { toast } from '@/components/ui/toast'

const studentSchema = z.object({
  admission_number: z.string()
    .min(1, 'Admission number is required')
    .regex(/^[A-Z0-9]+$/, 'Admission number should contain only uppercase letters and numbers'),
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name should contain only letters and spaces'),
  email: z.string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters'),
  password: z.string().optional(),
  phone: z.string()
    .regex(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number')
    .optional(),
  address: z.string()
    .max(200, 'Address must be less than 200 characters')
    .optional(),
  admission_date: z.string().min(1, 'Admission date is required'),
  class_id: z.string().optional(),
  guardian_name: z.string()
    .min(2, 'Guardian name must be at least 2 characters')
    .max(100, 'Guardian name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Guardian name should contain only letters and spaces'),
  guardian_relation: z.string().refine(val => val && val !== 'placeholder' && val !== '', 'Please select guardian relation'),
  guardian_phone: z.string()
    .min(10, 'Guardian phone must be at least 10 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number'),
  guardian_email: z.string()
    .email('Please enter a valid guardian email')
    .optional()
    .or(z.literal('')),
  guardian_address: z.string()
    .max(200, 'Guardian address must be less than 200 characters')
    .optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'transferred']),
})

type StudentFormData = z.infer<typeof studentSchema>

interface StudentFormProps {
  student?: Student
  onClose: () => void
  onSuccess: () => void
}

export function StudentForm({ student, onClose, onSuccess }: StudentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const { user } = useAuth()
  
  const isEdit = !!student

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      admission_number: student?.admission_number || '',
      full_name: student?.user?.full_name || '',
      email: student?.user?.email || '',
      password: '', // Will be auto-generated for new students
      phone: student?.user?.phone || '',
      address: student?.user?.address || '',
      admission_date: student?.admission_date ? student.admission_date.split('T')[0] : '',
      class_id: student?.class_id || '',
      guardian_name: student?.guardian_info?.name || '',
      guardian_relation: student?.guardian_info?.relation || '',
      guardian_phone: student?.guardian_info?.phone || '',
      guardian_email: student?.guardian_info?.email || '',
      guardian_address: student?.guardian_info?.address || '',
      status: (student?.status as any) || 'active',
    }
  })

  // Load classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classesData = await classService.getClasses({ limit: 1000 })
        setClasses(classesData)
      } catch (error) {
        console.error('Failed to load classes:', error)
      }
    }
    loadClasses()
  }, [])

  const onSubmit = async (data: StudentFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
      const guardianInfo: GuardianInfo = {
        name: data.guardian_name,
        relation: data.guardian_relation,
        phone: data.guardian_phone,
        email: data.guardian_email || undefined,
        address: data.guardian_address || undefined,
      }

      // Auto-generate password if not provided for new students
      const password = isEdit ? undefined : (data.password || `${data.admission_number}@123`)

      if (isEdit && student) {
        // For updates, send only the fields that can be updated
        const updateData = {
          full_name: data.full_name,
          phone: data.phone,
          address: data.address,
          class_id: data.class_id || null,
          guardian_info: guardianInfo,
          status: data.status,
        }
        await studentService.updateStudent(student.id, updateData)
      } else {
        // For creation, send data in the format backend expects
        const createData: any = {
          // User info
          email: data.email,
          password: password || `${data.admission_number}@123`,
          full_name: data.full_name,
          phone: data.phone || undefined,
          address: data.address || undefined,
          // Student specific
          admission_number: data.admission_number,
          admission_date: data.admission_date,
          class_id: data.class_id || undefined,
          guardian_info: guardianInfo,
        }
        await studentService.createStudent(createData)
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Failed to save student:', error)
      
      // Handle different error formats
      let errorMessage = 'Failed to save student'
      
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
      <Card className="w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{isEdit ? 'Edit Student' : 'Add New Student'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Professional Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">📚</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-blue-900">Student Registration</h4>
                  <p className="text-sm text-blue-700">Complete all required fields to register a new student</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-600">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Personal Info</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Contact Details</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Academic Info</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Guardian Details</span>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Student Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admission_number">Admission Number *</Label>
                  <Input
                    id="admission_number"
                    {...register('admission_number')}
                    placeholder="Enter admission number"
                    className={errors.admission_number ? 'border-red-500' : ''}
                  />
                  {errors.admission_number && (
                    <p className="text-sm text-red-600">{errors.admission_number.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    {...register('full_name')}
                    placeholder="Enter full name"
                    className={errors.full_name ? 'border-red-500' : ''}
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
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {!isEdit && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register('password')}
                      placeholder="Enter password (or leave blank for auto-generated)"
                    />
                    <p className="text-xs text-gray-500">
                      Leave blank to auto-generate: {watch('admission_number')}@123
                    </p>
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admission_date">Admission Date *</Label>
                  <Input
                    id="admission_date"
                    type="date"
                    {...register('admission_date')}
                  />
                  {errors.admission_date && (
                    <p className="text-sm text-red-600">{errors.admission_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class_id">Class</Label>
                  <Select
                    value={watch('class_id') || 'none'}
                    onValueChange={(value) => setValue('class_id', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No class assigned</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} - {cls.section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="graduated">Graduated</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
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

            {/* Guardian Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Guardian Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guardian_name">Guardian Name *</Label>
                  <Input
                    id="guardian_name"
                    {...register('guardian_name')}
                    placeholder="Enter guardian name"
                  />
                  {errors.guardian_name && (
                    <p className="text-sm text-red-600">{errors.guardian_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardian_relation">Relation *</Label>
                  <Select
                    value={watch('guardian_relation') || 'placeholder'}
                    onValueChange={(value) => setValue('guardian_relation', value === 'placeholder' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled>Select relation</SelectItem>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="brother">Brother</SelectItem>
                      <SelectItem value="sister">Sister</SelectItem>
                      <SelectItem value="uncle">Uncle</SelectItem>
                      <SelectItem value="aunt">Aunt</SelectItem>
                      <SelectItem value="grandfather">Grandfather</SelectItem>
                      <SelectItem value="grandmother">Grandmother</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.guardian_relation && (
                    <p className="text-sm text-red-600">{errors.guardian_relation.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardian_phone">Guardian Phone *</Label>
                  <Input
                    id="guardian_phone"
                    {...register('guardian_phone')}
                    placeholder="Enter guardian phone"
                  />
                  {errors.guardian_phone && (
                    <p className="text-sm text-red-600">{errors.guardian_phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardian_email">Guardian Email</Label>
                  <Input
                    id="guardian_email"
                    type="email"
                    {...register('guardian_email')}
                    placeholder="Enter guardian email"
                  />
                  {errors.guardian_email && (
                    <p className="text-sm text-red-600">{errors.guardian_email.message}</p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="guardian_address">Guardian Address</Label>
                  <Input
                    id="guardian_address"
                    {...register('guardian_address')}
                    placeholder="Enter guardian address"
                  />
                </div>
              </div>
            </div>

            {/* Form Validation Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">❌ Please fix the following errors:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>• <strong>{field.replace('_', ' ')}</strong>: {error?.message || `${field} is required`}</li>
                  ))}
                </ul>
                <p className="text-sm text-red-600 mt-2">
                  💡 <strong>Tip:</strong> Scroll up to see all form fields. All fields marked with <span className="text-red-500 font-semibold">*</span> are required.
                </p>
              </div>
            )}

            {/* Success Preview */}
            {Object.keys(errors).length === 0 && watch('admission_number') && watch('full_name') && watch('email') && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">✅ Form Ready to Submit</h4>
                <p className="text-sm text-green-700">
                  All required fields are filled. Student will be created as: <strong>{watch('full_name')}</strong> (Admission: {watch('admission_number')})
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update Student' : 'Create Student'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

