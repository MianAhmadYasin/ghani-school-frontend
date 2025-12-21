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
import { classService } from '@/services/classService'
import { teacherService } from '@/services/teacherService'
import { useAuth } from '@/contexts/AuthContext'
import { Class, Teacher } from '@/types'
import { Loader2, X } from 'lucide-react'
import { toast } from '@/components/ui/toast'

const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  section: z.string().min(1, 'Section is required'),
  teacher_id: z.string().optional(),
  academic_year: z.string().min(1, 'Academic year is required'),
})

type ClassFormData = z.infer<typeof classSchema>

interface ClassFormProps {
  classData?: Class
  onClose: () => void
  onSuccess: () => void
}

const ACADEMIC_YEARS = [
  '2023-2024',
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2027-2028'
]

const CLASS_NAMES = [
  'Nursery', 'KG', 'Prep',
  '1st', '2nd', '3rd', '4th', '5th',
  '6th', '7th', '8th', '9th', '10th',
  '11th', '12th'
]

const SECTIONS = [
  'A', 'B', 'C', 'D', 'E', 'F'
]

export function ClassForm({ classData, onClose, onSuccess }: ClassFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const { user } = useAuth()
  
  const isEdit = !!classData

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: classData?.name || '',
      section: classData?.section || '',
      teacher_id: classData?.teacher_id || '',
      academic_year: classData?.academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    }
  })

  // Load teachers
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const teachersData = await teacherService.getTeachers({ limit: 1000 })
        setTeachers(teachersData.filter(teacher => teacher.status === 'active'))
      } catch (error) {
        console.error('Failed to load teachers:', error)
      }
    }
    loadTeachers()
  }, [])

  const onSubmit = async (data: ClassFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
      const classPayload = {
        name: data.name,
        section: data.section,
        teacher_id: data.teacher_id || null,
        academic_year: data.academic_year,
      }

      if (isEdit && classData) {
        await classService.updateClass(classData.id, classPayload)
      } else {
        await classService.createClass({ ...classPayload, teacher_id: classPayload.teacher_id || undefined })
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Failed to save class:', error)
      toast.error(error.response?.data?.detail || 'Failed to save class')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{isEdit ? 'Edit Class' : 'Create New Class'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Class Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Class Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Class Name *</Label>
                  <Select
                    value={watch('name') || 'placeholder'}
                    onValueChange={(value) => setValue('name', value === 'placeholder' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled>Select class</SelectItem>
                      {CLASS_NAMES.map((className) => (
                        <SelectItem key={className} value={className}>
                          {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section">Section *</Label>
                  <Select
                    value={watch('section') || 'placeholder'}
                    onValueChange={(value) => setValue('section', value === 'placeholder' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled>Select section</SelectItem>
                      {SECTIONS.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.section && (
                    <p className="text-sm text-red-600">{errors.section.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year *</Label>
                  <Select
                    value={watch('academic_year') || 'placeholder'}
                    onValueChange={(value) => setValue('academic_year', value === 'placeholder' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled>Select academic year</SelectItem>
                      {ACADEMIC_YEARS.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.academic_year && (
                    <p className="text-sm text-red-600">{errors.academic_year.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher_id">Class Teacher (Optional)</Label>
                  <Select
                    value={watch('teacher_id') || 'none'}
                    onValueChange={(value) => setValue('teacher_id', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No teacher assigned</SelectItem>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.user?.full_name} ({teacher.employee_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Class Preview</h4>
              <p className="text-lg">
                {watch('name') && watch('name') !== 'placeholder' && watch('section') && watch('section') !== 'placeholder' ? (
                  <>
                    <span className="font-semibold">{watch('name')} - {watch('section')}</span>
                    {watch('academic_year') && watch('academic_year') !== 'placeholder' && (
                      <span className="text-gray-600 ml-2">({watch('academic_year')})</span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-500">Select class and section to preview</span>
                )}
              </p>
              {watch('teacher_id') && watch('teacher_id') !== '' && watch('teacher_id') !== 'none' && (
                <p className="text-sm text-gray-600 mt-1">
                  Class Teacher: {teachers.find(t => t.id === watch('teacher_id'))?.user?.full_name}
                </p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update Class' : 'Create Class'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

