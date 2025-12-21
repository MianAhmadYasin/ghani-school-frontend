import api from '@/lib/api'

export interface AcademicReport {
  total_students: number
  total_teachers: number
  total_classes: number
  pass_percentage: number
  fail_percentage: number
  average_grade: string
  top_performers: Array<{
    student_id: string
    name: string
    admission_number: string
    average_marks: number
    grade: string
  }>
  class_wise_stats: Array<{
    class_id: string
    class_name: string
    total_students: number
    passed: number
    failed: number
    pass_percentage: number
    average_marks: number
  }>
}

export interface AttendanceReport {
  total_records: number
  present: number
  absent: number
  late: number
  excused: number
  present_percentage: number
  absent_percentage: number
  late_percentage: number
  daily_trend: Array<{
    date: string
    present: number
    absent: number
    late: number
    excused: number
    total: number
  }>
  class_stats: Array<{
    class_id: string
    class_name: string
    total_students: number
    average_attendance: number
  }>
}

export interface FinancialReport {
  total_expenses: number
  total_donations: number
  total_salaries: number
  net_income: number
  expense_by_category: Record<string, number>
  monthly_breakdown: Array<{
    month: string
    expenses: number
    donations: number
    salaries: number
    net: number
  }>
}

export const reportService = {
  // Get academic report
  async getAcademicReport(params?: {
    class_id?: string
    term?: string
    academic_year?: string
  }): Promise<AcademicReport> {
    const response = await api.get('/reports/academic', { params })
    return response.data
  },

  // Get attendance report
  async getAttendanceReport(params?: {
    class_id?: string
    date_from?: string
    date_to?: string
  }): Promise<AttendanceReport> {
    const response = await api.get('/reports/attendance', { params })
    return response.data
  },

  // Get financial report
  async getFinancialReport(params?: {
    date_from?: string
    date_to?: string
  }): Promise<FinancialReport> {
    const response = await api.get('/reports/financial', { params })
    return response.data
  },
}








