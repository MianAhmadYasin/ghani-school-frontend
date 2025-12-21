import api from '@/lib/api'
import { Attendance, AttendanceStatus } from '@/types'

export const attendanceService = {
  async getAttendance(params?: {
    user_id?: string
    date_from?: string
    date_to?: string
    status?: AttendanceStatus
    limit?: number
    offset?: number
  }): Promise<Attendance[]> {
    const response = await api.get<Attendance[]>('/attendance', { params })
    return response.data
  },

  async getAttendanceRecord(id: string): Promise<Attendance> {
    const response = await api.get<Attendance>(`/attendance/${id}`)
    return response.data
  },

  async markAttendance(data: {
    user_id: string
    date: string
    status: AttendanceStatus
    remarks?: string
  }): Promise<Attendance> {
    try {
      // Validate date is not in the future
      const attendanceDate = new Date(data.date)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today
      
      if (attendanceDate > today) {
        throw new Error('Attendance date cannot be in the future')
      }
      
      const response = await api.post<Attendance>('/attendance', data)
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

  async markBulkAttendance(attendances: Array<{
    user_id: string
    date: string
    status: AttendanceStatus
    remarks?: string
  }>): Promise<{ message: string; records: Attendance[]; success_count: number; total_count: number; errors?: string[] }> {
    try {
      // Validate all dates are not in the future
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      
      for (const att of attendances) {
        const attendanceDate = new Date(att.date)
        if (attendanceDate > today) {
          throw new Error(`Attendance date ${att.date} cannot be in the future`)
        }
      }
      
      const response = await api.post('/attendance/bulk', { attendances })
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

  async updateAttendance(id: string, data: {
    status?: AttendanceStatus
    remarks?: string
  }): Promise<Attendance> {
    try {
      const response = await api.put<Attendance>(`/attendance/${id}`, data)
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

  async deleteAttendance(id: string): Promise<void> {
    try {
      await api.delete(`/attendance/${id}`)
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
  
  async getAttendanceStatistics(user_id: string, params?: {
    date_from?: string
    date_to?: string
  }): Promise<{
    user_id: string
    date_from?: string
    date_to?: string
    total_records: number
    present: number
    absent: number
    late: number
    excused: number
    attendance_percentage: number
  }> {
    try {
      const response = await api.get(`/attendance/stats/${user_id}`, { params })
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
  
  async getClassAttendanceStatistics(class_id: string, params?: {
    date_from?: string
    date_to?: string
  }): Promise<{
    class_id: string
    total_students: number
    date_from?: string
    date_to?: string
    statistics: Array<{
      user_id: string
      present: number
      absent: number
      late: number
      excused: number
      total: number
      attendance_percentage: number
    }>
  }> {
    try {
      const response = await api.get(`/attendance/stats/class/${class_id}`, { params })
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












