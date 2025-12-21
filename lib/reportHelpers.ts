/**
 * Report generation and formatting utilities
 */

import { Grade, Attendance, Expense, Donation, Student, Class } from '@/types'

export interface ReportFilters {
  class_id?: string
  date_from?: string
  date_to?: string
  term?: string
  academic_year?: string
  student_id?: string
  teacher_id?: string
}

export interface AcademicStats {
  totalStudents: number
  totalGrades: number
  passingGrades: number
  failingGrades: number
  averageGrade: number
  passRate: number
  topPerformers: Array<{
    name: string
    percentage: number
    grade: string
  }>
  classStats: Array<{
    className: string
    averageGrade: number
    passRate: number
    totalStudents: number
  }>
}

export interface AttendanceStats {
  totalRecords: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: number
  classStats: Array<{
    className: string
    attendanceRate: number
    present: number
    absent: number
  }>
  trends: Array<{
    date: string
    present: number
    absent: number
    rate: number
  }>
}

export interface FinancialStats {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  categories: Array<{
    category: string
    amount: number
    percentage: number
  }>
}

/**
 * Calculate academic statistics from grades data
 */
export function calculateAcademicStats(
  grades: Grade[],
  students: Student[],
  classes: Class[],
  filters?: ReportFilters
): AcademicStats {
  // Apply filters
  let filteredGrades = grades
  if (filters?.class_id) {
    const classStudents = students.filter(s => s.class_id === filters.class_id)
    const studentIds = classStudents.map(s => s.id)
    filteredGrades = grades.filter(g => studentIds.includes(g.student_id))
  }
  if (filters?.student_id) {
    filteredGrades = grades.filter(g => g.student_id === filters.student_id)
  }

  // Calculate basic stats
  const totalGrades = filteredGrades.length
  const passingGrades = filteredGrades.filter(g => Number(g.marks) >= 50).length
  const failingGrades = totalGrades - passingGrades
  const averageGrade = totalGrades > 0
    ? filteredGrades.reduce((sum, g) => sum + Number(g.marks), 0) / totalGrades
    : 0
  const passRate = totalGrades > 0 ? (passingGrades / totalGrades) * 100 : 0

  // Calculate top performers
  const studentAverages = new Map<string, { total: number; count: number }>()
  filteredGrades.forEach(grade => {
    const existing = studentAverages.get(grade.student_id) || { total: 0, count: 0 }
    studentAverages.set(grade.student_id, {
      total: existing.total + Number(grade.marks),
      count: existing.count + 1
    })
  })

  const topPerformers = Array.from(studentAverages.entries())
    .map(([studentId, data]) => {
      const student = students.find(s => s.id === studentId)
      const average = data.count > 0 ? data.total / data.count : 0
      return {
        name: student?.user?.full_name || 'Unknown',
        percentage: average,
        grade: calculateGradeFromMarks(average)
      }
    })
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10)

  // Calculate class statistics
  const classStats = classes.map(cls => {
    const classStudents = students.filter(s => s.class_id === cls.id)
    const classGrades = filteredGrades.filter(g => 
      classStudents.some(s => s.id === g.student_id)
    )
    const classAverage = classGrades.length > 0
      ? classGrades.reduce((sum, g) => sum + Number(g.marks), 0) / classGrades.length
      : 0
    const classPassing = classGrades.filter(g => Number(g.marks) >= 50).length
    const classPassRate = classGrades.length > 0 ? (classPassing / classGrades.length) * 100 : 0

    return {
      className: `${cls.name} - ${cls.section}`,
      averageGrade: classAverage,
      passRate: classPassRate,
      totalStudents: classStudents.length
    }
  }).filter(cs => cs.totalStudents > 0)

  // Get unique students who have grades
  const studentsWithGrades = new Set(filteredGrades.map(g => g.student_id))
  const totalStudents = filters?.student_id ? 1 : studentsWithGrades.size

  return {
    totalStudents,
    totalGrades,
    passingGrades,
    failingGrades,
    averageGrade,
    passRate,
    topPerformers,
    classStats
  }
}

/**
 * Calculate attendance statistics
 */
