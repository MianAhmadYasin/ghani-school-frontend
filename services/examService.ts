import api from '@/lib/api'
import { Exam, ExamType, ExamStatus } from '@/types'

export interface ExamCreate {
  exam_name: string
  exam_type: ExamType
  term: string
  academic_year: string
  class_id: string
  subject: string
  total_marks: number
  passing_marks: number
  exam_date?: string
  duration_minutes?: number
  instructions?: string
}

export interface ExamUpdate {
  exam_name?: string
  exam_type?: ExamType
  term?: string
  academic_year?: string
  class_id?: string
  subject?: string
  total_marks?: number
  passing_marks?: number
  exam_date?: string
  duration_minutes?: number
  instructions?: string
  status?: ExamStatus
}

export const examService = {
  async getExams(params?: {
    class_id?: string
    subject?: string
    term?: string
    academic_year?: string
    exam_type?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<Exam[]> {
    try {
      const response = await api.get<Exam[]>('/exams', { params })
      return response.data
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

  async getExam(id: string): Promise<Exam> {
    try {
      const response = await api.get<Exam>(`/exams/${id}`)
      return response.data
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

  async createExam(data: ExamCreate): Promise<Exam> {
    try {
      const response = await api.post<Exam>('/exams', data)
      return response.data
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

  async updateExam(id: string, data: ExamUpdate): Promise<Exam> {
    try {
      const response = await api.put<Exam>(`/exams/${id}`, data)
      return response.data
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

  async deleteExam(id: string): Promise<void> {
    try {
      await api.delete(`/exams/${id}`)
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

  async getPendingApprovals(): Promise<{ papers: any[]; count: number }> {
    try {
      const response = await api.get('/exams/pending-approval/list')
      return response.data
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







