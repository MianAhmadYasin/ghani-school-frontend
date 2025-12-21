'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSettings } from '@/contexts/SettingsContext'
import { X, Printer, Download, Mail, Share2 } from 'lucide-react'
import { Grade, Student, Class } from '@/types'
import { useMemo } from 'react'

interface ReportCardModalProps {
  student: Student
  grades: Grade[]
  classInfo?: Class
  term: string
  academicYear: string
  isOpen: boolean
  onClose: () => void
  onExport?: () => void
  onEmail?: () => void
}

export function ReportCardModal({
  student,
  grades,
  classInfo,
  term,
  academicYear,
  isOpen,
  onClose,
  onExport,
  onEmail,
}: ReportCardModalProps) {
  const { schoolName } = useSettings()

  // Calculate statistics
  const stats = useMemo(() => {
    const totalGrades = grades.length
    const passingGrades = grades.filter((g: Grade) => Number(g.marks) >= 50).length
    const totalMarks = grades.reduce((sum: number, g: Grade) => sum + Number(g.marks), 0)
    const averageMarks = totalGrades > 0 ? totalMarks / totalGrades : 0
    const passRate = totalGrades > 0 ? (passingGrades / totalGrades) * 100 : 0

    return {
      totalGrades,
      passingGrades,
      averageMarks,
      passRate,
    }
  }, [grades])

  // Calculate grade from marks
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
      case 'A+': case 'A': return 'bg-green-100 text-green-800 border-green-200'
      case 'B+': case 'B': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'C+': case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'F': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (onExport) {
      onExport()
    } else {
      // Default: trigger print which can be saved as PDF
      handlePrint()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:relative print:bg-transparent print:p-0">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-auto print:shadow-none print:max-h-none print:rounded-none">
        {/* Report Card Header */}
        <div className="p-6 border-b print:border-b-2 print:border-gray-900">
          <div className="flex justify-between items-start mb-4 print:mb-6">
            <div>
              <h2 className="text-3xl font-bold print:text-4xl">ACADEMIC REPORT CARD</h2>
              <p className="text-lg text-gray-600 print:text-xl">{schoolName}</p>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                title="Download PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                title="Print"
              >
                <Printer className="h-4 w-4" />
              </Button>
              {onEmail && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEmail}
                  title="Email Report Card"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                title="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 print:gap-6 mb-4">
            <div>
              <p className="text-sm text-gray-600 print:text-base">Student Name:</p>
              <p className="font-semibold text-lg print:text-xl">
                {student.user?.full_name || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 print:text-base">Admission Number:</p>
              <p className="font-semibold text-lg print:text-xl">
                {student.admission_number}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 print:text-base">Class:</p>
              <p className="font-semibold text-lg print:text-xl">
                {classInfo ? `${classInfo.name} - ${classInfo.section}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 print:text-base">Term & Year:</p>
              <p className="font-semibold text-lg print:text-xl">
                {term} {academicYear}
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
                  {stats.averageMarks.toFixed(1)}%
                </td>
                <td className="border py-3 px-4 text-center print:border-gray-900">
                  <Badge className={getGradeColor(calculateGrade(stats.averageMarks))}>
                    {calculateGrade(stats.averageMarks)}
                  </Badge>
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
                <p className="font-semibold text-lg">{stats.totalGrades}</p>
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
                  {stats.averageMarks.toFixed(1)}%
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
      </div>
    </div>
  )
}


