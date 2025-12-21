import api from '@/lib/api'
import { Syllabus } from '@/types'

export interface SyllabusCreate {
  class_id: string
  class_name: string
  subject: string
  term: 'first_term' | 'second_term' | 'third_term' | 'annual'
  year: number
  file_url: string
  file_name: string
  file_type: string
  file_size?: number
}

export interface SyllabusUpdate {
  class_id?: string
  class_name?: string
  subject?: string
  term?: 'first_term' | 'second_term' | 'third_term' | 'annual'
  year?: number
  file_url?: string
  file_name?: string
  file_type?: string
  file_size?: number
}

export interface SyllabusStats {
  total_syllabuses: number
  syllabuses_by_term: Record<string, number>
  syllabuses_by_class: Record<string, number>
  syllabuses_by_subject: Record<string, number>
  recent_uploads: number
}

export const syllabusService = {
  // Get all syllabuses with optional filters
  async getAll(params?: {
    class_id?: string
    subject?: string
    term?: string
    year?: number
    limit?: number
    offset?: number
  }): Promise<Syllabus[]> {
    const response = await api.get('/syllabuses', { params })
    return response.data
  },

  // Get syllabuses for a specific class
  async getByClass(classId: string): Promise<Syllabus[]> {
    const response = await api.get(`/syllabuses/class/${classId}`)
    return response.data
  },

  // Get a single syllabus by ID
  async getById(id: string): Promise<Syllabus> {
    const response = await api.get(`/syllabuses/${id}`)
    return response.data
  },

  // Create a new syllabus
  async create(data: SyllabusCreate): Promise<Syllabus> {
    const response = await api.post('/syllabuses', data)
    return response.data
  },

  // Update a syllabus
  async update(id: string, data: SyllabusUpdate): Promise<Syllabus> {
    const response = await api.put(`/syllabuses/${id}`, data)
    return response.data
  },

  // Delete a syllabus
  async delete(id: string): Promise<void> {
    await api.delete(`/syllabuses/${id}`)
  },

  // Get syllabus statistics
  async getStats(): Promise<SyllabusStats> {
    const response = await api.get('/syllabuses/stats/overview')
    return response.data
  },
}









