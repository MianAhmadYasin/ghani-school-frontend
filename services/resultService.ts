import api from '@/lib/api'
import { ExamResult, ResultStatus } from '@/types'

export interface ResultCreate {
  exam_id: string
  student_id: string
  marks_obtained: number
  total_marks: number
  grade?: string
  status?: ResultStatus
  remarks?: string
}

export interface ResultUpdate {
  marks_obtained?: number
  total_marks?: number
  grade?: string
  status?: ResultStatus
  remarks?: string
}

export interface BulkResultEntry {
  student_id?: string
  admission_number?: string
  student_name?: string
  marks_obtained: number
  status?: ResultStatus
  remarks?: string
}

export interface BulkUploadRequest {
  exam_id: string
  results: BulkResultEntry[]
  overwrite_existing?: boolean
}

export interface BulkUploadResponse {
  success_count: number
  error_count: number
  errors: Array<{ row?: number; student_id?: string; error: string }>
  message: string
}

export interface ValidationResponse {
  valid: boolean
  errors: Array<{ row: number; error: string }>
  warnings: Array<{ row: number; warning: string }>
  valid_entries: number
  invalid_entries: number
}

export const resultService = {
  async getResults(params?: {
    exam_id?: string
    class_id?: string
    student_id?: string
    limit?: number
    offset?: number
  }): Promise<ExamResult[]> {
    try {
      const response = await api.get<ExamResult[]>('/results', { params })
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

  async getResult(id: string): Promise<ExamResult> {
    try {
      const response = await api.get<ExamResult>(`/results/${id}`)
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

  async createResult(data: ResultCreate): Promise<ExamResult> {
    try {
      const response = await api.post<ExamResult>('/results', data)
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

  async updateResult(id: string, data: ResultUpdate): Promise<ExamResult> {
    try {
      const response = await api.put<ExamResult>(`/results/${id}`, data)
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

  async deleteResult(id: string): Promise<void> {
    try {
      await api.delete(`/results/${id}`)
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

  async bulkUpload(data: BulkUploadRequest): Promise<BulkUploadResponse> {
    try {
      const response = await api.post<BulkUploadResponse>('/results/bulk-upload', data)
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

  async validateUpload(exam_id: string, file: File): Promise<ValidationResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await api.post<ValidationResponse>(
        `/results/validate-upload?exam_id=${exam_id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
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

  async downloadTemplate(exam_id: string): Promise<Blob> {
    try {
      const response = await api.get(`/results/export-template?exam_id=${exam_id}`, {
        responseType: 'blob',
      })
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







