import api from '@/lib/api'
import {
  StationeryItem,
  StationeryDistribution,
  SalaryRecord,
  Expense,
  Donation,
} from '@/types'

export const financeService = {
  // Stationery Items
  async getStationeryItems(params?: {
    category?: string
    low_stock?: boolean
  }): Promise<StationeryItem[]> {
    const response = await api.get<StationeryItem[]>(
      '/finance/stationery/items',
      { params }
    )
    return response.data
  },

  async getStationeryItem(id: string): Promise<StationeryItem> {
    const response = await api.get<StationeryItem>(
      `/finance/stationery/items/${id}`
    )
    return response.data
  },

  async createStationeryItem(data: Omit<StationeryItem, 'id' | 'created_at'>): Promise<StationeryItem> {
    const response = await api.post<StationeryItem>(
      '/finance/stationery/items',
      data
    )
    return response.data
  },

  async updateStationeryItem(id: string, data: Partial<StationeryItem>): Promise<StationeryItem> {
    const response = await api.put<StationeryItem>(
      `/finance/stationery/items/${id}`,
      data
    )
    return response.data
  },

  async deleteStationeryItem(id: string): Promise<void> {
    await api.delete(`/finance/stationery/items/${id}`)
  },

  // Stationery Distributions
  async getDistributions(params?: {
    student_id?: string
    item_id?: string
    date_from?: string
    date_to?: string
  }): Promise<StationeryDistribution[]> {
    const response = await api.get<StationeryDistribution[]>(
      '/finance/stationery/distributions',
      { params }
    )
    return response.data
  },

  async distributeStationery(data: {
    student_id: string
    item_id: string
    quantity: number
    distributed_date: string
  }): Promise<StationeryDistribution> {
    const response = await api.post<StationeryDistribution>(
      '/finance/stationery/distributions',
      data
    )
    return response.data
  },

  // Salary Records
  async getSalaryRecords(params?: {
    teacher_id?: string
    month?: number
    year?: number
  }): Promise<SalaryRecord[]> {
    const response = await api.get<SalaryRecord[]>('/finance/salaries', {
      params,
    })
    return response.data
  },

  async createSalaryRecord(data: {
    teacher_id: string
    month: number
    year: number
    basic_salary: number
    deductions?: number
    bonuses?: number
  }): Promise<SalaryRecord> {
    const response = await api.post<SalaryRecord>('/finance/salaries', data)
    return response.data
  },

  async updateSalaryRecord(id: string, data: Partial<SalaryRecord>): Promise<SalaryRecord> {
    const response = await api.put<SalaryRecord>(
      `/finance/salaries/${id}`,
      data
    )
    return response.data
  },

  // Expenses
  async getExpenses(params?: {
    category?: string
    date_from?: string
    date_to?: string
  }): Promise<Expense[]> {
    const response = await api.get<Expense[]>('/finance/expenses', { params })
    return response.data
  },

  async createExpense(data: {
    category: string
    amount: number
    description: string
    date: string
  }): Promise<Expense> {
    const response = await api.post<Expense>('/finance/expenses', data)
    return response.data
  },

  async updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
    const response = await api.put<Expense>(`/finance/expenses/${id}`, data)
    return response.data
  },

  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/finance/expenses/${id}`)
  },

  // Donations
  async getDonations(params?: {
    date_from?: string
    date_to?: string
  }): Promise<Donation[]> {
    const response = await api.get<Donation[]>('/finance/donations', { params })
    return response.data
  },

  async createDonation(data: {
    donor_name: string
    amount: number
    date: string
    purpose?: string
    receipt_number: string
  }): Promise<Donation> {
    const response = await api.post<Donation>('/finance/donations', data)
    return response.data
  },

  async updateDonation(id: string, data: Partial<Donation>): Promise<Donation> {
    const response = await api.put<Donation>(`/finance/donations/${id}`, data)
    return response.data
  },

  async deleteDonation(id: string): Promise<void> {
    await api.delete(`/finance/donations/${id}`)
  },

  // Financial Reports
  async getFinancialSummary(params: {
    report_type?: 'daily' | 'weekly' | 'monthly' | '6-month' | 'yearly' | 'custom'
    date_from?: string
    date_to?: string
    include_comparison?: boolean
  }): Promise<any> {
    const response = await api.get('/finance/reports/summary', { params })
    return response.data
  },

  async generateFinancialReport(data: {
    report_type: 'daily' | 'weekly' | 'monthly' | '6-month' | 'yearly' | 'custom'
    date_from?: string
    date_to?: string
    format?: 'json' | 'pdf' | 'excel' | 'csv'
    include_charts?: boolean
  }): Promise<any> {
    const response = await api.post('/finance/reports', data)
    return response.data
  },
}












