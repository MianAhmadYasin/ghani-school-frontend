import api from '@/lib/api'
import { Student, Grade, Attendance, StationeryDistribution } from '@/types'

export const studentService = {
  async getStudents(params?: {
    class_id?: string
    search?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<Student[]> {
    const response = await api.get<Student[]>('/students', { params })
    return response.data
  },

  async getStudent(id: string): Promise<Student> {
    const response = await api.get<Student>(`/students/${id}`)
    return response.data
  },

  async getMyProfile(): Promise<Student> {
    const response = await api.get<Student>('/students/me/profile')
    return response.data
  },

  async createStudent(data: any): Promise<Student> {
    const response = await api.post<Student>('/students', data)
    return response.data
  },

  async updateStudent(id: string, data: any): Promise<Student> {
    const response = await api.put<Student>(`/students/${id}`, data)
    return response.data
  },

  async deleteStudent(id: string): Promise<void> {
    await api.delete(`/students/${id}`)
  },

  // Student-specific data
  async getMyGrades(params?: {
    term?: string
    academic_year?: string
  }): Promise<Grade[]> {
    const response = await api.get<Grade[]>('/grades/me', { params })
    return response.data
  },

  async getMyAttendance(params?: {
    date_from?: string
    date_to?: string
  }): Promise<Attendance[]> {
    const response = await api.get<Attendance[]>('/attendance/me', { params })
    return response.data
  },

  async getMyStationery(): Promise<StationeryDistribution[]> {
    const response = await api.get<StationeryDistribution[]>(
      '/finance/stationery/distributions/me'
    )
    return response.data
  },
}



















