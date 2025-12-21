'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { 
  BarChart3, FileText, Download, Calendar, Users, 
  TrendingUp, Award, Clock, BookOpen, DollarSign,
  PieChart, Activity, Target, CheckCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { gradeService } from '@/services/gradeService'
import { attendanceService } from '@/services/attendanceService'
import { financeService } from '@/services/financeService'
import { studentService } from '@/services/studentService'
import { teacherService } from '@/services/teacherService'
import { classService } from '@/services/classService'
import { useSettings } from '@/contexts/SettingsContext'
import { ReportCardModal } from '@/components/shared/ReportCardModal'
import { Grade, Attendance, Expense, Donation, Student, Class } from '@/types'

interface ReportData {
  id: string
  title: string
  type: 'academic' | 'attendance' | 'financial' | 'inventory' | 'performance'
  period: string
  generated_at: string
  data: any
}

interface AcademicReport {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  passPercentage: number
  failPercentage: number
  averageGrade: string
  topPerformers: Array<{
    name: string
    grade: string
    percentage: number
  }>
  classWiseStats: Array<{
    className: string
    totalStudents: number
    passPercentage: number
    averageGrade: string
  }>
}

interface AttendanceReport {
  totalDays: number
  averageAttendance: number
  presentStudents: number
  absentStudents: number
  classWiseAttendance: Array<{
    className: string
    averageAttendance: number
    totalPresent: number
    totalAbsent: number
  }>
  monthlyTrend: Array<{
    month: string
    attendance: number
  }>
}

interface FinancialReport {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  monthlyBreakdown: Array<{
    month: string
    revenue: number
    expenses: number
    profit: number
  }>
  categoryWiseExpenses: Array<{
    category: string
    amount: number
    percentage: number
  }>
}

