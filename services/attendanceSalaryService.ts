import api from '@/lib/api'

// Types
export interface SchoolTiming {
  id: string
  timing_name: string
  arrival_time: string
  departure_time: string
  grace_period_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AttendanceRule {
  id: string
  rule_name: string
  rule_type: 'late_coming' | 'half_day' | 'absent' | 'early_departure'
  condition_description: string
  deduction_type: 'percentage' | 'fixed_amount' | 'full_day' | 'half_day'
  deduction_value: number
  grace_minutes: number
  max_late_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BiometricAttendance {
  id: string
  teacher_id: string
  attendance_date: string
  check_in_time?: string
  check_out_time?: string
  total_hours: number
  status: 'present' | 'absent' | 'half_day' | 'late' | 'early_departure'
  late_minutes: number
  early_departure_minutes: number
  deduction_amount: number
  deduction_reason?: string
  is_manual_override: boolean
  override_reason?: string
  uploaded_file_id?: string
  created_at: string
  updated_at: string
}

export interface CSVUploadHistory {
  id: string
  file_name: string
  file_size: number
  upload_date: string
  records_processed: number
  records_successful: number
  records_failed: number
  upload_status: 'processing' | 'completed' | 'failed' | 'partial'
  error_log?: string
  uploaded_by?: string
  created_at: string
}

export interface MonthlySalaryCalculation {
  id: string
  teacher_id: string
  calculation_month: number
  calculation_year: number
  basic_salary: number
  per_day_salary: number
  total_working_days: number
  present_days: number
  absent_days: number
  half_days: number
  late_days: number
  total_deductions: number
  net_salary: number
  calculation_details?: any
  is_approved: boolean
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface TeacherSalaryConfig {
  id: string
  teacher_id: string
  basic_monthly_salary: number
  per_day_salary: number
  effective_from: string
  effective_to?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AttendanceSummary {
  teacher_id: string
  teacher_name: string
  total_days: number
  present_days: number
  absent_days: number
  half_days: number
  late_days: number
  attendance_percentage: number
  total_deductions: number
}

export const attendanceSalaryService = {
  // School Timings
  async getSchoolTimings(): Promise<SchoolTiming[]> {
    const response = await api.get<SchoolTiming[]>('/attendance-salary/timings')
    return response.data
  },

  async createSchoolTiming(data: {
    timing_name: string
    arrival_time: string
    departure_time: string
    grace_period_minutes: number
    is_active?: boolean
  }): Promise<SchoolTiming> {
    const response = await api.post<SchoolTiming>('/attendance-salary/timings', data)
    return response.data
  },

  async updateSchoolTiming(id: string, data: {
    timing_name?: string
    arrival_time?: string
    departure_time?: string
    grace_period_minutes?: number
    is_active?: boolean
  }): Promise<SchoolTiming> {
    const response = await api.put<SchoolTiming>(`/attendance-salary/timings/${id}`, data)
    return response.data
  },

  // Attendance Rules
  async getAttendanceRules(): Promise<AttendanceRule[]> {
    const response = await api.get<AttendanceRule[]>('/attendance-salary/rules')
    return response.data
  },

  async createAttendanceRule(data: {
    rule_name: string
    rule_type: string
    condition_description: string
    deduction_type: string
    deduction_value: number
    grace_minutes?: number
    max_late_count?: number
    is_active?: boolean
  }): Promise<AttendanceRule> {
    const response = await api.post<AttendanceRule>('/attendance-salary/rules', data)
    return response.data
  },

  async updateAttendanceRule(id: string, data: {
    rule_name?: string
    condition_description?: string
    deduction_type?: string
    deduction_value?: number
    grace_minutes?: number
    max_late_count?: number
    is_active?: boolean
  }): Promise<AttendanceRule> {
    const response = await api.put<AttendanceRule>(`/attendance-salary/rules/${id}`, data)
    return response.data
  },

  // CSV Upload
  async uploadBiometricCSV(file: File): Promise<CSVUploadHistory> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post<CSVUploadHistory>('/attendance-salary/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Biometric Attendance
  async getBiometricAttendance(params?: {
    teacher_id?: string
    date_from?: string
    date_to?: string
  }): Promise<BiometricAttendance[]> {
    const response = await api.get<BiometricAttendance[]>('/attendance-salary/biometric', { params })
    return response.data
  },

  async getAttendanceSummary(params?: {
    month?: number
    year?: number
  }): Promise<AttendanceSummary[]> {
    const response = await api.get<AttendanceSummary[]>('/attendance-salary/summary', { params })
    return response.data
  },

  // Salary Calculations
  async calculateMonthlySalary(data: {
    month: number
    year: number
    teacher_ids?: string[]
  }): Promise<MonthlySalaryCalculation[]> {
    try {
      const response = await api.post<MonthlySalaryCalculation[]>('/attendance-salary/calculate-salary', data)
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

  async previewSalaryCalculation(teacher_id: string, month: number, year: number): Promise<any> {
    try {
      const response = await api.post<any>('/attendance-salary/preview-salary', null, {
        params: { teacher_id, month, year }
      })
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

  async recalculateSalary(calculation_id: string): Promise<MonthlySalaryCalculation> {
    try {
      const response = await api.post<MonthlySalaryCalculation>(`/attendance-salary/recalculate-salary/${calculation_id}`)
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

  async getSalaryCalculations(params?: {
    month?: number
    year?: number
    teacher_id?: string
    is_approved?: boolean
  }): Promise<MonthlySalaryCalculation[]> {
    try {
      const response = await api.get<MonthlySalaryCalculation[]>('/attendance-salary/salary-calculations', { params })
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

  async approveSalaryCalculation(calculation_id: string): Promise<MonthlySalaryCalculation> {
    try {
      const response = await api.post<MonthlySalaryCalculation>(`/attendance-salary/salary-calculations/${calculation_id}/approve`)
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

  async bulkApproveSalaryCalculations(calculation_ids: string[]): Promise<{
    approved_count: number
    total_count: number
    errors?: string[]
  }> {
    try {
      const response = await api.post<{
        approved_count: number
        total_count: number
        errors?: string[]
      }>('/attendance-salary/salary-calculations/bulk-approve', calculation_ids)
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

  // Teacher Salary Configuration
  async getTeacherSalaryConfig(teacher_id?: string): Promise<TeacherSalaryConfig[]> {
    const response = await api.get<TeacherSalaryConfig[]>('/attendance-salary/teacher-salary-config', {
      params: { teacher_id }
    })
    return response.data
  },

  async createTeacherSalaryConfig(data: {
    teacher_id: string
    basic_monthly_salary: number
    per_day_salary: number
    effective_from: string
    effective_to?: string
    is_active?: boolean
  }, adjustment_reason?: string): Promise<TeacherSalaryConfig> {
    try {
      const response = await api.post<TeacherSalaryConfig>('/attendance-salary/teacher-salary-config', data, {
        params: adjustment_reason ? { adjustment_reason } : {}
      })
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

  async updateTeacherSalaryConfig(id: string, data: {
    basic_monthly_salary?: number
    per_day_salary?: number
    effective_to?: string
    is_active?: boolean
  }): Promise<TeacherSalaryConfig> {
    const response = await api.put<TeacherSalaryConfig>(`/attendance-salary/teacher-salary-config/${id}`, data)
    return response.data
  },

  // Upload History
  async getUploadHistory(): Promise<CSVUploadHistory[]> {
    const response = await api.get<CSVUploadHistory[]>('/attendance-salary/upload-history')
    return response.data
  }
}



