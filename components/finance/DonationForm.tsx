'use client'

import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { financeService } from '@/services/financeService'
import { toast } from '@/components/ui/toast'
import { X } from 'lucide-react'

interface DonationFormProps {
  onClose: () => void
  onSuccess?: () => void
  initialData?: any
}

type DonationFormData = {
  donor_name: string
  amount: number
  date: string
  purpose?: string
  receipt_number: string
}

export function DonationForm({ onClose, onSuccess, initialData }: DonationFormProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DonationFormData>({
    defaultValues: initialData || {
      date: new Date().toISOString().split('T')[0],
      receipt_number: `REC-${Date.now()}`,
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: DonationFormData) => financeService.createDonation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
      toast.success('Donation recorded successfully!')
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to record donation')
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: DonationFormData) => {
      // CRITICAL: Ensure date is a string and amount is a number
      const safeData = {
        ...data,
        date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().split('T')[0],
        amount: Number(data.amount)
      };
      return financeService.updateDonation(initialData.id, safeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
      toast.success('Donation updated successfully!')
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      console.error('❌ API Error:', error);
      toast.error(error?.response?.data?.detail || 'Failed to update donation')
    }
  })

  const onSubmit = (data: DonationFormData) => {
    
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
      donor_name: data.donor_name,
      amount: Number(data.amount),
      date: dateString,
      purpose: data.purpose || undefined,
      receipt_number: data.receipt_number
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
            {initialData ? 'Edit Donation' : 'Record Donation'}
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
            <Label htmlFor="donor_name">Donor Name *</Label>
            <Input
              id="donor_name"
              {...register('donor_name', { required: 'Donor name is required' })}
              placeholder="Name of donor or organization"
            />
            {errors.donor_name && (
              <p className="text-sm text-red-600">{errors.donor_name.message}</p>
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

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose (Optional)</Label>
            <textarea
              id="purpose"
              {...register('purpose')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Purpose of donation (e.g., Building fund, Scholarship, General)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt_number">Receipt Number *</Label>
            <Input
              id="receipt_number"
              {...register('receipt_number', { required: 'Receipt number is required' })}
              placeholder="Unique receipt number"
            />
            {errors.receipt_number && (
              <p className="text-sm text-red-600">{errors.receipt_number.message}</p>
            )}
            <p className="text-xs text-gray-600">
              A unique identifier for this donation receipt
            </p>
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
                ? 'Update Donation'
                : 'Record Donation'}
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






