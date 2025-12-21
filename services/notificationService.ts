import api from '@/lib/api'
import { Notification } from '@/types'

export interface NotificationCreate {
  user_id: string
  title: string
  body: string
  link?: string
  announcement_id?: string
}

export interface NotificationUpdate {
  title?: string
  body?: string
  link?: string
  read_at?: string
}

export interface NotificationStats {
  total_notifications: number
  unread_count: number
  read_count: number
  notifications_by_type: Record<string, number>
}

export const notificationService = {
  // Get current user's notifications
  async getAll(params?: {
    unread_only?: boolean
    limit?: number
    offset?: number
  }): Promise<Notification[]> {
    const response = await api.get('/notifications', { params })
    return response.data
  },

  // Get all notifications (admin only)
  async getAllForAdmin(params?: {
    user_id?: string
    limit?: number
    offset?: number
  }): Promise<Notification[]> {
    const response = await api.get('/notifications/all', { params })
    return response.data
  },

  // Get notification statistics
  async getStats(): Promise<NotificationStats> {
    const response = await api.get('/notifications/stats')
    return response.data
  },

  // Get a single notification by ID
  async getById(id: string): Promise<Notification> {
    const response = await api.get(`/notifications/${id}`)
    return response.data
  },

  // Create a new notification (admin only)
  async create(data: NotificationCreate): Promise<Notification> {
    const response = await api.post('/notifications', data)
    return response.data
  },

  // Update a notification
  async update(id: string, data: NotificationUpdate): Promise<Notification> {
    const response = await api.put(`/notifications/${id}`, data)
    return response.data
  },

  // Mark notification as read
  async markAsRead(id: string): Promise<Notification> {
    const response = await api.put(`/notifications/${id}/read`)
    return response.data
  },

  // Delete a notification
  async delete(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`)
  },
}









