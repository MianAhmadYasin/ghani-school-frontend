import api from '@/lib/api'

export interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  amount: number
  category?: string
}

export interface Invoice {
  id: string
  invoice_number: string
  teacher_id: string
  calculation_id: string
  month: number
  year: number
  invoice_date: string
  due_date?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  items: InvoiceItem[]
  subtotal: number
  deductions: number
  bonuses: number
  tax: number
  net_amount: number
  total_amount: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface InvoiceCreate {
  calculation_id: string
  invoice_date?: string
  due_date?: string
  template?: 'simple' | 'detailed'
  notes?: string
}

export interface InvoiceUpdate {
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date?: string
  notes?: string
}

export const invoiceService = {
  async getInvoices(params?: {
    teacher_id?: string
    month?: number
    year?: number
    status?: string
    calculation_id?: string
  }): Promise<Invoice[]> {
    try {
      const response = await api.get<Invoice[]>('/finance/invoices', { params })
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

  async getInvoice(id: string): Promise<Invoice> {
    try {
      const response = await api.get<Invoice>(`/finance/invoices/${id}`)
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

  async generateInvoice(data: InvoiceCreate): Promise<Invoice> {
    try {
      const response = await api.post<Invoice>('/finance/invoices', data)
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

  async updateInvoice(id: string, data: InvoiceUpdate): Promise<Invoice> {
    try {
      const response = await api.put<Invoice>(`/finance/invoices/${id}`, data)
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

  async downloadInvoice(id: string, format: 'pdf' | 'html' = 'pdf'): Promise<Blob | string> {
    try {
      const response = await api.get(`/finance/invoices/${id}/download`, {
        params: { format },
        responseType: format === 'pdf' ? 'blob' : 'text'
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
}








