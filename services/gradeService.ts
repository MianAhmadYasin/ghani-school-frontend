import api from '@/lib/api'
import { Grade } from '@/types'

export const gradeService = {
  async getGrades(params?: {
    student_id?: string
    class_id?: string
    subject?: string
    term?: string
    academic_year?: string
    limit?: number
    offset?: number
  }): Promise<Grade[]> {
    try {
      // Normalize term: 'Final' -> 'Annual' for API
      const apiParams = params ? {
        ...params,
        term: params.term === 'Final' ? 'Annual' : params.term
      } : undefined
      
      const response = await api.get<Grade[]>('/grades', { params: apiParams })
      
      // Normalize term back to 'Final' for display if needed
      return response.data.map(grade => ({
        ...grade,
        term: grade.term === 'Annual' ? 'Final' : grade.term
      }))
    } catch (error: any) {
      if (error.response) {
        const data = error.response.data
        const detail = data?.message || data?.detail || (data?.error ? data.message : null)
        if (detail) {
          error.message = detail
        }
      }
      throw error
    }
  },

  async getGrade(id: string): Promise<Grade> {
    try {
      const response = await api.get<Grade>(`/grades/${id}`)
      // Normalize term back to 'Final' for display if needed
      return {
        ...response.data,
        term: response.data.term === 'Annual' ? 'Final' : response.data.term
      }
    } catch (error: any) {
      if (error.response) {
        const data = error.response.data
        const detail = data?.message || data?.detail || (data?.error ? data.message : null)
        if (detail) {
          error.message = detail
        }
      }
      throw error
    }
  },

  async createGrade(data: {
    student_id: string
    class_id: string
    subject: string
    marks: number
    grade?: string // Optional - backend will auto-calculate if not provided
    term: string
    academic_year: string
    remarks?: string
  }): Promise<Grade> {
    try {
      // Normalize term: 'Final' -> 'Annual' for API
      const apiData = {
        ...data,
        term: data.term === 'Final' ? 'Annual' : data.term,
        // Don't send grade - backend will auto-calculate
        grade: undefined
      }
      
      const response = await api.post<Grade>('/grades', apiData)
      
      // Normalize term back to 'Final' for display
      return {
        ...response.data,
        term: response.data.term === 'Annual' ? 'Final' : response.data.term
      }
    } catch (error: any) {
      // Enhance error message for better debugging
      if (error.response) {
        const data = error.response.data
        const detail = data?.message || data?.detail || (data?.error ? data.message : null)
        if (detail) {
          error.message = detail
        }
      }
      throw error
    }
  },

  async createBulkGrades(grades: Array<{
    student_id: string
    class_id: string
    subject: string
    marks: number
    grade?: string // Optional - backend will auto-calculate if not provided
    term: string
    academic_year: string
    remarks?: string
  }>): Promise<{ message: string; grades: Grade[]; success_count: number; total_count: number; errors?: string[] }> {
    try {
      // Normalize terms: 'Final' -> 'Annual' for all grades
      const normalizedGrades = grades.map(grade => ({
        ...grade,
        term: grade.term === 'Final' ? 'Annual' : grade.term,
        // Don't send grade - backend will auto-calculate
        grade: undefined
      }))
      
      const response = await api.post('/grades/bulk', { grades: normalizedGrades })
      
      // Normalize terms back to 'Final' for display
      const result = response.data
      if (result.grades) {
        result.grades = result.grades.map((grade: Grade) => ({
          ...grade,
          term: grade.term === 'Annual' ? 'Final' : grade.term
        }))
      }
      
      return result
    } catch (error: any) {
      if (error.response) {
        const data = error.response.data
        const detail = data?.message || data?.detail || (data?.error ? data.message : null)
        if (detail) {
          error.message = detail
        }
      }
      throw error
    }
  },

  async updateGrade(id: string, data: {
    marks?: number
    grade?: string // Optional - backend will auto-recalculate if marks are updated
    remarks?: string
  }): Promise<Grade> {
    try {
      const response = await api.put<Grade>(`/grades/${id}`, data)
      // Normalize term back to 'Final' for display if needed
      return {
        ...response.data,
        term: response.data.term === 'Annual' ? 'Final' : response.data.term
      }
    } catch (error: any) {
      if (error.response) {
        const data = error.response.data
        const detail = data?.message || data?.detail || (data?.error ? data.message : null)
        if (detail) {
          error.message = detail
        }
      }
      throw error
    }
  },

  async deleteGrade(id: string): Promise<void> {
    try {
      await api.delete(`/grades/${id}`)
    } catch (error: any) {
      if (error.response) {
        const data = error.response.data
        const detail = data?.message || data?.detail || (data?.error ? data.message : null)
        if (detail) {
          error.message = detail
        }
      }
      throw error
    }
  },

  async getPositions(params: {
    class_id: string
    term: string
    academic_year: string
    top_n?: number
  }): Promise<{
    class_id: string
    class_name: string
    term: string
    academic_year: string
    positions: Array<{
      student_id: string
      student_name: string
      admission_number: string
      position: number
      average_marks: number
      total_marks: number
      total_subjects: number
      passed_subjects: number
    }>
    class_average: number
  }> {
    try {
      // Normalize term: 'Final' -> 'Annual' for API
      const apiParams = {
        ...params,
        term: params.term === 'Final' ? 'Annual' : params.term
      }
      
      const response = await api.get('/grades/positions', { params: apiParams })
      
      // Normalize term back to 'Final' for display if needed
      return {
        ...response.data,
        term: response.data.term === 'Annual' ? 'Final' : response.data.term
      }
    } catch (error: any) {
      if (error.response) {
        const data = error.response.data
        const detail = data?.message || data?.detail || (data?.error ? data.message : null)
        if (detail) {
          error.message = detail
        }
      }
      throw error
    }
  },
}












