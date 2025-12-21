'use client'

import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { financeService } from '@/services/financeService'
import { teacherService } from '@/services/teacherService'
import { toast } from '@/components/ui/toast'
import { X } from 'lucide-react'

interface SalaryFormProps {
  onClose: () => void
  onSuccess?: () => void
  initialData?: any
}

type SalaryFormData = {
  teacher_id: string
  month: number
  year: number
  basic_salary: number
  deductions: number
  bonuses: number
  paid_date?: string
}

export function SalaryForm({ onClose, onSuccess, initialData }: SalaryFormProps) {
  const queryClient = useQueryClient()
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SalaryFormData>({
    defaultValues: initialData || {
      month: currentMonth,
      year: currentYear,
      deductions: 0,
      bonuses: 0,
    },
  })

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherService.getTeachers({ limit: 1000 }),
  })

  // Watch values for net salary calculation
  const basicSalary = watch('basic_salary') || 0
  const deductions = watch('deductions') || 0
  const bonuses = watch('bonuses') || 0
  const netSalary = basicSalary + bonuses - deductions

  const createMutation = useMutation({
    mutationFn: (data: SalaryFormData) => financeService.createSalaryRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] })
      toast.success('Salary record added successfully!')
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to add salary record')
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<SalaryFormData>) =>
      financeService.updateSalaryRecord(initialData.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] })
      toast.success('Salary record updated successfully!')
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update salary record')
    }
  })

  const onSubmit = (data: SalaryFormData) => {
    // Ensure paid_date is properly formatted if provided
    let paidDateString: string | undefined = undefined;
    if (data.paid_date) {
      if (typeof data.paid_date === 'string') {
        paidDateString = data.paid_date;
      } else if (data.paid_date && typeof data.paid_date === 'object') {
        const paidDateObj = data.paid_date as any;
        if (paidDateObj instanceof Date) {
          paidDateString = paidDateObj.toISOString().split('T')[0];
        } else {
          paidDateString = new Date(paidDateObj).toISOString().split('T')[0];
        }
      } else {
        paidDateString = new Date(data.paid_date as any).toISOString().split('T')[0];
      }
    }
    
    const formattedData = {
      teacher_id: data.teacher_id,
      month: Number(data.month),
      year: Number(data.year),
      basic_salary: Number(data.basic_salary),
      deductions: Number(data.deductions),
      bonuses: Number(data.bonuses),
      paid_date: paidDateString
    }
    
    if (initialData) {
      // For updates, only send changed fields
      const updateData: any = {}
      if (data.deductions !== initialData.deductions) updateData.deductions = Number(data.deductions)
      if (data.bonuses !== initialData.bonuses) updateData.bonuses = Number(data.bonuses)
      if (data.paid_date) updateData.paid_date = paidDateString
      updateMutation.mutate(updateData)
    } else {
      createMutation.mutate(formattedData)
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {initialData ? 'Update Salary Record' : 'Add Salary Record'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Teacher Selection - Only for new records */}
          {!initialData && (
            <div className="space-y-2">
              <Label htmlFor="teacher_id">Teacher *</Label>
              <select
                id="teacher_id"
                {...register('teacher_id', { required: 'Teacher is required' })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select teacher</option>
                {teachers.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.user?.full_name || 'Unknown'} - {teacher.employee_id}
                  </option>
                ))}
              </select>
              {errors.teacher_id && (
                <p className="text-sm text-red-600">{errors.teacher_id.message}</p>
              )}
            </div>
          )}

          {/* Month - Only for new records */}
          {!initialData && (
            <div className="space-y-2">
              <Label htmlFor="month">Month *</Label>
              <select
                id="month"
                {...register('month', { 
                  required: 'Month is required',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Invalid month' },
                  max: { value: 12, message: 'Invalid month' }
                })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {monthNames.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              {errors.month && (
                <p className="text-sm text-red-600">{errors.month.message}</p>
              )}
            </div>
          )}

          {/* Year - Only for new records */}
          {!initialData && (
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                type="number"
                id="year"
                {...register('year', {
                  required: 'Year is required',
                  valueAsNumber: true,
                  min: { value: 2020, message: 'Year must be 2020 or later' },
                  max: { value: 2100, message: 'Year must be before 2100' }
                })}
              />
              {errors.year && (
                <p className="text-sm text-red-600">{errors.year.message}</p>
              )}
            </div>
          )}

          {/* Basic Salary - Only for new records */}
          {!initialData && (
            <div className="space-y-2">
              <Label htmlFor="basic_salary">Basic Salary *</Label>
              <Input
                type="number"
                step="0.01"
                id="basic_salary"
                {...register('basic_salary', {
                  required: 'Basic salary is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Salary must be positive' },
                })}
                placeholder="0.00"
              />
              {errors.basic_salary && (
                <p className="text-sm text-red-600">{errors.basic_salary.message}</p>
              )}
            </div>
          )}

          {/* Deductions */}
          <div className="space-y-2">
            <Label htmlFor="deductions">Deductions</Label>
            <Input
              type="number"
              step="0.01"
              id="deductions"
              {...register('deductions', {
                valueAsNumber: true,
                min: { value: 0, message: 'Deductions cannot be negative' },
              })}
              placeholder="0.00"
            />
            {errors.deductions && (
              <p className="text-sm text-red-600">{errors.deductions.message}</p>
            )}
          </div>

          {/* Bonuses */}
          <div className="space-y-2">
            <Label htmlFor="bonuses">Bonuses</Label>
            <Input
              type="number"
              step="0.01"
              id="bonuses"
              {...register('bonuses', {
                valueAsNumber: true,
                min: { value: 0, message: 'Bonuses cannot be negative' },
              })}
              placeholder="0.00"
            />
            {errors.bonuses && (
              <p className="text-sm text-red-600">{errors.bonuses.message}</p>
            )}
          </div>

          {/* Net Salary Display */}
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Net Salary:</span>
              <span className="text-xl font-bold text-blue-600">
                ${netSalary.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Basic (${basicSalary.toFixed(2)}) + Bonuses (${bonuses.toFixed(2)}) - Deductions (${deductions.toFixed(2)})
            </p>
          </div>

          {/* Paid Date */}
          <div className="space-y-2">
            <Label htmlFor="paid_date">Paid Date (Optional)</Label>
            <Input
              type="date"
              id="paid_date"
              {...register('paid_date')}
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-500">Leave empty if not yet paid</p>
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
                ? 'Update Record'
                : 'Add Salary Record'}
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

