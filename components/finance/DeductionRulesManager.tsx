'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { attendanceSalaryService, AttendanceRule } from '@/services/attendanceSalaryService'
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Settings,
  Clock,
  DollarSign,
  Percent,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

export function DeductionRulesManager() {
  const queryClient = useQueryClient()
  const [editingRule, setEditingRule] = useState<AttendanceRule | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Partial<AttendanceRule>>({
    rule_name: '',
    rule_type: 'absent',
    condition_description: '',
    deduction_type: 'percentage',
    deduction_value: 0,
    grace_minutes: 0,
    max_late_count: 3,
    is_active: true,
  })

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['attendance-rules'],
    queryFn: () => attendanceSalaryService.getAttendanceRules(),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => attendanceSalaryService.createAttendanceRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-rules'] })
      toast.success('Deduction rule created successfully!')
      setShowForm(false)
      resetForm()
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Failed to create deduction rule'
      toast.error(errorMessage)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      attendanceSalaryService.updateAttendanceRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-rules'] })
      toast.success('Deduction rule updated successfully!')
      setEditingRule(null)
      setShowForm(false)
      resetForm()
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Failed to update deduction rule'
      toast.error(errorMessage)
    }
  })

  const resetForm = () => {
    setFormData({
      rule_name: '',
      rule_type: 'absent',
      condition_description: '',
      deduction_type: 'percentage',
      deduction_value: 0,
      grace_minutes: 0,
      max_late_count: 3,
      is_active: true,
    })
  }

  const handleEdit = (rule: AttendanceRule) => {
    setEditingRule(rule)
    setFormData({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      condition_description: rule.condition_description,
      deduction_type: rule.deduction_type,
      deduction_value: rule.deduction_value,
      grace_minutes: rule.grace_minutes,
      max_late_count: rule.max_late_count,
      is_active: rule.is_active,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.rule_name || !formData.condition_description) {
      toast.error('Please fill in all required fields')
      return
    }

    if (editingRule) {
      updateMutation.mutate({
        id: editingRule.id,
        data: formData,
      })
    } else {
      createMutation.mutate(formData as any)
    }
  }

  const handleCancel = () => {
    setEditingRule(null)
    setShowForm(false)
    resetForm()
  }

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      late_coming: 'Late Coming',
      half_day: 'Half Day',
      absent: 'Absent',
      early_departure: 'Early Departure',
    }
    return labels[type] || type
  }

  const getDeductionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      percentage: 'Percentage',
      fixed_amount: 'Fixed Amount',
      full_day: 'Full Day',
      half_day: 'Half Day',
    }
    return labels[type] || type
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading deduction rules...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Attendance Deduction Rules</h3>
          <p className="text-sm text-gray-600">
            Configure rules for salary deductions based on attendance violations
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingRule ? 'Edit Deduction Rule' : 'Create New Deduction Rule'}
            </CardTitle>
            <CardDescription>
              Define how salary deductions are calculated for attendance violations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rule_name">Rule Name *</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    placeholder="e.g., Absent Day Deduction"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule_type">Rule Type *</Label>
                  <Select
                    value={formData.rule_type}
                    onValueChange={(value) => setFormData({ ...formData, rule_type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rule type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late_coming">Late Coming</SelectItem>
                      <SelectItem value="half_day">Half Day</SelectItem>
                      <SelectItem value="early_departure">Early Departure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition_description">Condition Description *</Label>
                <Textarea
                  id="condition_description"
                  value={formData.condition_description}
                  onChange={(e) => setFormData({ ...formData, condition_description: e.target.value })}
                  placeholder="Describe when this rule applies (e.g., 'Applies when teacher is absent')"
                  required
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deduction_type">Deduction Type *</Label>
                  <Select
                    value={formData.deduction_type}
                    onValueChange={(value) => setFormData({ ...formData, deduction_type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select deduction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                      <SelectItem value="full_day">Full Day Salary</SelectItem>
                      <SelectItem value="half_day">Half Day Salary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deduction_value">
                    Deduction Value *
                    {formData.deduction_type === 'percentage' && ' (%)'}
                    {formData.deduction_type === 'fixed_amount' && ' (Amount)'}
                  </Label>
                  <Input
                    type="number"
                    step={formData.deduction_type === 'percentage' ? '0.1' : '0.01'}
                    id="deduction_value"
                    value={formData.deduction_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deduction_value: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    required
                    min={0}
                    max={formData.deduction_type === 'percentage' ? 100 : undefined}
                  />
                </div>
              </div>

              {(formData.rule_type === 'late_coming' || formData.rule_type === 'early_departure') && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="grace_minutes">Grace Period (Minutes)</Label>
                    <Input
                      type="number"
                      id="grace_minutes"
                      value={formData.grace_minutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          grace_minutes: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="5"
                      min={0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_late_count">Max Late Count (Before Deduction)</Label>
                    <Input
                      type="number"
                      id="max_late_count"
                      value={formData.max_late_count}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_late_count: parseInt(e.target.value) || 3,
                        })
                      }
                      placeholder="3"
                      min={0}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active (Rule will be applied in calculations)
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No deduction rules configured</p>
                <p className="text-sm">Create your first rule to start applying salary deductions</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">{rule.rule_name}</h4>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                          <><ToggleLeft className="h-3 w-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                      <Badge variant="outline">{getRuleTypeLabel(rule.rule_type)}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{rule.condition_description}</p>
                    <div className="grid gap-3 md:grid-cols-3 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{getDeductionTypeLabel(rule.deduction_type)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {rule.deduction_type === 'percentage' ? (
                          <Percent className="h-4 w-4 text-gray-400" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-gray-600">Value:</span>
                        <span className="font-medium">
                          {rule.deduction_value}
                          {rule.deduction_type === 'percentage' ? '%' : ''}
                        </span>
                      </div>
                      {rule.grace_minutes > 0 && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Grace:</span>
                          <span className="font-medium">{rule.grace_minutes} min</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(rule)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}