export function calculateAttendanceStats(
  attendance: Attendance[],
  students: Student[],
  classes: Class[],
  filters?: ReportFilters
): AttendanceStats {
  // Apply filters
  let filteredAttendance = attendance
  if (filters?.date_from) {
    filteredAttendance = filteredAttendance.filter(a => a.date >= filters.date_from!)
  }
  if (filters?.date_to) {
    filteredAttendance = filteredAttendance.filter(a => a.date <= filters.date_to!)
  }
  if (filters?.class_id) {
    const classStudents = students.filter(s => s.class_id === filters.class_id)
    const userIds = classStudents.map(s => s.user_id).filter(Boolean)
    filteredAttendance = filteredAttendance.filter(a => userIds.includes(a.user_id))
  }
  if (filters?.student_id) {
    const student = students.find(s => s.id === filters.student_id)
    if (student?.user_id) {
      filteredAttendance = filteredAttendance.filter(a => a.user_id === student.user_id)
    }
  }

  // Calculate basic stats
  const totalRecords = filteredAttendance.length
  const present = filteredAttendance.filter(a => a.status === 'present').length
  const absent = filteredAttendance.filter(a => a.status === 'absent').length
  const late = filteredAttendance.filter(a => a.status === 'late').length
  const excused = filteredAttendance.filter(a => a.status === 'excused').length
  const attendanceRate = totalRecords > 0 ? (present / totalRecords) * 100 : 0

  // Calculate class statistics
  const classStats = classes.map(cls => {
    const classStudents = students.filter(s => s.class_id === cls.id)
    const userIds = classStudents.map(s => s.user_id).filter(Boolean)
    const classAttendance = filteredAttendance.filter(a => userIds.includes(a.user_id))
    const classPresent = classAttendance.filter(a => a.status === 'present').length
    const classAbsent = classAttendance.filter(a => a.status === 'absent').length
    const classRate = classAttendance.length > 0 ? (classPresent / classAttendance.length) * 100 : 0

    return {
      className: `${cls.name} - ${cls.section}`,
      attendanceRate: classRate,
      present: classPresent,
      absent: classAbsent
    }
  }).filter(cs => cs.present + cs.absent > 0)

  // Calculate trends (by date)
  const trendsMap = new Map<string, { present: number; absent: number; total: number }>()
  filteredAttendance.forEach(record => {
    const existing = trendsMap.get(record.date) || { present: 0, absent: 0, total: 0 }
    if (record.status === 'present') existing.present++
    if (record.status === 'absent') existing.absent++
    existing.total++
    trendsMap.set(record.date, existing)
  })

  const trends = Array.from(trendsMap.entries())
    .map(([date, data]) => ({
      date,
      present: data.present,
      absent: data.absent,
      rate: data.total > 0 ? (data.present / data.total) * 100 : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalRecords,
    present,
    absent,
    late,
    excused,
    attendanceRate,
    classStats,
    trends
  }
}

/**
 * Calculate financial statistics
 */
export function calculateFinancialStats(
  expenses: Expense[],
  donations: Donation[],
  filters?: ReportFilters
): FinancialStats {
  // Apply date filters
  let filteredExpenses = expenses
  let filteredDonations = donations

  if (filters?.date_from) {
    filteredExpenses = filteredExpenses.filter(e => e.date >= filters.date_from!)
    filteredDonations = filteredDonations.filter(d => d.date >= filters.date_from!)
  }
  if (filters?.date_to) {
    filteredExpenses = filteredExpenses.filter(e => e.date <= filters.date_to!)
    filteredDonations = filteredDonations.filter(d => d.date <= filters.date_to!)
  }

  // Calculate totals
  const totalIncome = filteredDonations.reduce((sum, d) => sum + Number(d.amount), 0)
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const netBalance = totalIncome - totalExpenses

  // Calculate monthly stats (current month)
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyExpenses = filteredExpenses
    .filter(e => {
      const expenseDate = new Date(e.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })
    .reduce((sum, e) => sum + Number(e.amount), 0)
  const monthlyIncome = filteredDonations
    .filter(d => {
      const donationDate = new Date(d.date)
      return donationDate.getMonth() === currentMonth && donationDate.getFullYear() === currentYear
    })
    .reduce((sum, d) => sum + Number(d.amount), 0)

  // Calculate category breakdown for expenses
  const categoryMap = new Map<string, number>()
  filteredExpenses.forEach(expense => {
    const category = expense.category || 'Other'
    const existing = categoryMap.get(category) || 0
    categoryMap.set(category, existing + Number(expense.amount))
  })

  const categories = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    monthlyIncome,
    monthlyExpenses,
    categories
  }
}

/**
 * Calculate grade from marks
 */
export function calculateGradeFromMarks(marks: number): string {
  if (marks >= 90) return 'A+'
  if (marks >= 80) return 'A'
  if (marks >= 70) return 'B+'
  if (marks >= 60) return 'B'
  if (marks >= 50) return 'C+'
  if (marks >= 40) return 'C'
  if (marks >= 33) return 'D'
  return 'F'
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'PKR'): string {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Generate report title based on filters
 */
export function generateReportTitle(type: 'academic' | 'attendance' | 'financial', filters?: ReportFilters): string {
  let title = type.charAt(0).toUpperCase() + type.slice(1) + ' Report'
  
  if (filters?.class_id) {
    title += ' - Class'
  }
  if (filters?.student_id) {
    title += ' - Student'
  }
  if (filters?.teacher_id) {
    title += ' - Teacher'
  }
  if (filters?.date_from && filters?.date_to) {
    title += ` (${filters.date_from} to ${filters.date_to})`
  } else if (filters?.date_from) {
    title += ` (from ${filters.date_from})`
  }
  
  return title
}