export default function ReportsPage() {
  const { schoolName, currentAcademicYear } = useSettings()
  const searchParams = useSearchParams()
  const [selectedReportType, setSelectedReportType] = useState<string>(
    searchParams.get('type') || 'academic'
  )
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current_month')
  const [selectedClassId, setSelectedClassId] = useState<string>(
    searchParams.get('class_id') || 'all'
  )
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showReportCard, setShowReportCard] = useState(false)
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<{ student: Student; grades: Grade[] } | null>(null)

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const today = new Date()
    let from = new Date()
    let to = new Date()

    switch (selectedPeriod) {
      case 'current_month':
        from = new Date(today.getFullYear(), today.getMonth(), 1)
        to = today
        break
      case 'last_month':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        to = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      case 'current_quarter':
        const quarter = Math.floor(today.getMonth() / 3)
        from = new Date(today.getFullYear(), quarter * 3, 1)
        to = today
        break
      case 'current_year':
        from = new Date(today.getFullYear(), 0, 1)
        to = today
        break
      default:
        from = new Date(today.getFullYear(), today.getMonth(), 1)
        to = today
    }

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0]
    }
  }, [selectedPeriod])

  // Fetch all required data
  const { data: students = [] } = useQuery({
    queryKey: ['students', selectedClassId],
    queryFn: () => studentService.getStudents({
      class_id: selectedClassId !== 'all' ? selectedClassId : undefined,
      limit: 1000
    })
  })

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherService.getTeachers({ limit: 1000 })
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classService.getClasses({ limit: 1000 })
  })

  const { data: grades = [] } = useQuery({
    queryKey: ['grades', selectedClassId, dateRange],
    queryFn: () => gradeService.getGrades({
      class_id: selectedClassId !== 'all' ? selectedClassId : undefined,
      academic_year: new Date().getFullYear().toString(),
      limit: 1000
    })
  })

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance', dateRange.from, dateRange.to, selectedClassId],
    queryFn: () => {
      const studentIds = selectedClassId !== 'all' && students.length > 0
        ? students.map((s: Student) => s.user_id).filter(Boolean)
        : undefined
      
      // Note: API doesn't support multiple user_ids, so we'll fetch all and filter client-side
      return attendanceService.getAttendance({
        date_from: dateRange.from,
        date_to: dateRange.to,
        limit: 1000
      })
    },
    enabled: selectedReportType === 'attendance' || selectedReportType === 'academic'
  })

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', dateRange.from, dateRange.to],
    queryFn: () => financeService.getExpenses({
      date_from: dateRange.from,
      date_to: dateRange.to
    }),
    enabled: selectedReportType === 'financial'
  })

  const { data: donations = [] } = useQuery({
    queryKey: ['donations', dateRange.from, dateRange.to],
    queryFn: () => financeService.getDonations({
      date_from: dateRange.from,
      date_to: dateRange.to
    }),
    enabled: selectedReportType === 'financial'
  })

  // Calculate academic report data
  const academicReportData = useMemo((): AcademicReport => {
    if (!grades.length) {
      return {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        passPercentage: 0,
        failPercentage: 0,
        averageGrade: 'N/A',
        topPerformers: [],
        classWiseStats: []
      }
    }

    const totalGrades = grades.length
    const passingGrades = grades.filter((g: Grade) => Number(g.marks) >= 50).length
    const passPercentage = totalGrades > 0 ? (passingGrades / totalGrades) * 100 : 0
    const failPercentage = 100 - passPercentage

    // Calculate average marks
    const avgMarks = grades.reduce((sum: number, g: Grade) => sum + Number(g.marks), 0) / totalGrades
    const calculateGradeFromMarks = (marks: number): string => {
      if (marks >= 90) return 'A+'
      if (marks >= 80) return 'A'
      if (marks >= 70) return 'B+'
      if (marks >= 60) return 'B'
      if (marks >= 50) return 'C+'
      if (marks >= 40) return 'C'
      if (marks >= 33) return 'D'
      return 'F'
    }

    // Get top performers (students with highest average marks)
    const studentAverages: Record<string, { total: number; count: number; name: string }> = {}
    grades.forEach((g: Grade) => {
      const studentId = g.student_id
      if (!studentAverages[studentId]) {
        const student = students.find((s: Student) => s.id === studentId)
        studentAverages[studentId] = {
          total: 0,
          count: 0,
          name: student?.user?.full_name || 'Unknown'
        }
      }
      studentAverages[studentId].total += Number(g.marks)
      studentAverages[studentId].count += 1
    })

    const topPerformers = Object.entries(studentAverages)
      .map(([id, data]) => ({
        name: data.name,
        percentage: (data.total / data.count),
        grade: calculateGradeFromMarks(data.total / data.count)
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10)

    // Class-wise stats
    const classStats: Record<string, { grades: Grade[]; students: Set<string> }> = {}
    grades.forEach((g: Grade) => {
      const classId = g.class_id
      if (!classStats[classId]) {
        classStats[classId] = { grades: [], students: new Set() }
      }
      classStats[classId].grades.push(g)
      classStats[classId].students.add(g.student_id)
    })

    const classWiseStats = Object.entries(classStats).map(([classId, data]) => {
      const classInfo = classes.find((c: Class) => c.id === classId)
      const className = classInfo ? `${classInfo.name} - ${classInfo.section}` : 'Unknown'
      const classGrades = data.grades
      const classPassing = classGrades.filter((g: Grade) => Number(g.marks) >= 50).length
      const classPassPercentage = classGrades.length > 0
        ? (classPassing / classGrades.length) * 100
        : 0
      const classAvgMarks = classGrades.length > 0
        ? classGrades.reduce((sum: number, g: Grade) => sum + Number(g.marks), 0) / classGrades.length
        : 0

      return {
        className,
        totalStudents: data.students.size,
        passPercentage: Math.round(classPassPercentage * 10) / 10,
        averageGrade: calculateGradeFromMarks(classAvgMarks)
      }
    })

    return {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      passPercentage: Math.round(passPercentage * 10) / 10,
      failPercentage: Math.round(failPercentage * 10) / 10,
      averageGrade: calculateGradeFromMarks(avgMarks),
      topPerformers,
      classWiseStats
    }
  }, [grades, students, teachers, classes])

  // Calculate attendance report data
  const attendanceReportData = useMemo((): AttendanceReport => {
    if (!attendanceRecords.length) {
      return {
        totalDays: 0,
        averageAttendance: 0,
        presentStudents: 0,
        absentStudents: 0,
        classWiseAttendance: [],
        monthlyTrend: []
      }
    }

    // Filter by class if selected
    const filteredAttendance = selectedClassId !== 'all'
      ? attendanceRecords.filter((a: Attendance) => {
          const student = students.find((s: Student) => s.user_id === a.user_id)
          return student?.class_id === selectedClassId
        })
      : attendanceRecords

    const uniqueDates = new Set(filteredAttendance.map((a: Attendance) => a.date.split('T')[0]))
    const presentCount = filteredAttendance.filter((a: Attendance) => a.status === 'present').length
    const absentCount = filteredAttendance.filter((a: Attendance) => a.status === 'absent').length

    const avgAttendance = filteredAttendance.length > 0
      ? (presentCount / filteredAttendance.length) * 100
      : 0

    // Class-wise attendance
    const classAttendance: Record<string, { present: number; absent: number; total: number }> = {}
    filteredAttendance.forEach((a: Attendance) => {
      const student = students.find((s: Student) => s.user_id === a.user_id)
      if (student?.class_id) {
        if (!classAttendance[student.class_id]) {
          classAttendance[student.class_id] = { present: 0, absent: 0, total: 0 }
        }
        classAttendance[student.class_id].total++
        if (a.status === 'present') {
          classAttendance[student.class_id].present++
        } else if (a.status === 'absent') {
          classAttendance[student.class_id].absent++
        }
      }
    })

    const classWiseAttendance = Object.entries(classAttendance).map(([classId, data]) => {
      const classInfo = classes.find((c: Class) => c.id === classId)
      const className = classInfo ? `${classInfo.name} - ${classInfo.section}` : 'Unknown'
      const avgClassAttendance = data.total > 0 ? (data.present / data.total) * 100 : 0

      return {
        className,
        averageAttendance: Math.round(avgClassAttendance * 10) / 10,
        totalPresent: data.present,
        totalAbsent: data.absent
      }
    })

    return {
      totalDays: uniqueDates.size,
      averageAttendance: Math.round(avgAttendance * 10) / 10,
      presentStudents: presentCount,
      absentStudents: absentCount,
      classWiseAttendance,
      monthlyTrend: [] // Can be enhanced with date grouping
    }
  }, [attendanceRecords, students, classes, selectedClassId])

  // Calculate financial report data
  const financialReportData = useMemo((): FinancialReport => {
    const totalExpenses = expenses.reduce((sum: number, e: Expense) => sum + Number(e.amount), 0)
    const totalRevenue = donations.reduce((sum: number, d: Donation) => sum + Number(d.amount), 0)
    const netProfit = totalRevenue - totalExpenses

    // Category-wise expenses
    const categoryExpenses: Record<string, number> = {}
    expenses.forEach((e: Expense) => {
      const category = e.category || 'Others'
      categoryExpenses[category] = (categoryExpenses[category] || 0) + Number(e.amount)
    })

    const categoryWiseExpenses = Object.entries(categoryExpenses).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100 * 10) / 10 : 0
    })).sort((a, b) => b.amount - a.amount)

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      monthlyBreakdown: [], // Can be enhanced with date grouping
      categoryWiseExpenses
    }
  }, [expenses, donations])

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      toast.success('Report generated successfully!')
    }, 1000)
  }

  const handleDownloadReport = (type: string) => {
    // Trigger browser print or PDF download
    window.print()
    toast.success(`${type} report download initiated`)
  }

  const renderAcademicReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{academicReportData.totalStudents}</p>
              </div>
              <Users className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pass Percentage</p>
                <p className="text-3xl font-bold text-green-600">{academicReportData.passPercentage}%</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Grade</p>
                <p className="text-3xl font-bold text-purple-600">{academicReportData.averageGrade}</p>
              </div>
              <Award className="h-12 w-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-3xl font-bold text-orange-600">{academicReportData.totalClasses}</p>
              </div>
              <BookOpen className="h-12 w-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {academicReportData.topPerformers.map((performer, index) => {
              const student = students.find((s: Student) => s.user?.full_name === performer.name)
              const studentGrades = student ? grades.filter((g: Grade) => g.student_id === student.id) : []
              
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{performer.name}</p>
                      <p className="text-sm text-gray-500">Grade: {performer.grade}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-bold text-green-600">{performer.percentage.toFixed(1)}%</p>
                    </div>
                    {student && studentGrades.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStudentForReport({ student, grades: studentGrades })
                          setShowReportCard(true)
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Report Card
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Class-wise Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Class-wise Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-900">Class</th>
                  <th className="text-left p-3 font-medium text-gray-900">Students</th>
                  <th className="text-left p-3 font-medium text-gray-900">Pass %</th>
                  <th className="text-left p-3 font-medium text-gray-900">Avg Grade</th>
                </tr>
              </thead>
              <tbody>
                {academicReportData.classWiseStats.map((stat, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 font-medium">{stat.className}</td>
                    <td className="p-3">{stat.totalStudents}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stat.passPercentage >= 90 ? 'bg-green-100 text-green-800' :
                        stat.passPercentage >= 80 ? 'bg-blue-100 text-blue-800' :
                        stat.passPercentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stat.passPercentage}%
                      </span>
                    </td>
                    <td className="p-3">{stat.averageGrade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAttendanceReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                <p className="text-3xl font-bold text-blue-600">{attendanceReportData.averageAttendance}%</p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present Students</p>
                <p className="text-3xl font-bold text-green-600">{attendanceReportData.presentStudents}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Absent Students</p>
                <p className="text-3xl font-bold text-red-600">{attendanceReportData.absentStudents}</p>
              </div>
              <Clock className="h-12 w-12 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Days</p>
                <p className="text-3xl font-bold text-gray-600">{attendanceReportData.totalDays}</p>
              </div>
              <Calendar className="h-12 w-12 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class-wise Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Class-wise Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendanceReportData.classWiseAttendance.map((attendance, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">{attendance.className}</h4>
                  <span className="text-lg font-bold text-blue-600">{attendance.averageAttendance}%</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Present: {attendance.totalPresent}</span>
                  <span>Absent: {attendance.totalAbsent}</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${attendance.averageAttendance}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderFinancialReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">PKR {financialReportData.totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-3xl font-bold text-red-600">PKR {financialReportData.totalExpenses.toLocaleString()}</p>
              </div>
              <DollarSign className="h-12 w-12 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-3xl font-bold text-blue-600">PKR {financialReportData.netProfit.toLocaleString()}</p>
              </div>
              <Activity className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category-wise Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-600" />
            Category-wise Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {financialReportData.categoryWiseExpenses.map((expense, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">{expense.category}</p>
                    <p className="text-sm text-gray-500">{expense.percentage}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">PKR {expense.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Monthly Financial Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-900">Month</th>
                  <th className="text-left p-3 font-medium text-gray-900">Revenue</th>
                  <th className="text-left p-3 font-medium text-gray-900">Expenses</th>
                  <th className="text-left p-3 font-medium text-gray-900">Profit</th>
                </tr>
              </thead>
              <tbody>
                {financialReportData.monthlyBreakdown.map((month, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 font-medium">{month.month}</td>
                    <td className="p-3 text-green-600">PKR {month.revenue.toLocaleString()}</td>
                    <td className="p-3 text-red-600">PKR {month.expenses.toLocaleString()}</td>
                    <td className="p-3 text-blue-600 font-bold">PKR {month.profit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCurrentReport = () => {
    switch (selectedReportType) {
      case 'academic':
        return renderAcademicReport()
      case 'attendance':
        return renderAttendanceReport()
      case 'financial':
        return renderFinancialReport()
      default:
        return renderAcademicReport()
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin', 'principal']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports - {schoolName}</h1>
            <p className="text-gray-600 mt-1">
              Generate and view comprehensive school reports
              {currentAcademicYear && (
                <span className="ml-2">({currentAcademicYear.year_name})</span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => handleDownloadReport(selectedReportType)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>

        {/* Report Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic Performance</SelectItem>
                    <SelectItem value="attendance">Attendance Report</SelectItem>
                    <SelectItem value="financial">Financial Report</SelectItem>
                    <SelectItem value="inventory">Inventory Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="period">Period</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Current Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="current_quarter">Current Quarter</SelectItem>
                    <SelectItem value="current_year">Current Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="class">Class</Label>
                <Select value={selectedClassId || "all"} onValueChange={(value) => setSelectedClassId(value === "all" ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls: Class) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleGenerateReport} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        <div className="space-y-6">
          {renderCurrentReport()}
        </div>

        {/* Report Card Modal */}
        {showReportCard && selectedStudentForReport && (
          <ReportCardModal
            student={selectedStudentForReport.student}
            grades={selectedStudentForReport.grades}
            classInfo={classes.find((c: Class) => c.id === selectedStudentForReport.student.class_id)}
            term={selectedStudentForReport.grades[0]?.term || 'annual'}
            academicYear={selectedStudentForReport.grades[0]?.academic_year || currentAcademicYear?.year_name || new Date().getFullYear().toString()}
            isOpen={showReportCard}
            onClose={() => {
              setShowReportCard(false)
              setSelectedStudentForReport(null)
            }}
            onExport={handleDownloadReport.bind(null, 'report-card')}
          />
        )}
      </div>
    </DashboardLayout>
  )
}






