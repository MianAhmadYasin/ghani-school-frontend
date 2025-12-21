import api from '@/lib/api'
import { Teacher, Class, Student } from '@/types'

export const teacherService = {
  async getTeachers(params?: {
    search?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<Teacher[]> {
    const response = await api.get<Teacher[]>('/teachers', { params })
    return response.data
  },

  async getTeacher(id: string): Promise<Teacher> {
    const response = await api.get<Teacher>(`/teachers/${id}`)
    return response.data
  },

  async getMyProfile(): Promise<Teacher> {
    const response = await api.get<Teacher>('/teachers/me/profile')
    return response.data
  },

  async getMyClasses(): Promise<Class[]> {
    const response = await api.get<Class[]>('/teachers/me/classes')
    return response.data
  },

  async createTeacher(data: any): Promise<Teacher> {
    const response = await api.post<Teacher>('/teachers', data)
    return response.data
  },

  async updateTeacher(id: string, data: any): Promise<Teacher> {
    const response = await api.put<Teacher>(`/teachers/${id}`, data)
    return response.data
  },

  async deleteTeacher(id: string): Promise<void> {
    await api.delete(`/teachers/${id}`)
  },
}



















