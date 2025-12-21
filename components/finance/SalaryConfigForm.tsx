'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { attendanceSalaryService } from '@/services/attendanceSalaryService'
import { teacherService } from '@/services/teacherService'
import { toast } from '@/components/ui/toast'
import { X, Calculator, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SalaryConfigFormProps {
  onClose: () => void
  onSuccess?: () => void
  teacherId?: string
  initialData?: any
}

type SalaryConfigFormData = {
  teacher_id: string
  basic_monthly_salary: number
  per_day_salary: number
  effective_from: string
  effective_to?: string
  is_active?: boolean
}

export function SalaryConfigForm({ onClose, onSuccess, teacherId, initialData }: SalaryConfigFormProps) {
  const queryClient = useQueryClient()
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [autoCalculatePerDay, setAutoCalculatePerDay] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SalaryConfigFormData>({
    defaultValues: initialData || {
      teacher_id: teacherId || '',
      effective_from: new Date().toISOString().split('T')[0],
      is_active: true,
      per_day_salary: 0,
    },
  })

  const basicSalary = watch('basic_monthly_salary') || 0
  const effectiveFrom = watch('effective_from')

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherService.getTeachers({ limit: 1000 }),
    enabled: !teacherId,
  })

  // Calculate per day salary automatically
  const handleBasicSalaryChange = (value: number) => {
    if (autoCalculatePerDay && value > 0) {
      // Assuming 30 working days per month (can be customized)
      const perDay = value / 30
      setValue('per_day_salary', parseFloat(perDay.toFixed(2)))
    }
  }

  const createMutation = useMutation({
    mutationFn: (data: SalaryConfigFormData) => 
      attendanceSalaryService.createTeacherSalaryConfig(
        {
          teacher_id: data.teacher_id,
          basic_monthly_salary: Number(data.basic_monthly_salary),
          per_day_salary: Number(data.per_day_salary),
          effective_from: data.effective_from,
          effective_to: data.effective_to || undefined,
          is_active: data.is_active ?? true,
        },
        adjustmentReason || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-salary-config'] })
      toast.success('Salary configuration created successfully!')
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Failed to create salary configuration'
      toast.error(errorMessage)
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<SalaryConfigFormData>) =>
      attendanceSalaryService.updateTeacherSalaryConfig(initialData.id, {
        basic_monthly_salary: data.basic_monthly_salary ? Number(data.basic_monthly_salary) : undefined,
        per_day_salary: data.per_day_salary ? Number(data.per_day_salary) : undefined,
        effective_to: data.effective_to || undefined,
        is_active: data.is_active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-salary-config'] })
      toast.success('Salary configuration updated successfully!')
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Failed to update salary configuration'
      toast.error(errorMessage)
    }
  })

  const onSubmit = (data: SalaryConfigFormData) => {
    if (!data.teacher_id) {
      toast.error('Please select a teacher')
      return
    }

    if (data.basic_monthly_salary <= 0) {
      toast.error('Basic salary must be greater than 0')
      return
    }

    if (data.per_day_salary <= 0) {
      toast.error('Per day salary must be greater than 0')
      return
    }

    if (initialData) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              {initialData ? 'Update Salary Configuration' : 'Set Teacher Salary'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {initialData ? 'Update salary configuration for teacher' : 'Configure monthly and per-day salary'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Teacher Selection - Only for new records */}
          {!initialData && !teacherId && (
            <div className="space-y-2">
              <Label htmlFor="teacher_id">Teacher *</Label>
              <select
                id="teacher_id"
                {...register('teacher_id', { required: 'Teacher is required' })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Monthly Salary */}
            <div className="space-y-2">
              <Label htmlFor="basic_monthly_salary" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Basic Monthly Salary *
              </Label>
              <Input
                type="number"
                step="0.01"
                id="basic_monthly_salary"
                {...register('basic_monthly_salary', {
                  required: 'Basic salary is required',
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'Salary must be greater than 0' },
                  onChange: (e) => {
                    const value = parseFloat(e.target.value)
                    if (!isNaN(value)) {
                      handleBasicSalaryChange(value)
                    }
                  }
                })}
                placeholder="0.00"
              />
              {errors.basic_monthly_salary && (
                <p className="text-sm text-red-600">{errors.basic_monthly_salary.message}</p>
              )}
            </div>

            {/* Per Day Salary */}
            <div className="space-y-2">
              <Label htmlFor="per_day_salary" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Per Day Salary *
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  id="per_day_salary"
                  {...register('per_day_salary', {
                    required: 'Per day salary is required',
                    valueAsNumber: true,
                    min: { value: 0.01, message: 'Per day salary must be greater than 0' },
                  })}
                  placeholder="0.00"
                  disabled={autoCalculatePerDay && !initialData}
                  className={autoCalculatePerDay && !initialData ? 'bg-gray-100' : ''}
                />
                {!initialData && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoCalculatePerDay(!autoCalculatePerDay)}
                    className="whitespace-nowrap"
                  >
                    {autoCalculatePerDay ? 'Manual' : 'Auto'}
                  </Button>
                )}
              </div>
              {errors.per_day_salary && (
                <p className="text-sm text-red-600">{errors.per_day_salary.message}</p>
              )}
              {autoCalculatePerDay && !initialData && (
                <p className="text-xs text-gray-500">Auto-calculated as Basic Salary / 30 days</p>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Effective From */}
            <div className="space-y-2">
              <Label htmlFor="effective_from" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Effective From *
              </Label>
              <Input
                type="date"
                id="effective_from"
                {...register('effective_from', { required: 'Effective from date is required' })}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.effective_from && (
                <p className="text-sm text-red-600">{errors.effective_from.message}</p>
              )}
            </div>

            {/* Effective To */}
            <div className="space-y-2">
              <Label htmlFor="effective_to">Effective To (Optional)</Label>
              <Input
                type="date"
                id="effective_to"
                {...register('effective_to')}
                min={effectiveFrom || undefined}
              />
              <p className="text-xs text-gray-500">Leave empty for indefinite duration</p>
            </div>
          </div>

          {/* Active Status - Only for updates */}
          {initialData && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register('is_active')}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active (Uncheck to deactivate this configuration)
                </Label>
              </div>
            </div>
          )}

          {/* Adjustment Reason - For new records */}
          {!initialData && (
            <div className="space-y-2">
              <Label htmlFor="adjustment_reason">Adjustment Reason (Optional)</Label>
              <Textarea
                id="adjustment_reason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Reason for this salary configuration (e.g., 'Annual increment', 'Promotion', etc.)"
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                This helps track salary history and changes
              </p>
            </div>
          )}

          {/* Salary Summary */}
          {basicSalary > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Salary Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Salary:</span>
                  <span className="font-semibold">${basicSalary.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Per Day Salary:</span>
                  <span className="font-semibold">${watch('per_day_salary')?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="text-gray-600">Annual Salary:</span>
                  <span className="font-bold text-blue-700">${(basicSalary * 12).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : initialData
                ? 'Update Configuration'
                : 'Save Configuration'}
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








