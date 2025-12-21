/**
 * Navigation utilities for consistent routing across the application
 */

export const navigation = {
  // Student navigation
  student: {
    profile: (studentId: string) => `/admin/students?student_id=${studentId}`,
    grades: (studentId: string, term?: string, year?: string) => {
      const params = new URLSearchParams({ student_id: studentId })
      if (term) params.set('term', term)
      if (year) params.set('year', year)
      return `/admin/grades?${params.toString()}`
    },
    attendance: (studentId: string, date?: string) => {
      const params = new URLSearchParams({ user_id: studentId })
      if (date) params.set('date', date)
      return `/admin/attendance?${params.toString()}`
    },
    reportCard: (studentId: string, classId?: string, term?: string, year?: string) => {
      const params = new URLSearchParams({ student_id: studentId })
      if (classId) params.set('class_id', classId)
      if (term) params.set('term', term)
      if (year) params.set('year', year)
      return `/admin/grades?${params.toString()}&tab=report-cards`
    },
  },

  // Teacher navigation
  teacher: {
    profile: (teacherId: string) => `/admin/teachers?teacher_id=${teacherId}`,
    classes: (teacherId: string) => `/admin/classes?teacher_id=${teacherId}`,
    attendance: (teacherId: string, classId?: string) => {
      const params = new URLSearchParams({ user_id: teacherId })
      if (classId) params.set('class_id', classId)
      return `/admin/attendance?${params.toString()}`
    },
  },

  // Class navigation
  class: {
    detail: (classId: string) => `/admin/classes?class_id=${classId}`,
    students: (classId: string) => `/admin/classes?class_id=${classId}&view=students`,
    attendance: (classId: string, date?: string) => {
      const params = new URLSearchParams({ class_id: classId })
      if (date) params.set('date', date)
      return `/admin/attendance?${params.toString()}`
    },
    grades: (classId: string, term?: string, year?: string) => {
      const params = new URLSearchParams({ class_id: classId })
      if (term) params.set('term', term)
      if (year) params.set('year', year)
      return `/admin/grades?${params.toString()}`
    },
    report: (classId: string, type: 'academic' | 'attendance' = 'academic') => {
      return `/admin/reports?type=${type}&class_id=${classId}`
    },
  },

  // Reports navigation
  reports: {
    academic: (filters?: { class_id?: string; date_from?: string; date_to?: string }) => {
      const params = new URLSearchParams({ type: 'academic' })
      if (filters?.class_id) params.set('class_id', filters.class_id)
      if (filters?.date_from) params.set('date_from', filters.date_from)
      if (filters?.date_to) params.set('date_to', filters.date_to)
      return `/admin/reports?${params.toString()}`
    },
    attendance: (filters?: { class_id?: string; date_from?: string; date_to?: string }) => {
      const params = new URLSearchParams({ type: 'attendance' })
      if (filters?.class_id) params.set('class_id', filters.class_id)
      if (filters?.date_from) params.set('date_from', filters.date_from)
      if (filters?.date_to) params.set('date_to', filters.date_to)
      return `/admin/reports?${params.toString()}`
    },
    financial: (filters?: { date_from?: string; date_to?: string }) => {
      const params = new URLSearchParams({ type: 'financial' })
      if (filters?.date_from) params.set('date_from', filters.date_from)
      if (filters?.date_to) params.set('date_to', filters.date_to)
      return `/admin/reports?${params.toString()}`
    },
    teacher: (teacherId: string, type: 'academic' | 'attendance' = 'academic') => {
      return `/admin/reports?type=${type}&teacher_id=${teacherId}`
    },
  },
}

/**
 * Helper to build query string from object
 */
export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  return searchParams.toString()
}

/**
 * Helper to get query params from URL
 */
export function getQueryParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}









