/**
 * Shared filter logic and utilities
 */

import { Student, Teacher, Class, Grade, Attendance, Expense, Donation } from '@/types'

export interface BaseFilter {
  search?: string
  limit?: number
  offset?: number
}

export interface StudentFilter extends BaseFilter {
  class_id?: string
  status?: 'active' | 'inactive'
  academic_year?: string
}

export interface TeacherFilter extends BaseFilter {
  status?: 'active' | 'inactive'
  subject?: string
}

export interface ClassFilter extends BaseFilter {
  teacher_id?: string
  academic_year?: string
}

export interface GradeFilter extends BaseFilter {
  student_id?: string
  class_id?: string
  subject?: string
  term?: string
  academic_year?: string
  min_marks?: number
  max_marks?: number
}

export interface AttendanceFilter extends BaseFilter {
  user_id?: string
  class_id?: string
  date?: string
  date_from?: string
  date_to?: string
  status?: 'present' | 'absent' | 'late' | 'excused'
}

export interface FinancialFilter extends BaseFilter {
  date_from?: string
  date_to?: string
  category?: string
}

/**
 * Filter students based on criteria
 */
export function filterStudents(students: Student[], filter: StudentFilter): Student[] {
  let filtered = [...students]

  if (filter.search) {
    const searchLower = filter.search.toLowerCase()
    filtered = filtered.filter(s =>
      s.admission_number.toLowerCase().includes(searchLower) ||
      s.user?.full_name?.toLowerCase().includes(searchLower) ||
      s.guardian_info?.name?.toLowerCase().includes(searchLower) ||
      s.user?.email?.toLowerCase().includes(searchLower)
    )
  }

  if (filter.class_id) {
    filtered = filtered.filter(s => s.class_id === filter.class_id)
  }

  if (filter.status) {
    filtered = filtered.filter(s => s.status === filter.status)
  }

  if (filter.academic_year) {
    // If students have academic_year field, filter by it
    // Otherwise, filter by their class's academic_year
    filtered = filtered.filter(s => {
      // This assumes students are linked to classes which have academic_year
      // You may need to join with classes data to filter properly
      return true // Placeholder - implement based on your data structure
    })
  }

  return filtered
}

/**
 * Filter teachers based on criteria
 */
export function filterTeachers(teachers: Teacher[], filter: TeacherFilter): Teacher[] {
  let filtered = [...teachers]

  if (filter.search) {
    const searchLower = filter.search.toLowerCase()
    filtered = filtered.filter(t =>
      t.employee_id.toLowerCase().includes(searchLower) ||
      t.user?.full_name?.toLowerCase().includes(searchLower) ||
      t.user?.email?.toLowerCase().includes(searchLower) ||
      t.qualification.toLowerCase().includes(searchLower) ||
      t.subjects.some(sub => sub.toLowerCase().includes(searchLower))
    )
  }

  if (filter.status) {
    filtered = filtered.filter(t => t.status === filter.status)
  }

  if (filter.subject) {
    filtered = filtered.filter(t => 
      t.subjects.some(sub => sub.toLowerCase() === filter.subject!.toLowerCase())
    )
  }

  return filtered
}

/**
 * Filter classes based on criteria
 */
export function filterClasses(classes: Class[], filter: ClassFilter): Class[] {
  let filtered = [...classes]

  if (filter.search) {
    const searchLower = filter.search.toLowerCase()
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.section.toLowerCase().includes(searchLower) ||
      c.academic_year.toLowerCase().includes(searchLower)
    )
  }

  if (filter.teacher_id) {
    filtered = filtered.filter(c => c.teacher_id === filter.teacher_id)
  }

  if (filter.academic_year) {
    filtered = filtered.filter(c => c.academic_year === filter.academic_year)
  }

  return filtered
}

/**
 * Filter grades based on criteria
 */
export function filterGrades(grades: Grade[], filter: GradeFilter, students?: Student[]): Grade[] {
  let filtered = [...grades]

  if (filter.student_id) {
    filtered = filtered.filter(g => g.student_id === filter.student_id)
  }

  if (filter.class_id && students) {
    const classStudentIds = students
      .filter(s => s.class_id === filter.class_id)
      .map(s => s.id)
    filtered = filtered.filter(g => classStudentIds.includes(g.student_id))
  }

  if (filter.subject) {
    filtered = filtered.filter(g => 
      g.subject.toLowerCase() === filter.subject!.toLowerCase()
    )
  }

  if (filter.term) {
    filtered = filtered.filter(g => g.term === filter.term)
  }

  if (filter.academic_year) {
    filtered = filtered.filter(g => g.academic_year === filter.academic_year)
  }

  if (filter.min_marks !== undefined) {
    filtered = filtered.filter(g => Number(g.marks) >= filter.min_marks!)
  }

  if (filter.max_marks !== undefined) {
    filtered = filtered.filter(g => Number(g.marks) <= filter.max_marks!)
  }

  return filtered
}

