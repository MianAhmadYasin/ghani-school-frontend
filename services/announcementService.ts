import api from '@/lib/api';

export type TargetAudience = 'all' | 'students' | 'teachers' | 'parents' | 'staff';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_audience: TargetAudience;
  priority: Priority;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementCreate {
  title: string;
  content: string;
  target_audience: TargetAudience;
  priority: Priority;
  start_date: string;
  end_date?: string;
  is_active?: boolean;
}

export interface AnnouncementUpdate {
  title?: string;
  content?: string;
  target_audience?: TargetAudience;
  priority?: Priority;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export const announcementService = {
  // Get all announcements with optional filters
  async getAll(params?: {
    target_audience?: TargetAudience;
    priority?: Priority;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Announcement[]> {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  // Get a single announcement by ID
  async getById(id: string): Promise<Announcement> {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  // Create a new announcement
  async create(data: AnnouncementCreate): Promise<Announcement> {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  // Update an announcement
  async update(id: string, data: AnnouncementUpdate): Promise<Announcement> {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  // Delete an announcement
  async delete(id: string): Promise<void> {
    await api.delete(`/announcements/${id}`);
  },
};

