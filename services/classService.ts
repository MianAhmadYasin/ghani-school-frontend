import api from '@/lib/api'
import { Class, Student } from '@/types'

export const classService = {
  async getClasses(params?: {
    academic_year?: string
    teacher_id?: string
    limit?: number
    offset?: number
  }): Promise<Class[]> {
    const response = await api.get<Class[]>('/classes', { params })
    return response.data
  },

  async getClass(id: string): Promise<Class> {
    const response = await api.get<Class>(`/classes/${id}`)
    return response.data
  },

  async getClassStudents(id: string): Promise<Student[]> {
    const response = await api.get<Student[]>(`/classes/${id}/students`)
    return response.data
  },

  async createClass(data: {
    name: string
    section: string
    teacher_id?: string
    academic_year: string
  }): Promise<Class> {
    const response = await api.post<Class>('/classes', data)
    return response.data
  },

  async updateClass(id: string, data: any): Promise<Class> {
    const response = await api.put<Class>(`/classes/${id}`, data)
    return response.data
  },

  async assignTeacher(classId: string, teacherId: string): Promise<void> {
    await api.post(`/classes/${classId}/assign-teacher`, {
      teacher_id: teacherId,
    })
  },

  async addStudents(classId: string, studentIds: string[]): Promise<void> {
    await api.post(`/classes/${classId}/add-students`, {
      student_ids: studentIds,
    })
  },

  async removeStudent(classId: string, studentId: string): Promise<void> {
    await api.post(`/classes/${classId}/remove-student`, {
      student_id: studentId,
    })
  },

  async deleteClass(id: string): Promise<void> {
    await api.delete(`/classes/${id}`)
  },
}