/**
 * Filter attendance based on criteria
 */
export function filterAttendance(
  attendance: Attendance[],
  filter: AttendanceFilter,
  students?: Student[]
): Attendance[] {
  let filtered = [...attendance]

  if (filter.user_id) {
    filtered = filtered.filter(a => a.user_id === filter.user_id)
  }

  if (filter.class_id && students) {
    const classUserIds = students
      .filter(s => s.class_id === filter.class_id)
      .map(s => s.user_id)
      .filter(Boolean)
    filtered = filtered.filter(a => classUserIds.includes(a.user_id))
  }

  if (filter.date) {
    filtered = filtered.filter(a => a.date === filter.date)
  }

  if (filter.date_from) {
    filtered = filtered.filter(a => a.date >= filter.date_from!)
  }

  if (filter.date_to) {
    filtered = filtered.filter(a => a.date <= filter.date_to!)
  }

  if (filter.status) {
    filtered = filtered.filter(a => a.status === filter.status)
  }

  return filtered
}

/**
 * Filter expenses based on criteria
 */
export function filterExpenses(expenses: Expense[], filter: FinancialFilter): Expense[] {
  let filtered = [...expenses]

  if (filter.search) {
    const searchLower = filter.search.toLowerCase()
    filtered = filtered.filter(e =>
      e.description?.toLowerCase().includes(searchLower) ||
      e.category?.toLowerCase().includes(searchLower) ||
      e.payment_method?.toLowerCase().includes(searchLower)
    )
  }

  if (filter.date_from) {
    filtered = filtered.filter(e => e.date >= filter.date_from!)
  }

  if (filter.date_to) {
    filtered = filtered.filter(e => e.date <= filter.date_to!)
  }

  if (filter.category) {
    filtered = filtered.filter(e => e.category === filter.category)
  }

  return filtered
}

/**
 * Filter donations based on criteria
 */
export function filterDonations(donations: Donation[], filter: FinancialFilter): Donation[] {
  let filtered = [...donations]

  if (filter.search) {
    const searchLower = filter.search.toLowerCase()
    filtered = filtered.filter(d =>
      d.donor_name?.toLowerCase().includes(searchLower) ||
      d.purpose?.toLowerCase().includes(searchLower) ||
      d.payment_method?.toLowerCase().includes(searchLower)
    )
  }

  if (filter.date_from) {
    filtered = filtered.filter(d => d.date >= filter.date_from!)
  }

  if (filter.date_to) {
    filtered = filtered.filter(d => d.date <= filter.date_to!)
  }

  return filtered
}

/**
 * Build query string from filter object
 */
export function buildFilterQuery(filter: Record<string, any>): string {
  const params = new URLSearchParams()
  
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  
  return params.toString()
}

/**
 * Parse query string to filter object
 */
export function parseFilterQuery(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString)
  const filter: Record<string, string> = {}
  
  params.forEach((value, key) => {
    filter[key] = value
  })
  
  return filter
}

/**
 * Apply pagination to filtered results
 */
export function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  if (!limit) return items
  
  const start = offset || 0
  const end = start + limit
  
  return items.slice(start, end)
}

/**
 * Get date range for common periods
 */
export function getDateRange(period: 'today' | 'this_week' | 'this_month' | 'this_year' | 'last_month'): {
  from: string
  to: string
} {
  const today = new Date()
  let from: Date
  let to: Date = new Date(today)

  switch (period) {
    case 'today':
      from = new Date(today)
      break
    case 'this_week':
      from = new Date(today)
      from.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
      break
    case 'this_month':
      from = new Date(today.getFullYear(), today.getMonth(), 1)
      break
    case 'last_month':
      from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      to = new Date(today.getFullYear(), today.getMonth(), 0)
      break
    case 'this_year':
      from = new Date(today.getFullYear(), 0, 1)
      break
    default:
      from = new Date(today)
  }

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0]
  }
}









