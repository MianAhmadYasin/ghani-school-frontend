import { api } from '@/lib/api'

// Types
export interface SystemSetting {
  id: string
  setting_key: string
  setting_value: string
  setting_type: 'string' | 'number' | 'boolean' | 'json'
  category: 'general' | 'academic' | 'financial' | 'security' | 'notification' | 'appearance'
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
  updated_by?: string
}

export interface RolePermission {
  id: string
  role: 'admin' | 'principal' | 'teacher' | 'student' | 'parent'
  permission_key: string
  permission_value: boolean
  created_at: string
  updated_at: string
}

export interface FeeStructure {
  id: string
  class_level: string
  fee_type: 'tuition' | 'admission' | 'exam' | 'library' | 'transport' | 'activity' | 'other'
  amount: number
  currency: string
  academic_year: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AcademicYear {
  id: string
  year_name: string
  start_date: string
  end_date: string
  is_current: boolean
  created_at: string
  updated_at: string
}

export const settingsService = {
  // System Settings
  async getSystemSettings(params?: {
    category?: string
    public_only?: boolean
  }): Promise<SystemSetting[]> {
    const response = await api.get<SystemSetting[]>('/settings/system', { params })
    return response.data
  },

  async getSystemSetting(key: string): Promise<SystemSetting> {
    const response = await api.get<SystemSetting>(`/settings/system/${key}`)
    return response.data
  },

  async updateSystemSetting(key: string, data: {
    setting_value?: string
    description?: string
    is_public?: boolean
  }): Promise<SystemSetting> {
    const response = await api.put<SystemSetting>(`/settings/system/${key}`, data)
    return response.data
  },

  async bulkUpdateSettings(settings: Record<string, string>): Promise<any> {
    const response = await api.post('/settings/system/bulk', { settings })
    return response.data
  },

  // Role Permissions
  async getRolePermissions(role?: string): Promise<RolePermission[]> {
    const response = await api.get<RolePermission[]>('/settings/permissions', {
      params: { role }
    })
    return response.data
  },

  async updateRolePermission(role: string, permissionKey: string, value: boolean): Promise<RolePermission> {
    const response = await api.put<RolePermission>(
      `/settings/permissions/${role}/${permissionKey}`,
      { permission_value: value }
    )
    return response.data
  },

  // Fee Structure
  async getFeeStructure(params?: {
    class_level?: string
    academic_year?: string
    active_only?: boolean
  }): Promise<FeeStructure[]> {
    const response = await api.get<FeeStructure[]>('/settings/fees', { params })
    return response.data
  },

  async createFeeStructure(data: {
    class_level: string
    fee_type: string
    amount: number
    currency: string
    academic_year: string
    is_active?: boolean
  }): Promise<FeeStructure> {
    const response = await api.post<FeeStructure>('/settings/fees', data)
    return response.data
  },

  async updateFeeStructure(id: string, data: {
    amount?: number
    is_active?: boolean
  }): Promise<FeeStructure> {
    const response = await api.put<FeeStructure>(`/settings/fees/${id}`, data)
    return response.data
  },

  async deleteFeeStructure(id: string): Promise<void> {
    await api.delete(`/settings/fees/${id}`)
  },

  // Academic Years
  async getAcademicYears(currentOnly?: boolean): Promise<AcademicYear[]> {
    const response = await api.get<AcademicYear[]>('/settings/academic-years', {
      params: { current_only: currentOnly }
    })
    return response.data
  },

  async createAcademicYear(data: {
    year_name: string
    start_date: string
    end_date: string
    is_current?: boolean
  }): Promise<AcademicYear> {
    const response = await api.post<AcademicYear>('/settings/academic-years', data)
    return response.data
  },

  async updateAcademicYear(id: string, data: {
    start_date?: string
    end_date?: string
    is_current?: boolean
  }): Promise<AcademicYear> {
    const response = await api.put<AcademicYear>(`/settings/academic-years/${id}`, data)
    return response.data
  },

  // Export All Settings
  async exportAllSettings(): Promise<any> {
    const response = await api.get('/settings/export')
    return response.data
  }
}










