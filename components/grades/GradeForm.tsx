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
import { gradeService } from '@/services/gradeService'
import { studentService } from '@/services/studentService'
import { classService } from '@/services/classService'
import { Grade, Student, Class } from '@/types'
import { Loader2, X } from 'lucide-react'
import { toast } from '@/components/ui/toast'

const gradeSchema = z.object({
  student_id: z.string().min(1, 'Student is required'),
  class_id: z.string().min(1, 'Class is required'),
  subject: z.string().min(1, 'Subject is required'),
  marks: z.number().min(0, 'Marks must be positive').max(100, 'Marks cannot exceed 100'),
  grade: z.string().min(1, 'Grade is required'),
  term: z.string().min(1, 'Term is required'),
  academic_year: z.string().min(1, 'Academic year is required'),
  remarks: z.string().optional(),
})

type GradeFormData = z.infer<typeof gradeSchema>

interface GradeFormProps {
  grade?: Grade
  onClose: () => void
  onSuccess: () => void
  prefilledClass?: string
  prefilledStudent?: string
}

const SUBJECTS = [
  'Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology',
  'History', 'Geography', 'Computer Science', 'Islamic Studies', 'Urdu',
  'Arabic', 'Social Studies', 'Art', 'Physical Education'
]

const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Midterm', 'Final']

const GRADE_SCALE = [
  { grade: 'A+', min: 90, max: 100 },
  { grade: 'A', min: 80, max: 89 },
  { grade: 'B+', min: 70, max: 79 },
  { grade: 'B', min: 60, max: 69 },
  { grade: 'C', min: 50, max: 59 },
  { grade: 'D', min: 40, max: 49 },
  { grade: 'F', min: 0, max: 39 },
]

function calculateGrade(marks: number): string {
  const gradeObj = GRADE_SCALE.find(g => marks >= g.min && marks <= g.max)
  return gradeObj?.grade || 'F'
}

export function GradeForm({ grade, onClose, onSuccess, prefilledClass, prefilledStudent }: GradeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  
  const isEdit = !!grade

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      student_id: grade?.student_id || prefilledStudent || '',
      class_id: grade?.class_id || prefilledClass || '',
      subject: grade?.subject || '',
      marks: grade?.marks || 0,
      grade: grade?.grade || '',
      term: grade?.term || 'Term 1',
      academic_year: grade?.academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      remarks: grade?.remarks || '',
    }
  })

  const watchedMarks = watch('marks')
  const watchedClassId = watch('class_id')

  // Auto-calculate grade when marks change
  useEffect(() => {
    if (watchedMarks !== undefined) {
      const calculatedGrade = calculateGrade(watchedMarks)
      setValue('grade', calculatedGrade)
    }
  }, [watchedMarks, setValue])

  // Load classes and students
  useEffect(() => {
    const loadData = async () => {
      try {
        const [classesData, studentsData] = await Promise.all([
          classService.getClasses({ limit: 1000 }),
          studentService.getStudents({ limit: 1000, status: 'active' })
        ])
        setClasses(classesData)
        setStudents(studentsData)
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    loadData()
  }, [])

  // Filter students by selected class
  const filteredStudents = watchedClassId
    ? students.filter(s => s.class_id === watchedClassId)
    : students

  const onSubmit = async (data: GradeFormData) => {
    setIsLoading(true)
    try {
      if (isEdit && grade) {
        await gradeService.updateGrade(grade.id, {
          marks: data.marks,
          grade: data.grade,
          remarks: data.remarks,
        })
      } else {
        await gradeService.createGrade(data)
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Failed to save grade:', error)
      toast.error(error.response?.data?.detail || 'Failed to save grade')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{isEdit ? 'Edit Grade' : 'Add New Grade'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Grade Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class_id">Class *</Label>
                  <Select
                    value={watch('class_id')}
                    onValueChange={(value) => setValue('class_id', value)}
                    disabled={isEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} - {cls.section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.class_id && (
                    <p className="text-sm text-red-600">{errors.class_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student_id">Student *</Label>
                  <Select
                    value={watch('student_id')}
                    onValueChange={(value) => setValue('student_id', value)}
                    disabled={isEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.user?.full_name} ({student.admission_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.student_id && (
                    <p className="text-sm text-red-600">{errors.student_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select
                    value={watch('subject')}
                    onValueChange={(value) => setValue('subject', value)}
                    disabled={isEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subject && (
                    <p className="text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marks">Marks (0-100) *</Label>
                  <Input
                    id="marks"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    {...register('marks', { valueAsNumber: true })}
                    placeholder="Enter marks"
                  />
                  {errors.marks && (
                    <p className="text-sm text-red-600">{errors.marks.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Grade (Auto-calculated)</Label>
                  <Input
                    id="grade"
                    {...register('grade')}
                    readOnly
                    className="bg-gray-100"
                  />
                  {errors.grade && (
                    <p className="text-sm text-red-600">{errors.grade.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="term">Term *</Label>
                  <Select
                    value={watch('term')}
                    onValueChange={(value) => setValue('term', value)}
                    disabled={isEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      {TERMS.map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.term && (
                    <p className="text-sm text-red-600">{errors.term.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year *</Label>
                  <Input
                    id="academic_year"
                    {...register('academic_year')}
                    placeholder="e.g., 2024-2025"
                    disabled={isEdit}
                  />
                  {errors.academic_year && (
                    <p className="text-sm text-red-600">{errors.academic_year.message}</p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                  <Input
                    id="remarks"
                    {...register('remarks')}
                    placeholder="Enter any remarks"
                  />
                </div>
              </div>
            </div>

            {/* Grade Scale Reference */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Grading Scale</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {GRADE_SCALE.map((g) => (
                  <div key={g.grade} className="flex items-center gap-2">
                    <span className="font-semibold">{g.grade}:</span>
                    <span className="text-gray-600">{g.min}-{g.max}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update Grade' : 'Add Grade'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}














