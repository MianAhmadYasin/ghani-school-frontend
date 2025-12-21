import api from '@/lib/api'

export interface Event {
  id: string
  title: string
  description?: string
  date: string
  time?: string
  location?: string
  type: 'academic' | 'sports' | 'cultural' | 'meeting' | 'other'
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
  updated_at: string
}

export interface EventStats {
  total_events: number
  upcoming_events: number
  ongoing_events: number
  completed_events: number
  events_by_type: Record<string, number>
  events_this_month: number
}

export const eventService = {
  async getEvents(params?: {
    type?: string
    status?: string
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
  }): Promise<Event[]> {
    const response = await api.get<Event[]>('/events', { params })
    return response.data
  },

  async getEvent(id: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`)
    return response.data
  },

  async getEventStats(): Promise<EventStats> {
    const response = await api.get<EventStats>('/events/stats')
    return response.data
  },

  async createEvent(data: {
    title: string
    description?: string
    date: string
    time?: string
    location?: string
    type: string
    status?: string
  }): Promise<Event> {
    const response = await api.post<Event>('/events', data)
    return response.data
  },

  async updateEvent(id: string, data: {
    title?: string
    description?: string
    date?: string
    time?: string
    location?: string
    type?: string
    status?: string
  }): Promise<Event> {
    const response = await api.put<Event>(`/events/${id}`, data)
    return response.data
  },

  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/events/${id}`)
  },
}













