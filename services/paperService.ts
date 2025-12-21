import api from '@/lib/api';

export interface Paper {
  id: string;
  class_id: string;
  class_name: string;
  subject: string;
  term: string;
  year: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  description?: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  upload_date: string;
  submitted_for_approval_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaperCreate {
  class_id: string;
  class_name: string;
  subject: string;
  term: string;
  year: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  description?: string;
}

export interface PaperUpdate {
  class_id?: string;
  class_name?: string;
  subject?: string;
  term?: string;
  year?: number;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  description?: string;
}

export interface PaperStats {
  total_papers: number;
  papers_by_term: Record<string, number>;
  papers_by_class: Record<string, number>;
  papers_by_subject: Record<string, number>;
  papers_by_year: Record<string, number>;
  recent_uploads: number;
}

export const paperService = {
  // Get all papers with optional filters
  async getAll(params?: {
    class_id?: string;
    subject?: string;
    term?: string;
    year?: number;
    uploaded_by?: string;
    limit?: number;
    offset?: number;
  }): Promise<Paper[]> {
    const response = await api.get('/papers', { params });
    return response.data;
  },

  // Get a single paper by ID
  async getById(id: string): Promise<Paper> {
    const response = await api.get(`/papers/${id}`);
    return response.data;
  },

  // Get paper statistics
  async getStats(): Promise<PaperStats> {
    const response = await api.get('/papers/stats');
    return response.data;
  },

  // Get class paper summary
  async getClassSummary(classId: string): Promise<any> {
    const response = await api.get(`/papers/class/${classId}/summary`);
    return response.data;
  },

  // Create a new paper
  async create(data: PaperCreate): Promise<Paper> {
    const response = await api.post('/papers', data);
    return response.data;
  },

  // Update a paper
  async update(id: string, data: PaperUpdate): Promise<Paper> {
    const response = await api.put(`/papers/${id}`, data);
    return response.data;
  },

  // Delete a paper
  async delete(id: string): Promise<void> {
    await api.delete(`/papers/${id}`);
  },

  // Upload file to Supabase storage (helper function)
  async uploadFile(file: File, folder: string = 'papers'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.url;
  },

  // Approval workflow methods
  async submitForApproval(paperId: string): Promise<any> {
    const response = await api.post(`/papers/${paperId}/submit`);
    return response.data;
  },

  async approve(paperId: string): Promise<any> {
    const response = await api.post(`/papers/${paperId}/approve`);
    return response.data;
  },

  async reject(paperId: string, rejectionReason: string, comments?: string): Promise<any> {
    const response = await api.post(`/papers/${paperId}/reject`, {
      rejection_reason: rejectionReason,
      comments: comments
    });
    return response.data;
  },

  async getPending(limit?: number, offset?: number): Promise<{ papers: Paper[]; count: number }> {
    const response = await api.get('/papers/pending/list', {
      params: { limit, offset }
    });
    return response.data;
  },
};

