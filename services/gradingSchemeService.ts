import api from '@/lib/api'

export interface GradingCriterion {
  id?: string
  grade_name: string
  min_marks: number
  max_marks: number
  gpa_value: number
  is_passing: boolean
  display_order: number
}

export interface GradingScheme {
  id: string
  name: string
  description?: string
  is_active: boolean
  is_default: boolean
  criteria: GradingCriterion[]
  created_at: string
  updated_at?: string
}

export const gradingSchemeService = {
  async getGradingSchemes(params?: {
    is_active?: boolean
    include_default?: boolean
  }): Promise<GradingScheme[]> {
    try {
      const response = await api.get<GradingScheme[]>('/grading-schemes', { params })
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

  async getDefaultGradingScheme(): Promise<GradingScheme> {
    try {
      const response = await api.get<GradingScheme>('/grading-schemes/default')
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

  async getGradingScheme(id: string): Promise<GradingScheme> {
    try {
      const response = await api.get<GradingScheme>(`/grading-schemes/${id}`)
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

  async createGradingScheme(data: {
    name: string
    description?: string
    is_active?: boolean
    is_default?: boolean
    criteria: Omit<GradingCriterion, 'id'>[]
  }): Promise<GradingScheme> {
    try {
      const response = await api.post<GradingScheme>('/grading-schemes', data)
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

  async updateGradingScheme(
    id: string,
    data: {
      name?: string
      description?: string
      is_active?: boolean
      is_default?: boolean
    }
  ): Promise<GradingScheme> {
    try {
      const response = await api.put<GradingScheme>(`/grading-schemes/${id}`, data)
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

  async updateGradingSchemeCriteria(
    id: string,
    criteria: Omit<GradingCriterion, 'id'>[]
  ): Promise<GradingScheme> {
    try {
      const response = await api.put<GradingScheme>(`/grading-schemes/${id}/criteria`, {
        scheme_id: id,
        criteria
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

  async deleteGradingScheme(id: string): Promise<void> {
    try {
      await api.delete(`/grading-schemes/${id}`)
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








