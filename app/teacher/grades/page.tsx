'use client'

import { useState, useMemo } from 'react'
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
import { gradeService } from '@/services/gradeService'
import { 
  FileText, Users, Plus, Save, X, Edit, Trash2, Award, Trophy, Medal
} from 'lucide-react'
import { Grade, Student } from '@/types'

export default function TeacherGradesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [selectedClassId, setSelectedClassId] = useState<string>(searchParams.get('class_id') || '')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedTerm, setSelectedTerm] = useState<string>('First Term')
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [editingGrade, setEditingGrade] = useState<{ studentId: string; subject: string; grade?: Grade } | null>(null)
  const [gradeData, setGradeData] = useState<Record<string, { marks: number | ''; grade: string }>>({})

  // Fetch teacher's classes
  const { data: classes = [] } = useQuery({
    queryKey: ['my-classes'],
    queryFn: () => teacherService.getMyClasses(),
  })

  // Fetch teacher profile for subjects
  const { data: teacherProfile } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: () => teacherService.getMyProfile(),
  })

  // Fetch students for selected class
  const { data: students = [] } = useQuery({
    queryKey: ['class-students', selectedClassId],
    queryFn: () => classService.getClassStudents(selectedClassId),
    enabled: !!selectedClassId,
  })

  // Fetch existing grades
  const { data: existingGrades = [] } = useQuery({
    queryKey: ['grades', selectedClassId, selectedSubject, selectedTerm, selectedYear],
    queryFn: () => gradeService.getGrades({
      class_id: selectedClassId || undefined,
      subject: selectedSubject || undefined,
      term: selectedTerm || undefined,
      academic_year: selectedYear || undefined,
      limit: 1000,
    }),
    enabled: !!selectedClassId && !!selectedSubject,
  })

  // Fetch positions
  const { data: positionsData } = useQuery({
    queryKey: ['positions', selectedClassId, selectedTerm, selectedYear],
    queryFn: () => {
      if (!selectedClassId || !selectedTerm || !selectedYear) return null
      return gradeService.getPositions({
        class_id: selectedClassId,
        term: selectedTerm,
        academic_year: selectedYear,
        top_n: 3
      })
    },
    enabled: !!selectedClassId && !!selectedTerm && !!selectedYear,
  })

  const createGradeMutation = useMutation({
    mutationFn: (data: {
      student_id: string
      class_id: string
      subject: string
      marks: number
      grade: string
      term: string
      academic_year: string
    }) => gradeService.createGrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      toast.success('Grade created successfully!')
      setEditingGrade(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to create grade')
    }
  })

  const updateGradeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => gradeService.updateGrade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      toast.success('Grade updated successfully!')
      setEditingGrade(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update grade')
    }
  })

  const calculateGrade = (marks: number): string => {
    if (marks >= 90) return 'A+'
    if (marks >= 80) return 'A'
    if (marks >= 70) return 'B+'
    if (marks >= 60) return 'B'
    if (marks >= 50) return 'C+'
    if (marks >= 40) return 'C'
    if (marks >= 33) return 'D'
    return 'F'
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': case 'A': return 'bg-green-100 text-green-800'
      case 'B+': case 'B': return 'bg-blue-100 text-blue-800'
      case 'C+': case 'C': return 'bg-yellow-100 text-yellow-800'
      case 'D': return 'bg-orange-100 text-orange-800'
      case 'F': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSaveGrade = (studentId: string) => {
    const data = gradeData[studentId]
    if (!data || data.marks === '') {
      toast.error('Please enter marks')
      return
    }

    const marks = Number(data.marks)
    if (marks < 0 || marks > 100) {
      toast.error('Marks must be between 0 and 100')
      return
    }

    const grade = calculateGrade(marks)
    const gradeEntry = editingGrade?.grade

    if (gradeEntry) {
      updateGradeMutation.mutate({
        id: gradeEntry.id,
        data: { marks, grade }
      })
    } else {
      createGradeMutation.mutate({
        student_id: studentId,
        class_id: selectedClassId,
        subject: selectedSubject,
        marks,
        grade,
        term: selectedTerm,
        academic_year: selectedYear,
      })
    }
  }

  const subjects = teacherProfile?.subjects || []

  return (
    <DashboardLayout allowedRoles={['teacher']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enter Grades</h1>
          <p className="text-gray-600 mt-1">Enter and manage grades for your classes</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label>Class</Label>
                <Select value={selectedClassId || "all"} onValueChange={(value) => setSelectedClassId(value === "all" ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Class</SelectItem>
                    {classes.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Select value={selectedSubject || "all"} onValueChange={(value) => setSelectedSubject(value === "all" ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Subject</SelectItem>
                    {subjects.map((subject: string) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Term">First Term</SelectItem>
                    <SelectItem value="Second Term">Second Term</SelectItem>
                    <SelectItem value="Third Term">Third Term</SelectItem>
                    <SelectItem value="Final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Academic Year</Label>
                <Input
                  type="text"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  placeholder="Year"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Positions Section */}
        {positionsData && positionsData.positions.length > 0 && selectedClassId && (
          <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Top 3 Positions - {selectedTerm}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {positionsData.positions.map((pos, index) => {
                  const medalColors = [
                    { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800', icon: 'text-yellow-600' },
                    { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-800', icon: 'text-gray-600' },
                    { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800', icon: 'text-orange-600' }
                  ]
                  const colors = medalColors[index] || medalColors[2]
                  const positionLabels = ['1st', '2nd', '3rd']
                  
                  return (
                    <div
                      key={pos.student_id}
                      className={`${colors.bg} ${colors.border} border-2 rounded-lg p-4`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`${colors.bg} ${colors.border} border-2 rounded-full w-10 h-10 flex items-center justify-center font-bold ${colors.text}`}>
                          {positionLabels[index] || pos.position}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{pos.student_name}</h4>
                          <p className="text-sm opacity-75">{pos.admission_number}</p>
                        </div>
                      </div>
                      <div className="space-y-1 mt-3">
                        <div className="flex justify-between text-sm">
                          <span className="opacity-75">Average:</span>
                          <span className={`font-bold ${colors.text}`}>{pos.average_marks.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="opacity-75">Subjects:</span>
                          <span>{pos.passed_subjects}/{pos.total_subjects} Passed</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {positionsData.class_average && (
                <div className="mt-4 pt-4 border-t border-yellow-300">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Class Average:</span>
                    <span className="font-bold text-lg">{positionsData.class_average.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Grades Table */}
        {selectedClassId && selectedSubject ? (
          <Card>
            <CardHeader>
              <CardTitle>Enter Grades - {selectedSubject}</CardTitle>
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
                        <th className="text-center py-3 px-4">Marks</th>
                        <th className="text-center py-3 px-4">Grade</th>
                        <th className="text-center py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student: Student) => {
                        const existingGrade = existingGrades.find((g: Grade) => g.student_id === student.id)
                        const isEditing = editingGrade?.studentId === student.id && editingGrade?.subject === selectedSubject
                        
                        return (
                          <tr key={student.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <Users className="h-4 w-4 text-blue-600" />
                                <div>
                                  <div className="font-medium">{student.user?.full_name || 'Unknown'}</div>
                                  <div className="text-sm text-gray-600">{student.admission_number}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={gradeData[student.id]?.marks || existingGrade?.marks || ''}
                                  onChange={(e) => {
                                    const marks = e.target.value === '' ? '' : Number(e.target.value)
                                    const grade = marks !== '' ? calculateGrade(Number(marks)) : ''
                                    setGradeData(prev => ({
                                      ...prev,
                                      [student.id]: { marks, grade }
                                    }))
                                  }}
                                  className="w-20 text-center mx-auto"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-medium">
                                  {existingGrade ? `${existingGrade.marks}/100` : '-'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isEditing ? (
                                <Badge className={getGradeColor(gradeData[student.id]?.grade || 'F')}>
                                  {gradeData[student.id]?.grade || '-'}
                                </Badge>
                              ) : existingGrade ? (
                                <Badge className={getGradeColor(existingGrade.grade)}>
                                  {existingGrade.grade}
                                </Badge>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isEditing ? (
                                <div className="flex justify-center gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveGrade(student.id)}
                                    disabled={createGradeMutation.isPending || updateGradeMutation.isPending}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingGrade(null)
                                      setGradeData(prev => {
                                        const newData = { ...prev }
                                        delete newData[student.id]
                                        return newData
                                      })
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingGrade({ studentId: student.id, subject: selectedSubject, grade: existingGrade })
                                    if (existingGrade) {
                                      setGradeData(prev => ({
                                        ...prev,
                                        [student.id]: { marks: existingGrade.marks, grade: existingGrade.grade }
                                      }))
                                    }
                                  }}
                                >
                                  {existingGrade ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                </Button>
                              )}
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
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600 mb-2">Select Class and Subject</p>
              <p className="text-gray-500">Choose a class and subject to enter grades</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}



