'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Search, Edit, Trash2, Eye, X, Calculator, Award, 
  Download, Upload, Save, RefreshCw, Filter, BarChart3,
  TrendingUp, TrendingDown, Users, BookOpen, Target,
  CheckCircle, AlertCircle, XCircle, Clock, FileSpreadsheet,
  FileText, Printer, Trophy, Medal
} from 'lucide-react'
import { gradeService } from '@/services/gradeService'
import { studentService } from '@/services/studentService'
import { classService } from '@/services/classService'
import { gradingSchemeService } from '@/services/gradingSchemeService'
import { useSettings } from '@/contexts/SettingsContext'
import { Grade, Student } from '@/types'

type TabId = 'student-grades' | 'bulk-entry' | 'report-cards' | 'analytics'

interface GradeEntry {
  id?: string
  student_id: string
  student_name: string
  admission_number: string
  class_id: string
  class_name: string
  subject: string
  marks: number | ''
  grade?: string
  term: string
  academic_year: string
  remarks: string
  isEditing?: boolean
}

interface StudentWithGrades {
  student: Student
  grades: Record<string, GradeEntry> // key is subject
  overallGPA?: number
  totalSubjects?: number
  passedSubjects?: number
}

export default function GradesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { schoolName } = useSettings()
  const [activeTab, setActiveTab] = useState<TabId>('student-grades')
  const [selectedClass, setSelectedClass] = useState<string>(searchParams.get('class_id') || '')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(searchParams.get('student_id') || null)
  const [selectedTerm, setSelectedTerm] = useState<string>(searchParams.get('term') || 'First Term')
  const [selectedYear, setSelectedYear] = useState<string>(searchParams.get('year') || new Date().getFullYear().toString())
  const [searchTerm, setSearchTerm] = useState('')
  const [editingGrade, setEditingGrade] = useState<GradeEntry | null>(null)
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string | null>(null)
  const [showReportCardModal, setShowReportCardModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch data
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentService.getStudents({ limit: 1000 }),
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classService.getClasses({ limit: 1000 }),
  })

  const { data: grades = [], isLoading: isLoadingGrades, error: gradesError } = useQuery({
    queryKey: ['grades', selectedClass, selectedStudentId, selectedTerm, selectedYear],
    queryFn: () => {
      // Normalize term: 'Final' -> 'Annual' for API
      const apiTerm = selectedTerm === 'Final' ? 'Annual' : selectedTerm
      return gradeService.getGrades({
        class_id: selectedClass || undefined,
        student_id: selectedStudentId || undefined,
        term: apiTerm || undefined,
        academic_year: selectedYear || undefined,
        limit: 1000
      })
    },
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Fetch positions
  const { data: positionsData, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['positions', selectedClass, selectedTerm, selectedYear],
    queryFn: () => {
      if (!selectedClass || !selectedTerm || !selectedYear) return null
      return gradeService.getPositions({
        class_id: selectedClass,
        term: selectedTerm,
        academic_year: selectedYear,
        top_n: 3
      })
    },
    enabled: !!selectedClass && !!selectedTerm && !!selectedYear,
    retry: 1,
    refetchOnWindowFocus: false,
  })
  
  // Show error if grades query fails
  useEffect(() => {
    if (gradesError) {
      console.error('Grades fetch error:', gradesError)
      const errorMessage = gradesError instanceof Error 
        ? gradesError.message 
        : 'Failed to load grades. Please check your connection and try again.'
      toast.error(errorMessage)
    }
  }, [gradesError])

  // Get students for selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) return []
    return students.filter((student: Student) => student.class_id === selectedClass)
  }, [students, selectedClass])

  // Get unique subjects from grades
  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>()
    grades.forEach((grade: Grade) => {
      subjects.add(grade.subject)
    })
    return Array.from(subjects).sort()
  }, [grades])

  // Get active grading scheme for preview (backend calculates on save)
  const { data: activeScheme } = useQuery({
    queryKey: ['default-grading-scheme'],
    queryFn: async () => {
      try {
        return await gradingSchemeService.getDefaultGradingScheme()
      } catch (error) {
        // Silently fail - will use fallback calculation
        return undefined
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Calculate grade letter from marks (for display preview only - backend calculates on save)
  const calculateGrade = useCallback((marks: number): string => {
    // Use active scheme if available
    if (activeScheme && 'criteria' in activeScheme && activeScheme.criteria && activeScheme.criteria.length > 0) {
      const sorted = [...activeScheme.criteria].sort((a, b) => (b.display_order || 0) - (a.display_order || 0))
      for (const criterion of sorted) {
        if (marks >= criterion.min_marks && marks <= criterion.max_marks) {
          return criterion.grade_name
        }
      }
      // Fallback to lowest grade
      if (sorted.length > 0) {
        const lowest = sorted.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0]
        return lowest.grade_name
      }
    }
    
    // Fallback to default calculation
    if (marks >= 90) return 'A+'
    if (marks >= 80) return 'A'
    if (marks >= 70) return 'B+'
    if (marks >= 60) return 'B'
    if (marks >= 50) return 'C+'
    if (marks >= 40) return 'C'
    if (marks >= 33) return 'D'
    return 'F'
  }, [activeScheme])

  // Organize grades by student and subject
  const studentsWithGrades = useMemo(() => {
    const result: Record<string, StudentWithGrades> = {}
    
    classStudents.forEach((student: Student) => {
      const studentGrades: Record<string, GradeEntry> = {}
      const studentGradeRecords = grades.filter((g: Grade) => g.student_id === student.id)
      
          studentGradeRecords.forEach((grade: Grade) => {
        // Normalize term back to 'Final' for display if it's 'Annual'
        const displayTerm = grade.term === 'Annual' ? 'Final' : grade.term
        studentGrades[grade.subject] = {
          id: grade.id,
          student_id: grade.student_id,
          student_name: student.user?.full_name || 'Unknown',
          admission_number: student.admission_number,
          class_id: grade.class_id,
          class_name: classes.find(c => c.id === grade.class_id)?.name || '',
          subject: grade.subject,
          marks: Number(grade.marks),
          grade: grade.grade,
          term: displayTerm, // Use display term
          academic_year: grade.academic_year,
          remarks: grade.remarks || '',
          isEditing: false
        }
      })

      // Calculate statistics
      const gradeValues = Object.values(studentGrades)
      const totalSubjects = availableSubjects.length || gradeValues.length
      const passedSubjects = gradeValues.filter(g => {
        const marks = Number(g.marks || 0)
        if (isNaN(marks)) return false
        
        // Use active scheme to determine passing if available
        if (activeScheme && 'criteria' in activeScheme && activeScheme.criteria) {
          const calculatedGrade = calculateGrade(marks)
          const criterion = activeScheme.criteria.find((c: any) => c.grade_name === calculatedGrade)
          if (criterion) {
            return criterion.is_passing
          }
        }
        
        // Fallback: marks >= 50
        return marks >= 50
      }).length
      
      const totalMarks = gradeValues.reduce((sum, g) => {
        const marks = Number(g.marks || 0)
        return sum + (isNaN(marks) ? 0 : marks)
      }, 0)
      const overallGPA = gradeValues.length > 0 && totalMarks > 0 ? totalMarks / gradeValues.length : 0

      result[student.id] = {
        student,
        grades: studentGrades,
        overallGPA,
        totalSubjects,
        passedSubjects
      }
    })

    return result
  }, [classStudents, grades, availableSubjects, classes, activeScheme, calculateGrade])
  
  // Note: Grade calculation is handled by the backend automatically using active grading scheme
  // calculateGrade function is only for UI preview purposes

  // Get grade color (works with custom grade names too)
  const getGradeColor = (grade: string | undefined) => {
    if (!grade) return 'bg-gray-100 text-gray-800 border-gray-200'
    const gradeUpper = grade.toUpperCase()
    // Check if it's a standard grade first
    if (gradeUpper.startsWith('A')) {
      if (gradeUpper === 'A+' || gradeUpper === 'A') {
        return 'bg-green-100 text-green-800 border-green-200'
      }
    } else if (gradeUpper.startsWith('B')) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    } else if (gradeUpper.startsWith('C')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    } else if (gradeUpper.startsWith('D')) {
      return 'bg-orange-100 text-orange-800 border-orange-200'
    } else if (gradeUpper.startsWith('F')) {
      return 'bg-red-100 text-red-800 border-red-200'
    }
    
    // Use active scheme to determine if passing/failing
    if (activeScheme && 'criteria' in activeScheme && activeScheme.criteria) {
      const criterion = activeScheme.criteria.find((c: any) => c.grade_name.toUpperCase() === gradeUpper)
      if (criterion && !criterion.is_passing) {
        return 'bg-red-100 text-red-800 border-red-200'
      }
    }
    
    // Default for unknown grades
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // Create grade mutation
  const createGradeMutation = useMutation({
    mutationFn: (data: GradeEntry) => gradeService.createGrade({
      student_id: data.student_id,
      class_id: data.class_id,
      subject: data.subject,
      marks: Number(data.marks),
      // Backend will auto-calculate grade from marks
      // Don't send grade - backend handles calculation
      term: data.term === 'Final' ? 'Annual' : data.term, // Normalize term
      academic_year: data.academic_year,
      remarks: data.remarks || ''
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      toast.success(`Grade created successfully! ${data.grade} (${data.marks}%)`)
      setEditingGrade(null)
      setIsSaving(false)
    },
    onError: (error: any) => {
      setIsSaving(false)
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Failed to create grade'
      toast.error(errorMessage)
      console.error('Grade creation error:', error)
    }
  })

  // Update grade mutation
  const updateGradeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GradeEntry> }) => {
      const updateData: any = {
        remarks: data.remarks
      }
      
      // If marks are updated, backend will auto-recalculate grade
      if (data.marks !== undefined && data.marks !== '') {
        updateData.marks = Number(data.marks)
        // Don't send grade - backend will recalculate from marks
      }
      
      // Only send grade if explicitly provided (for override)
      if (data.grade) {
        updateData.grade = data.grade
      }
      
      return gradeService.updateGrade(id, updateData)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      toast.success(`Grade updated successfully! ${data.grade} (${data.marks}%)`)
      setEditingGrade(null)
      setIsSaving(false)
    },
    onError: (error: any) => {
      setIsSaving(false)
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          error?.message || 
                          'Failed to update grade'
      toast.error(errorMessage)
      console.error('Grade update error:', error)
    }
  })

  // Delete grade mutation
  const deleteGradeMutation = useMutation({
    mutationFn: (id: string) => gradeService.deleteGrade(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      toast.success('Grade deleted successfully!')
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          error?.message || 
                          'Failed to delete grade'
      toast.error(errorMessage)
      console.error('Grade deletion error:', error)
    }
  })

  // Handle start edit
  const startEdit = (studentId: string, subject: string, existingGrade?: GradeEntry) => {
    const student = classStudents.find((s: Student) => s.id === studentId)
    if (!student) return

    if (existingGrade) {
      setEditingGrade({ ...existingGrade, isEditing: true })
    } else {
      setEditingGrade({
        student_id: studentId,
        student_name: student.user?.full_name || 'Unknown',
        admission_number: student.admission_number,
        class_id: selectedClass,
        class_name: classes.find(c => c.id === selectedClass)?.name || '',
        subject: subject,
        marks: '',
        grade: '',
        term: selectedTerm,
        academic_year: selectedYear,
        remarks: '',
        isEditing: true
      })
    }
  }

  // Handle save
  const handleSave = () => {
    if (!editingGrade || isSaving) return

    // Validate marks
    if (editingGrade.marks === '' || editingGrade.marks === null || editingGrade.marks === undefined) {
      toast.error('Please enter marks')
      return
    }

    const marks = typeof editingGrade.marks === 'string' ? Number(editingGrade.marks) : editingGrade.marks
    if (isNaN(marks)) {
      toast.error('Please enter valid marks')
      return
    }
    
    // Clamp marks to 0-100 range
    const clampedMarks = Math.max(0, Math.min(100, marks))
    if (clampedMarks !== marks) {
      toast.error('Marks must be between 0 and 100')
      setEditingGrade({ ...editingGrade, marks: clampedMarks })
      return
    }

    // Validate required fields
    if (!editingGrade.student_id || !editingGrade.class_id || !editingGrade.subject) {
      toast.error('Missing required fields: student, class, or subject')
      return
    }

    if (!editingGrade.term || !editingGrade.academic_year) {
      toast.error('Missing required fields: term or academic year')
      return
    }

    setIsSaving(true)

    // Backend will automatically calculate grade from marks
    // We don't need to send grade - backend handles it
    const gradeToSave = { 
      ...editingGrade, 
      marks: clampedMarks,
      // Ensure term is properly formatted (Final -> Annual for backend)
      term: editingGrade.term === 'Final' ? 'Annual' : editingGrade.term,
      // Don't send grade - let backend calculate it
      grade: undefined
    }

    if (gradeToSave.id) {
      updateGradeMutation.mutate({ 
        id: gradeToSave.id, 
        data: {
          marks: gradeToSave.marks,
          remarks: gradeToSave.remarks || ''
        }
      }, {
        onSettled: () => setIsSaving(false)
      })
    } else {
      createGradeMutation.mutate(gradeToSave, {
        onSettled: () => setIsSaving(false)
      })
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalGrades = grades.length
    const passingGrades = grades.filter((g: Grade) => {
      const marks = Number(g.marks || 0)
      if (isNaN(marks)) return false
      
      // Use active scheme to determine passing if available
      if (activeScheme && 'criteria' in activeScheme && activeScheme.criteria) {
        const criterion = activeScheme.criteria.find((c: any) => c.grade_name === g.grade)
        if (criterion) {
          return criterion.is_passing
        }
      }
      
      // Fallback: marks >= 50 or grade !== 'F'
      return marks >= 50 || g.grade?.toUpperCase() !== 'F'
    }).length
    
    const totalMarks = grades.reduce((sum: number, g: Grade) => {
      const marks = Number(g.marks || 0)
      return sum + (isNaN(marks) ? 0 : marks)
    }, 0)
    
    const averageMarks = totalGrades > 0 && totalMarks > 0
      ? (totalMarks / totalGrades).toFixed(1)
      : '0'
    const passRate = totalGrades > 0 ? Math.round((passingGrades / totalGrades) * 100) : 0
    
    const gradeDistribution = grades.reduce((acc: any, grade: Grade) => {
      if (grade.grade) {
        acc[grade.grade] = (acc[grade.grade] || 0) + 1
      }
      return acc
    }, {})

    return {
      totalGrades,
      passingGrades,
      averageMarks,
      passRate,
      gradeDistribution
    }
  }, [grades, activeScheme])

  // Filtered students
  const filteredStudents = useMemo(() => {
    const studentEntries = Object.values(studentsWithGrades)
    if (!searchTerm) return studentEntries
    
    const lowerSearch = searchTerm.toLowerCase()
    return studentEntries.filter(({ student }) => {
      const name = student.user?.full_name?.toLowerCase() || ''
      const admission = student.admission_number?.toLowerCase() || ''
      return name.includes(lowerSearch) || admission.includes(lowerSearch)
    })
  }, [studentsWithGrades, searchTerm])

  // Get selected student for report card
  const selectedStudentData = useMemo(() => {
    if (!selectedStudentForReport) return null
    return studentsWithGrades[selectedStudentForReport]
  }, [selectedStudentForReport, studentsWithGrades])

  // Print report card
  const handlePrintReportCard = () => {
    window.print()
  }

  const tabs = [
    { id: 'student-grades' as TabId, name: 'Student Grades', icon: BookOpen },
    { id: 'bulk-entry' as TabId, name: 'Bulk Entry', icon: Plus },
    { id: 'report-cards' as TabId, name: 'Report Cards', icon: FileText },
    { id: 'analytics' as TabId, name: 'Analytics', icon: TrendingUp },
  ]

  return (
    <DashboardLayout allowedRoles={['admin', 'principal', 'teacher']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grade Management System</h1>
            <p className="text-gray-600 mt-1">Complete grade management with report cards</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => router.push('/admin/reports?type=academic')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Grades
            </Button>
            {selectedClass && (
              <Button 
                variant="outline"
                onClick={() => router.push(`/admin/reports?class_id=${selectedClass}&type=academic`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Class Performance
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Grades</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalGrades}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Calculator className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Passing Grades</p>
                  <p className="text-3xl font-bold text-green-600">{stats.passingGrades}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Marks</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.averageMarks}%</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.passRate}%</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedClass || "all"} onValueChange={(value) => setSelectedClass(value === "all" ? "" : value)}>
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

              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First Term">First Term</SelectItem>
                  <SelectItem value="Second Term">Second Term</SelectItem>
                  <SelectItem value="Third Term">Third Term</SelectItem>
                  <SelectItem value="Final">Final / Annual</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="text"
                placeholder="Academic Year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              />

              <Button variant="outline" onClick={() => {
                setSearchTerm('')
                setSelectedClass('')
                setSelectedTerm('First Term')
                setSelectedYear(new Date().getFullYear().toString())
              }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

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
          {/* Student Grades Tab */}
          {activeTab === 'student-grades' && (
              <Card>
                <CardHeader>
                <CardTitle>Student Grades Management</CardTitle>
                <p className="text-sm text-gray-600">View and manage all grades for each student</p>
                </CardHeader>
                <CardContent>
                {!selectedClass ? (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Select a Class</p>
                    <p>Choose a class to view and manage student grades</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Class Info */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-blue-900">
                          {classes.find(c => c.id === selectedClass)?.name} - {classes.find(c => c.id === selectedClass)?.section}
                        </h3>
                        <p className="text-sm text-blue-700">{selectedTerm} • {selectedYear}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-700">Students: {classStudents.length}</p>
                        <p className="text-sm text-blue-700">Subjects: {availableSubjects.length}</p>
                        {positionsData && (
                          <p className="text-sm text-blue-700">Class Average: {positionsData.class_average.toFixed(1)}%</p>
                        )}
                      </div>
                    </div>

                    {/* Top Positions Section */}
                    {positionsData && positionsData.positions.length > 0 && (
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
                                  className={`${colors.bg} ${colors.border} border-2 rounded-lg p-4 relative overflow-hidden`}
                                >
                                  <div className="absolute top-2 right-2">
                                    <Medal className={`h-6 w-6 ${colors.icon}`} />
                                  </div>
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
                        </CardContent>
                      </Card>
                    )}

                    {/* Students with all subjects table */}
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                              Position
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 sticky left-[60px] bg-gray-50 z-10 min-w-[200px]">
                              Student Name / Admission
                            </th>
                            {availableSubjects.map(subject => (
                              <th key={subject} className="text-center py-3 px-4 font-medium text-gray-900 min-w-[140px]">
                                {subject}
                              </th>
                            ))}
                            <th className="text-center py-3 px-4 font-medium text-gray-900 min-w-[100px]">
                              Overall
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-gray-900 min-w-[120px]">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(isLoadingGrades && !grades.length) ? (
                            <tr>
                              <td colSpan={(availableSubjects.length || 1) + 4} className="py-8 text-center text-gray-500">
                                Loading grades...
                              </td>
                            </tr>
                          ) : filteredStudents.length === 0 ? (
                            <tr>
                              <td colSpan={(availableSubjects.length || 1) + 4} className="py-8 text-center text-gray-500">
                                {availableSubjects.length === 0 
                                  ? 'No grades found for this class. Select a class and term to start adding grades.' 
                                  : 'No students found in this class'}
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map(({ student, grades, overallGPA, passedSubjects, totalSubjects }) => {
                              // Find student position
                              const studentPosition = positionsData?.positions.find(p => p.student_id === student.id)
                              const getPositionBadge = (position?: number) => {
                                if (!position) return null
                                if (position === 1) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-400"><Trophy className="h-3 w-3 mr-1" />1st</Badge>
                                if (position === 2) return <Badge className="bg-gray-100 text-gray-800 border-gray-400"><Medal className="h-3 w-3 mr-1" />2nd</Badge>
                                if (position === 3) return <Badge className="bg-orange-100 text-orange-800 border-orange-400"><Medal className="h-3 w-3 mr-1" />3rd</Badge>
                                return <Badge variant="outline">{position}</Badge>
                              }
                              
                              return (
                              <tr key={student.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 sticky left-0 bg-white z-10 text-center">
                                  {getPositionBadge(studentPosition?.position) || '-'}
                                </td>
                              <td className="py-3 px-4 sticky left-[60px] bg-white z-10">
                                  <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <div 
                                        className="font-medium cursor-pointer hover:text-blue-600 hover:underline"
                                        onClick={() => router.push(`/admin/students?student_id=${student.id}`)}
                                        title="View Student Details"
                                      >
                                        {student.user?.full_name || 'Unknown'}
                                      </div>
                                      <div className="text-sm text-gray-600">{student.admission_number}</div>
                                    </div>
                                  </div>
                                </td>
                              {availableSubjects.map(subject => {
                                const grade = grades[subject]
                                const isEditing = editingGrade?.student_id === student.id && 
                                                  editingGrade?.subject === subject
                                
                                return (
                                  <td key={subject} className="py-3 px-4 text-center">
                                  {isEditing ? (
                                      <div className="flex flex-col gap-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                          value={editingGrade.marks}
                                          onChange={(e) => {
                                            const value = e.target.value
                                            const marks = value === '' ? '' : (isNaN(Number(value)) ? editingGrade.marks : Number(value))
                                            // Clamp marks between 0 and 100
                                            const clampedMarks = typeof marks === 'number' 
                                              ? Math.max(0, Math.min(100, marks)) 
                                              : marks
                                            const newGrade = clampedMarks !== '' && typeof clampedMarks === 'number' 
                                              ? calculateGrade(clampedMarks) 
                                              : ''
                                            setEditingGrade({ 
                                              ...editingGrade, 
                                              marks: clampedMarks, 
                                              grade: newGrade 
                                            })
                                          }}
                                          className="w-20 text-center mx-auto"
                                          autoFocus
                                        />
                                        {editingGrade.grade && (
                                          <Badge className={`${getGradeColor(editingGrade.grade)} text-xs`}>
                                            {editingGrade.grade}
                                    </Badge>
                                        )}
                                        <div className="flex gap-1 justify-center">
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={handleSave}
                                            disabled={isSaving || createGradeMutation.isPending || updateGradeMutation.isPending}
                                            className="h-6 px-2"
                                            title="Save grade"
                                          >
                                            <Save className="h-3 w-3" />
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => setEditingGrade(null)}
                                            className="h-6 px-2"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                    </div>
                                    </div>
                                    ) : grade ? (
                                      <div className="flex flex-col items-center gap-1 group">
                                        <div className="font-medium">{grade.marks}/100</div>
                                        <Badge className={getGradeColor(grade.grade)}>
                                          {grade.grade}
                                        </Badge>
                                        <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button 
                                            size="sm" 
                                            variant="ghost"
                                            onClick={() => startEdit(student.id, subject, grade)}
                                            className="h-6 w-6 p-0"
                                            title="Edit"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          {grade.id && (
                                          <Button 
                                            size="sm" 
                                              variant="ghost"
                                              onClick={() => {
                                                if (confirm(`Delete grade for ${subject}?`)) {
                                                  deleteGradeMutation.mutate(grade.id!)
                                                }
                                              }}
                                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                              title="Delete"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                          </Button>
                                          )}
                                        </div>
                                      </div>
                                      ) : (
                                          <Button 
                                            size="sm" 
                                        variant="ghost"
                                        onClick={() => startEdit(student.id, subject)}
                                        className="text-gray-400 hover:text-gray-600"
                                        title="Add Grade"
                                      >
                                        <Plus className="h-4 w-4" />
                                          </Button>
                                    )}
                                  </td>
                                )
                              })}
                              <td className="py-3 px-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="font-semibold text-lg">
                                    {overallGPA ? overallGPA.toFixed(1) : '-'}%
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {passedSubjects ?? 0}/{totalSubjects ?? 0} Pass
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex justify-center gap-2">
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                    onClick={() => {
                                      setSelectedStudentForReport(student.id)
                                      setShowReportCardModal(true)
                                    }}
                                    title="View Report Card"
                                  >
                                    <Eye className="h-4 w-4" />
                                          </Button>
                                      <Button 
                                        size="sm"
                                    variant="outline"
                                        onClick={() => {
                                      const hasAllGrades = availableSubjects.every(subj => grades[subj])
                                      if (!hasAllGrades) {
                                        toast.info(`This student has ${Object.keys(grades).length} of ${availableSubjects.length} subjects graded`)
                                      } else {
                                        setSelectedStudentForReport(student.id)
                                        setShowReportCardModal(true)
                                      }
                                    }}
                                    title="Quick View"
                                  >
                                    <FileText className="h-4 w-4" />
                                      </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bulk Entry Tab */}
          {activeTab === 'bulk-entry' && (
            <Card>
              <CardHeader>
                <CardTitle>Bulk Grade Entry</CardTitle>
                <p className="text-sm text-gray-600">Enter grades for multiple students at once</p>
              </CardHeader>
              <CardContent>
                {!selectedClass ? (
                  <div className="text-center py-12 text-gray-500">
                    <Plus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Select a Class</p>
                    <p>Choose a class to start bulk grade entry</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Use the "Student Grades" tab to enter grades. You can quickly add grades by clicking the + button for each subject.
                        </p>
                      </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Report Cards Tab */}
          {activeTab === 'report-cards' && (
            <Card>
              <CardHeader>
                <CardTitle>Report Cards</CardTitle>
                <p className="text-sm text-gray-600">Generate and view student report cards</p>
              </CardHeader>
              <CardContent>
                {!selectedClass ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Select a Class</p>
                    <p>Choose a class to view report cards</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredStudents.map(({ student, overallGPA, passedSubjects, totalSubjects }) => (
                        <Card key={student.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="h-6 w-6 text-blue-600" />
                                  </div>
                                  <div>
                                  <div className="font-semibold">{student.user?.full_name || 'Unknown'}</div>
                                  <div className="text-sm text-gray-600">{student.admission_number}</div>
                                  </div>
                                </div>
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Overall GPA:</span>
                                <span className="font-semibold">{overallGPA ? overallGPA.toFixed(1) : 'N/A'}%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Status:</span>
                                <Badge className={passedSubjects === totalSubjects && (passedSubjects ?? 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                  {passedSubjects ?? 0}/{totalSubjects ?? 0} Passed
                                </Badge>
                    </div>
                      </div>
                        <Button 
                              className="w-full"
                          onClick={() => {
                                setSelectedStudentForReport(student.id)
                                setShowReportCardModal(true)
                          }}
                        >
                              <Eye className="h-4 w-4 mr-2" />
                              View Report Card
                        </Button>
                          </CardContent>
                        </Card>
                      ))}
                      </div>

                    {filteredStudents.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">No students found</p>
                        <p>No students match your search criteria</p>
                    </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
                    {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
                      <div key={grade} className="text-center p-4 border rounded-lg">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold ${getGradeColor(grade)}`}>
                          {grade}
                  </div>
                        <p className="mt-2 text-sm font-medium">{count as number}</p>
                        <p className="text-xs text-gray-500">students</p>
            </div>
                    ))}
                  </div>
                  
                  {availableSubjects.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4">Subject-wise Performance</h3>
                      <div className="space-y-3">
                        {availableSubjects.map(subject => {
                          const subjectGrades = grades.filter((g: Grade) => g.subject === subject)
                          const avgMarks = subjectGrades.length > 0
                            ? (subjectGrades.reduce((sum: number, g: Grade) => sum + Number(g.marks), 0) / subjectGrades.length).toFixed(1)
                            : 0
                          const passRate = subjectGrades.length > 0
                            ? Math.round((subjectGrades.filter((g: Grade) => Number(g.marks) >= 50).length / subjectGrades.length) * 100)
                            : 0
                          
                          return (
                            <div key={subject} className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="font-medium">{subject}</span>
                              <div className="flex gap-4">
                                <span className="text-sm text-gray-600">Avg: {avgMarks}%</span>
                                <span className="text-sm text-gray-600">Pass: {passRate}%</span>
                  </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Report Card Modal */}
        {showReportCardModal && selectedStudentData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-auto print:shadow-none print:max-h-none">
              {/* Report Card Header */}
              <div className="p-6 border-b print:border-b-2 print:border-gray-900">
                <div className="flex justify-between items-start mb-4 print:mb-6">
                  <div>
                    <h2 className="text-3xl font-bold print:text-4xl">ACADEMIC REPORT CARD</h2>
                    <p className="text-lg text-gray-600 print:text-xl">{schoolName}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReportCardModal(false)}
                    className="print:hidden"
                >
                  <X className="h-5 w-5" />
                  </Button>
              </div>
                
                {/* Student Info */}
                <div className="grid grid-cols-2 gap-4 print:gap-6 mb-4">
                <div>
                    <p className="text-sm text-gray-600 print:text-base">Student Name:</p>
                    <p className="font-semibold text-lg print:text-xl">
                      {selectedStudentData.student.user?.full_name || 'Unknown'}
                    </p>
                </div>
                  <div>
                    <p className="text-sm text-gray-600 print:text-base">Admission Number:</p>
                    <p className="font-semibold text-lg print:text-xl">
                      {selectedStudentData.student.admission_number}
                    </p>
                </div>
                  <div>
                    <p className="text-sm text-gray-600 print:text-base">Class:</p>
                    <p className="font-semibold text-lg print:text-xl">
                      {classes.find(c => c.id === selectedClass)?.name} - {classes.find(c => c.id === selectedClass)?.section}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 print:text-base">Term & Year:</p>
                    <p className="font-semibold text-lg print:text-xl">
                      {selectedTerm} {selectedYear}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grades Table */}
              <div className="p-6">
                <table className="w-full border-collapse print:border-2 print:border-gray-900">
                  <thead>
                    <tr className="bg-gray-50 print:bg-gray-200">
                      <th className="border py-3 px-4 text-left font-semibold print:border-gray-900">Subject</th>
                      <th className="border py-3 px-4 text-center font-semibold print:border-gray-900">Marks</th>
                      <th className="border py-3 px-4 text-center font-semibold print:border-gray-900">Grade</th>
                      <th className="border py-3 px-4 text-center font-semibold print:border-gray-900">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableSubjects.map((subject, index) => {
                      const grade = selectedStudentData.grades[subject]
                      return (
                        <tr key={subject} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border py-3 px-4 font-medium print:border-gray-900">{subject}</td>
                          <td className="border py-3 px-4 text-center print:border-gray-900">
                            {grade ? `${grade.marks}/100` : '-'}
                          </td>
                          <td className="border py-3 px-4 text-center print:border-gray-900">
                            {grade ? (
                              <Badge className={getGradeColor(grade.grade)}>
                                {grade.grade}
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="border py-3 px-4 text-center text-sm print:border-gray-900">
                            {grade?.remarks || '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 print:bg-gray-200 font-semibold">
                    <tr>
                      <td className="border py-3 px-4 print:border-gray-900">Overall</td>
                      <td className="border py-3 px-4 text-center print:border-gray-900">
                        {selectedStudentData.overallGPA ? selectedStudentData.overallGPA.toFixed(1) : '-'}%
                      </td>
                      <td className="border py-3 px-4 text-center print:border-gray-900">
                        {selectedStudentData.overallGPA ? calculateGrade(selectedStudentData.overallGPA) : '-'}
                      </td>
                      <td className="border py-3 px-4 text-center print:border-gray-900">
                        {selectedStudentData.passedSubjects}/{selectedStudentData.totalSubjects} Passed
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Summary */}
                <div className="mt-6 p-4 bg-blue-50 print:bg-gray-100 rounded-lg print:rounded-none">
                  <h3 className="font-semibold mb-2 print:text-lg">Performance Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm print:text-base">
                    <div>
                      <p className="text-gray-600">Total Subjects</p>
                      <p className="font-semibold text-lg">{availableSubjects.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Passed</p>
                      <p className="font-semibold text-lg text-green-600">
                        {selectedStudentData.passedSubjects || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Overall GPA</p>
                      <p className="font-semibold text-lg text-blue-600">
                        {selectedStudentData.overallGPA ? selectedStudentData.overallGPA.toFixed(1) : 'N/A'}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-semibold text-lg">
                        {selectedStudentData.passedSubjects === selectedStudentData.totalSubjects && 
                         (selectedStudentData.totalSubjects ?? 0) > 0 ? 'Passed' : 'In Progress'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t flex justify-end gap-3 print:hidden">
                <Button variant="outline" onClick={handlePrintReportCard}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={() => setShowReportCardModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}