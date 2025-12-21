import api from '@/lib/api'
import { Timetable, TimetableEntry } from '@/types'

export interface TimetableCreate {
  class_id: string
  period_duration_minutes: number
  break_duration_minutes: number
  total_periods_per_day: number
  working_days: number[]
  start_time: string
  status?: 'draft' | 'final'
}

export interface TimetableUpdate {
  class_id?: string
  period_duration_minutes?: number
  break_duration_minutes?: number
  total_periods_per_day?: number
  working_days?: number[]
  start_time?: string
  status?: 'draft' | 'final'
}

export interface TimetableEntryCreate {
  timetable_id: string
  day_of_week: number
  period_number: number
  is_break?: boolean
  subject?: string
  teacher_id?: string
  class_id?: string
  start_time?: string
  end_time?: string
}

export interface TimetableEntryUpdate {
  day_of_week?: number
  period_number?: number
  is_break?: boolean
  subject?: string
  teacher_id?: string
  class_id?: string
  start_time?: string
  end_time?: string
}

export const timetableService = {
  // Get all timetables with optional filters
  async getAll(params?: {
    class_id?: string
    teacher_id?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<Timetable[]> {
    const response = await api.get('/timetables', { params })
    return response.data
  },

  // Get timetable for a specific class
  async getByClass(classId: string): Promise<Timetable> {
    const response = await api.get(`/timetables/class/${classId}`)
    return response.data
  },

  // Get timetables for a teacher
  async getByTeacher(teacherId: string): Promise<Timetable[]> {
    const response = await api.get(`/timetables/teacher/${teacherId}`)
    return response.data
  },

  // Get a single timetable by ID
  async getById(id: string): Promise<Timetable> {
    const response = await api.get(`/timetables/${id}`)
    return response.data
  },

  // Create a new timetable
  async create(data: TimetableCreate): Promise<Timetable> {
    const response = await api.post('/timetables', data)
    return response.data
  },

  // Update a timetable
  async update(id: string, data: TimetableUpdate): Promise<Timetable> {
    const response = await api.put(`/timetables/${id}`, data)
    return response.data
  },

  // Delete a timetable
  async delete(id: string): Promise<void> {
    await api.delete(`/timetables/${id}`)
  },

  // Get entries for a timetable
  async getEntries(timetableId: string, params?: {
    day_of_week?: number
  }): Promise<TimetableEntry[]> {
    const response = await api.get(`/timetables/${timetableId}/entries`, { params })
    return response.data
  },

  // Create a timetable entry
  async createEntry(timetableId: string, data: TimetableEntryCreate): Promise<TimetableEntry> {
    const entryData = { ...data, timetable_id: timetableId }
    const response = await api.post(`/timetables/${timetableId}/entries`, entryData)
    return response.data
  },

  // Update a timetable entry
  async updateEntry(entryId: string, data: TimetableEntryUpdate): Promise<TimetableEntry> {
    const response = await api.put(`/timetables/entries/${entryId}`, data)
    return response.data
  },

  // Delete a timetable entry
  async deleteEntry(entryId: string): Promise<void> {
    await api.delete(`/timetables/entries/${entryId}`)
  },
}









