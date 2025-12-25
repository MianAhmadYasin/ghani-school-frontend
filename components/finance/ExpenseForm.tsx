'use client'

import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { financeService } from '@/services/financeService'
import { toast } from '@/components/ui/toast'
import { X } from 'lucide-react'

interface ExpenseFormProps {
  onClose: () => void
  onSuccess?: () => void
  initialData?: any
}

type ExpenseFormData = {
  category: string
  amount: number
  description: string
  date: string
}

export function ExpenseForm({ onClose, onSuccess, initialData }: ExpenseFormProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    defaultValues: initialData || {
      date: new Date().toISOString().split('T')[0],
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: ExpenseFormData) => financeService.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Expense added successfully!')
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to add expense')
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: ExpenseFormData) => {
      // CRITICAL: Ensure date is a string and amount is a number
      const safeData = {
        ...data,
        date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().split('T')[0],
        amount: Number(data.amount)
      };
      return financeService.updateExpense(initialData.id, safeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Expense updated successfully!')
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      console.error('❌ API Error:', error);
      toast.error(error?.response?.data?.detail || 'Failed to update expense')
    }
  })

  const onSubmit = (data: ExpenseFormData) => {
    
    // Robust date conversion to YYYY-MM-DD format
    let dateString: string;
    const dateValue = data.date;
    
    if (typeof dateValue === 'string') {
      // Check if already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        dateString = dateValue;
      } else {
        // Try to parse other formats (MM/DD/YYYY, etc.)
        const parsed = new Date(dateValue);
        if (!isNaN(parsed.getTime())) {
          dateString = parsed.toISOString().split('T')[0];
        } else {
          // Fallback to today
          dateString = new Date().toISOString().split('T')[0];
        }
      }
    } else if (dateValue && typeof dateValue === 'object') {
      // Check if it's a Date object
      const dateObj = dateValue as any;
      if (dateObj instanceof Date) {
        dateString = dateObj.toISOString().split('T')[0];
      } else {
        // Handle Date-like objects
        const parsed = new Date(dateObj);
        dateString = parsed.toISOString().split('T')[0];
      }
    } else {
      // Last resort
      dateString = new Date().toISOString().split('T')[0];
    }
    
    
    const formattedData = {
      category: data.category,
      amount: Number(data.amount),
      description: data.description,
      date: dateString
    }
    
    
    if (initialData) {
      updateMutation.mutate(formattedData)
    } else {
      createMutation.mutate(formattedData)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {initialData ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              {...register('category', { required: 'Category is required' })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select category</option>
              <option value="Utilities">Utilities (Electricity, Water, Gas)</option>
              <option value="Salaries">Salaries & Wages</option>
              <option value="Maintenance">Maintenance & Repairs</option>
              <option value="Supplies">Supplies & Materials</option>
              <option value="Transportation">Transportation</option>
              <option value="Marketing">Marketing & Advertising</option>
              <option value="Technology">Technology & Equipment</option>
              <option value="Events">Events & Activities</option>
              <option value="Professional Services">Professional Services</option>
              <option value="Insurance">Insurance</option>
              <option value="Rent">Rent</option>
              <option value="Other">Other</option>
            </select>
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              type="number"
              step="0.01"
              id="amount"
              {...register('amount', {
                required: 'Amount is required',
                valueAsNumber: true,
                min: { value: 0.01, message: 'Amount must be greater than 0' },
              })}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              {...register('description', { required: 'Description is required' })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe the expense..."
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              type="date"
              id="date"
              {...register('date', { required: 'Date is required' })}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : initialData
                ? 'Update Expense'
                : 'Add Expense'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}






