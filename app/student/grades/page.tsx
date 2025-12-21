'use client'

import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { studentService } from '@/services/studentService'
import { gradeService } from '@/services/gradeService'
import { classService } from '@/services/classService'
import { useSettings } from '@/contexts/SettingsContext'
import { 
  FileText, Award, Printer, Download, TrendingUp, TrendingDown, Calendar,
  CheckCircle, AlertCircle, BookOpen, Target, BarChart3, X, Trophy, Medal
} from 'lucide-react'
import { Grade } from '@/types'

export default function StudentGradesPage() {
  const { schoolName } = useSettings()
  const [selectedTerm, setSelectedTerm] = useState<string>('First Term')
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [showReportCard, setShowReportCard] = useState(false)

  // Fetch student profile
  const { data: studentProfile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => studentService.getMyProfile(),
  })

  // Fetch student grades
  const { data: grades = [] } = useQuery({
    queryKey: ['my-grades', selectedTerm, selectedYear],
    queryFn: () => studentService.getMyGrades({
      term: selectedTerm,
      academic_year: selectedYear,
    }),
  })

  // Fetch class info
  const { data: classInfo } = useQuery({
    queryKey: ['my-class', studentProfile?.class_id],
    queryFn: () => classService.getClass(studentProfile!.class_id!),
    enabled: !!studentProfile?.class_id,
  })

  // Fetch positions to show student's position
  const { data: positionsData } = useQuery({
    queryKey: ['positions', studentProfile?.class_id, selectedTerm, selectedYear],
    queryFn: () => {
      if (!studentProfile?.class_id || !selectedTerm || !selectedYear) return null
      return gradeService.getPositions({
        class_id: studentProfile.class_id,
        term: selectedTerm,
        academic_year: selectedYear,
        top_n: 10 // Get more to find student's position
      })
    },
    enabled: !!studentProfile?.class_id && !!selectedTerm && !!selectedYear,
  })

  // Find student's position
  const myPosition = useMemo(() => {
    if (!positionsData || !studentProfile?.id) return null
    return positionsData.positions.find(p => p.student_id === studentProfile.id)
  }, [positionsData, studentProfile])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalGrades = grades.length
    const passingGrades = grades.filter((g: Grade) => Number(g.marks) >= 50).length
    const averageMarks = totalGrades > 0
      ? (grades.reduce((sum: number, g: Grade) => sum + Number(g.marks), 0) / totalGrades).toFixed(1)
      : 0
    const passRate = totalGrades > 0 ? Math.round((passingGrades / totalGrades) * 100) : 0

    // Get unique subjects
    const subjects = [...new Set(grades.map((g: Grade) => g.subject))]

    return {
      totalGrades,
      passingGrades,
      averageMarks,
      passRate,
      subjects,
    }
  }, [grades])

  // Calculate grade letter from marks
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

  // Get grade color
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-100 text-green-800 border-green-200'
      case 'A': return 'bg-green-100 text-green-800 border-green-200'
      case 'B+': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'C+': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'F': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Organize grades by subject
  const gradesBySubject = useMemo(() => {
    const organized: Record<string, Grade> = {}
    grades.forEach((grade: Grade) => {
      organized[grade.subject] = grade
    })
    return organized
  }, [grades])

  const handlePrintReportCard = () => {
    window.print()
  }

  return (
    <DashboardLayout allowedRoles={['student']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Grades</h1>
            <p className="text-gray-600 mt-1">View your academic performance</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowReportCard(true)}>
              <FileText className="h-4 w-4 mr-2" />
              View Report Card
            </Button>
            <Button variant="outline" onClick={handlePrintReportCard}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  <p className="text-sm font-medium text-gray-600">Class Position</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {myPosition ? (
                      <span className="flex items-center gap-2">
                        {myPosition.position === 1 && <Trophy className="h-6 w-6 text-yellow-500" />}
                        {myPosition.position === 2 && <Medal className="h-6 w-6 text-gray-500" />}
                        {myPosition.position === 3 && <Medal className="h-6 w-6 text-orange-500" />}
                        {myPosition.position}
                        {myPosition.position <= 3 && <span className="text-sm">({myPosition.position === 1 ? '1st' : myPosition.position === 2 ? '2nd' : '3rd'})</span>}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                  <p className="text-3xl font-bold text-green-600">{stats.subjects.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Passing Grades</p>
                  <p className="text-3xl font-bold text-green-600">{stats.passingGrades}/{stats.totalGrades}</p>
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
                  <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.passRate}%</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Term</label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Term" />
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
                <label className="text-sm font-medium mb-2 block">Academic Year</label>
                <input
                  type="text"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Academic Year"
                />
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowReportCard(true)}
                >
                  <Award className="h-4 w-4 mr-2" />
                  Generate Report Card
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position and Class Comparison */}
        {positionsData && myPosition && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Your Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Your Position</p>
                  <div className="flex items-center justify-center gap-2">
                    {myPosition.position === 1 && <Trophy className="h-8 w-8 text-yellow-500" />}
                    {myPosition.position === 2 && <Medal className="h-8 w-8 text-gray-500" />}
                    {myPosition.position === 3 && <Medal className="h-8 w-8 text-orange-500" />}
                    <p className="text-4xl font-bold text-blue-600">{myPosition.position}</p>
                    <span className="text-lg text-gray-500">
                      {myPosition.position === 1 ? 'st' : myPosition.position === 2 ? 'nd' : myPosition.position === 3 ? 'rd' : 'th'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">in {classInfo?.name} - {classInfo?.section}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Your Average</p>
                  <p className="text-4xl font-bold text-green-600">{myPosition.average_marks.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {myPosition.passed_subjects}/{myPosition.total_subjects} subjects passed
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Class Average</p>
                  <p className="text-4xl font-bold text-purple-600">{positionsData.class_average.toFixed(1)}%</p>
                  <p className="text-xs mt-2">
                    {myPosition.average_marks >= positionsData.class_average ? (
                      <span className="text-green-600 flex items-center justify-center gap-1">
                        <TrendingUp className="h-4 w-4" /> Above average
                      </span>
                    ) : (
                      <span className="text-orange-600 flex items-center justify-center gap-1">
                        <TrendingDown className="h-4 w-4" /> Below average
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.abs(myPosition.average_marks - positionsData.class_average).toFixed(1)}% difference
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grades Table */}
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Grades</CardTitle>
          </CardHeader>
          <CardContent>
            {grades.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No grades available</p>
                <p>Grades will appear here once they are entered by your teachers</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Subject</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Marks</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Grade</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((grade: Grade) => (
                      <tr key={grade.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{grade.subject}</td>
                        <td className="py-3 px-4 text-center font-semibold">{grade.marks}/100</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={getGradeColor(grade.grade)}>
                            {grade.grade}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {Number(grade.marks) >= 50 ? (
                            <div className="flex items-center justify-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">Pass</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-600">Fail</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{grade.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td className="py-3 px-4">Overall</td>
                      <td className="py-3 px-4 text-center">{stats.averageMarks}%</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getGradeColor(calculateGrade(Number(stats.averageMarks)))}>
                          {calculateGrade(Number(stats.averageMarks))}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {stats.passRate >= 50 ? (
                          <span className="text-green-600">Passed</span>
                        ) : (
                          <span className="text-red-600">Failed</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{stats.passingGrades}/{stats.totalGrades} subjects passed</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Card Modal */}
        {showReportCard && studentProfile && (
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
                    onClick={() => setShowReportCard(false)}
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
                      {studentProfile.user?.full_name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 print:text-base">Admission Number:</p>
                    <p className="font-semibold text-lg print:text-xl">
                      {studentProfile.admission_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 print:text-base">Class:</p>
                    <p className="font-semibold text-lg print:text-xl">
                      {classInfo?.name} - {classInfo?.section || 'N/A'}
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
                    {grades.map((grade: Grade, index) => (
                      <tr key={grade.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border py-3 px-4 font-medium print:border-gray-900">{grade.subject}</td>
                        <td className="border py-3 px-4 text-center print:border-gray-900">{grade.marks}/100</td>
                        <td className="border py-3 px-4 text-center print:border-gray-900">
                          <Badge className={getGradeColor(grade.grade)}>
                            {grade.grade}
                          </Badge>
                        </td>
                        <td className="border py-3 px-4 text-center text-sm print:border-gray-900">
                          {grade.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 print:bg-gray-200 font-semibold">
                    <tr>
                      <td className="border py-3 px-4 print:border-gray-900">Overall</td>
                      <td className="border py-3 px-4 text-center print:border-gray-900">
                        {stats.averageMarks}%
                      </td>
                      <td className="border py-3 px-4 text-center print:border-gray-900">
                        {calculateGrade(Number(stats.averageMarks))}
                      </td>
                      <td className="border py-3 px-4 text-center print:border-gray-900">
                        {stats.passingGrades}/{stats.totalGrades} Passed
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
                      <p className="font-semibold text-lg">{stats.subjects.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Passed</p>
                      <p className="font-semibold text-lg text-green-600">
                        {stats.passingGrades}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Overall GPA</p>
                      <p className="font-semibold text-lg text-blue-600">
                        {stats.averageMarks}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-semibold text-lg">
                        {stats.passRate >= 50 ? 'Passed' : 'In Progress'}
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
                <Button onClick={() => setShowReportCard(false)}>
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

