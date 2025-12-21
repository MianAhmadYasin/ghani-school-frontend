'use client'

import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { financeService } from '@/services/financeService'
import { toast } from '@/components/ui/toast'
import { X } from 'lucide-react'

interface StationeryItemFormProps {
  onClose: () => void
  onSuccess?: () => void
  initialData?: any
}

type StationeryItemFormData = {
  name: string
  category: string
  quantity: number
  unit: string
  reorder_level: number
}

export function StationeryItemForm({ onClose, onSuccess, initialData }: StationeryItemFormProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StationeryItemFormData>({
    defaultValues: initialData || {
      quantity: 0,
      reorder_level: 10,
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: StationeryItemFormData) => financeService.createStationeryItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stationery-items'] })
      toast.success('Stationery item added successfully!')
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to add stationery item')
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: StationeryItemFormData) =>
      financeService.updateStationeryItem(initialData.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stationery-items'] })
      toast.success('Stationery item updated successfully!')
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update stationery item')
    }
  })

  const onSubmit = (data: StationeryItemFormData) => {
    if (initialData) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {initialData ? 'Edit Stationery Item' : 'Add Stationery Item'}
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
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Item name is required' })}
              placeholder="e.g., Pencils, Notebooks"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              {...register('category', { required: 'Category is required' })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select category</option>
              <option value="Writing Materials">Writing Materials</option>
              <option value="Notebooks">Notebooks</option>
              <option value="Art Supplies">Art Supplies</option>
              <option value="Science Equipment">Science Equipment</option>
              <option value="Sports Equipment">Sports Equipment</option>
              <option value="Cleaning Supplies">Cleaning Supplies</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Other">Other</option>
            </select>
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                type="number"
                id="quantity"
                {...register('quantity', {
                  required: 'Quantity is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Must be 0 or greater' },
                })}
              />
              {errors.quantity && (
                <p className="text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <select
                id="unit"
                {...register('unit', { required: 'Unit is required' })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select unit</option>
                <option value="pieces">Pieces</option>
                <option value="boxes">Boxes</option>
                <option value="packs">Packs</option>
                <option value="sets">Sets</option>
                <option value="reams">Reams</option>
                <option value="units">Units</option>
              </select>
              {errors.unit && (
                <p className="text-sm text-red-600">{errors.unit.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reorder_level">Reorder Level *</Label>
            <Input
              type="number"
              id="reorder_level"
              {...register('reorder_level', {
                required: 'Reorder level is required',
                valueAsNumber: true,
                min: { value: 1, message: 'Must be at least 1' },
              })}
              placeholder="Alert when stock falls below this number"
            />
            {errors.reorder_level && (
              <p className="text-sm text-red-600">{errors.reorder_level.message}</p>
            )}
            <p className="text-xs text-gray-600">
              You'll be alerted when quantity falls below this level
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
                ? 'Update Item'
                : 'Add Item'}
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





