'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Edit, Trash2, Save, X, Check, AlertCircle, 
  Settings, Award, Info, ArrowUp, ArrowDown
} from 'lucide-react'
import { gradingSchemeService, GradingScheme, GradingCriterion } from '@/services/gradingSchemeService'

export default function GradingSchemesPage() {
  const queryClient = useQueryClient()
  const [editingScheme, setEditingScheme] = useState<GradingScheme | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    is_default: false,
    criteria: [] as Omit<GradingCriterion, 'id'>[]
  })

  const { data: schemes = [], isLoading } = useQuery({
    queryKey: ['grading-schemes'],
    queryFn: () => gradingSchemeService.getGradingSchemes({ include_default: true }),
  })

  const { data: defaultScheme } = useQuery({
    queryKey: ['default-grading-scheme'],
    queryFn: () => gradingSchemeService.getDefaultGradingScheme(),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => gradingSchemeService.createGradingScheme(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-schemes'] })
      queryClient.invalidateQueries({ queryKey: ['default-grading-scheme'] })
      toast.success('Grading scheme created successfully!')
      setIsCreating(false)
      resetForm()
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          error?.message || 
                          'Failed to create grading scheme'
      toast.error(errorMessage)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GradingScheme> }) => 
      gradingSchemeService.updateGradingScheme(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-schemes'] })
      queryClient.invalidateQueries({ queryKey: ['default-grading-scheme'] })
      toast.success('Grading scheme updated successfully!')
      setEditingScheme(null)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          error?.message || 
                          'Failed to update grading scheme'
      toast.error(errorMessage)
    }
  })

  const updateCriteriaMutation = useMutation({
    mutationFn: ({ id, criteria }: { id: string; criteria: Omit<GradingCriterion, 'id'>[] }) =>
      gradingSchemeService.updateGradingSchemeCriteria(id, criteria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-schemes'] })
      queryClient.invalidateQueries({ queryKey: ['default-grading-scheme'] })
      toast.success('Grading criteria updated successfully!')
      setEditingScheme(null)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          error?.message || 
                          'Failed to update grading criteria'
      toast.error(errorMessage)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradingSchemeService.deleteGradingScheme(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-schemes'] })
      queryClient.invalidateQueries({ queryKey: ['default-grading-scheme'] })
      toast.success('Grading scheme deleted successfully!')
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          error?.message || 
                          'Failed to delete grading scheme'
      toast.error(errorMessage)
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
      is_default: false,
      criteria: []
    })
  }

  const handleStartCreate = () => {
    resetForm()
    setIsCreating(true)
    setEditingScheme(null)
  }

  const handleStartEdit = (scheme: GradingScheme) => {
    setEditingScheme(scheme)
    setFormData({
      name: scheme.name,
      description: scheme.description || '',
      is_active: scheme.is_active,
      is_default: scheme.is_default,
      criteria: scheme.criteria.map(c => ({
        grade_name: c.grade_name,
        min_marks: c.min_marks,
        max_marks: c.max_marks,
        gpa_value: c.gpa_value,
        is_passing: c.is_passing,
        display_order: c.display_order
      }))
    })
    setIsCreating(false)
  }

  const handleAddCriterion = () => {
    const newCriterion: Omit<GradingCriterion, 'id'> = {
      grade_name: '',
      min_marks: 0,
      max_marks: 100,
      gpa_value: 0,
      is_passing: true,
      display_order: formData.criteria.length
    }
    setFormData({
      ...formData,
      criteria: [...formData.criteria, newCriterion]
    })
  }

  const handleUpdateCriterion = (index: number, field: keyof Omit<GradingCriterion, 'id'>, value: any) => {
    const updated = [...formData.criteria]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, criteria: updated })
  }

  const handleRemoveCriterion = (index: number) => {
    const updated = formData.criteria.filter((_, i) => i !== index)
    // Update display_order
    updated.forEach((c, i) => {
      c.display_order = i
    })
    setFormData({ ...formData, criteria: updated })
  }

  const handleMoveCriterion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === formData.criteria.length - 1) return

    const updated = [...formData.criteria]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    
    // Update display_order
    updated.forEach((c, i) => {
      c.display_order = i
    })
    
    setFormData({ ...formData, criteria: updated })
  }

  const handleSave = () => {
    // Validate
    if (!formData.name.trim()) {
      toast.error('Please enter a scheme name')
      return
    }

    if (formData.criteria.length === 0) {
      toast.error('Please add at least one grading criterion')
      return
    }

    // Validate criteria
    for (let i = 0; i < formData.criteria.length; i++) {
      const c = formData.criteria[i]
      if (!c.grade_name.trim()) {
        toast.error(`Criterion ${i + 1}: Grade name is required`)
        return
      }
      if (c.min_marks < 0 || c.min_marks > 100) {
        toast.error(`Criterion ${i + 1}: Min marks must be 0-100`)
        return
      }
      if (c.max_marks < 0 || c.max_marks > 100) {
        toast.error(`Criterion ${i + 1}: Max marks must be 0-100`)
        return
      }
      if (c.min_marks > c.max_marks) {
        toast.error(`Criterion ${i + 1}: Min marks cannot be greater than max marks`)
        return
      }
      if (c.gpa_value < 0 || c.gpa_value > 4.0) {
        toast.error(`Criterion ${i + 1}: GPA value must be 0-4.0`)
        return
      }
    }

    // Check for overlapping ranges
    const sorted = [...formData.criteria].sort((a, b) => a.display_order - b.display_order)
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].max_marks >= sorted[i + 1].min_marks) {
        toast.error(`Overlapping mark ranges: ${sorted[i].grade_name} and ${sorted[i + 1].grade_name}`)
        return
      }
    }

    if (isCreating) {
      createMutation.mutate(formData)
    } else if (editingScheme) {
      // Update scheme info
      updateMutation.mutate({
        id: editingScheme.id,
        data: {
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active,
          is_default: formData.is_default
        }
      }, {
        onSuccess: () => {
          // Update criteria
          updateCriteriaMutation.mutate({
            id: editingScheme.id,
            criteria: formData.criteria
          })
        }
      })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this grading scheme? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSetDefault = (id: string) => {
    updateMutation.mutate({
      id,
      data: { is_default: true }
    })
  }

  return (
    <DashboardLayout allowedRoles={['admin', 'principal']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grading Schemes Management</h1>
            <p className="text-gray-600 mt-1">Configure custom grading criteria for your school</p>
          </div>
          {!isCreating && !editingScheme && (
            <Button onClick={handleStartCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Scheme
            </Button>
          )}
        </div>

        {/* Info Card */}
        {defaultScheme && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">Active Grading Scheme</p>
                  <p className="text-sm text-blue-700">{defaultScheme.name}</p>
                  {defaultScheme.description && (
                    <p className="text-xs text-blue-600 mt-1">{defaultScheme.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingScheme) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isCreating ? 'Create New Grading Scheme' : 'Edit Grading Scheme'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Scheme Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Standard Grading System"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this grading scheme..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span>Set as Default</span>
                  </label>
                </div>
              </div>

              {/* Criteria */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Grading Criteria *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCriterion}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Criterion
                  </Button>
                </div>

                {formData.criteria.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    <Award className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No criteria added yet. Click "Add Criterion" to start.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.criteria
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((criterion, index) => (
                        <Card key={index} className="p-4">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-12 md:col-span-2">
                              <Label>Grade Name *</Label>
                              <Input
                                value={criterion.grade_name}
                                onChange={(e) => handleUpdateCriterion(index, 'grade_name', e.target.value)}
                                placeholder="A+"
                              />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                              <Label>Min Marks *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={criterion.min_marks}
                                onChange={(e) => handleUpdateCriterion(index, 'min_marks', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                              <Label>Max Marks *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={criterion.max_marks}
                                onChange={(e) => handleUpdateCriterion(index, 'max_marks', parseFloat(e.target.value) || 100)}
                              />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                              <Label>GPA Value</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="4.0"
                                value={criterion.gpa_value}
                                onChange={(e) => handleUpdateCriterion(index, 'gpa_value', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="col-span-6 md:col-span-2 flex items-end gap-2">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={criterion.is_passing}
                                  onChange={(e) => handleUpdateCriterion(index, 'is_passing', e.target.checked)}
                                  className="h-4 w-4"
                                />
                                <span className="text-sm">Passing</span>
                              </label>
                            </div>
                            <div className="col-span-12 md:col-span-2 flex gap-2 items-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveCriterion(index, 'up')}
                                disabled={index === 0}
                                title="Move up"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveCriterion(index, 'down')}
                                disabled={index === formData.criteria.length - 1}
                                title="Move down"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveCriterion(index)}
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false)
                    setEditingScheme(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending || updateCriteriaMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? 'Create Scheme' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schemes List */}
        {!isCreating && !editingScheme && (
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-12">Loading grading schemes...</div>
            ) : schemes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No Grading Schemes</p>
                  <p>Create your first grading scheme to customize grade calculations</p>
                </CardContent>
              </Card>
            ) : (
              schemes.map((scheme) => (
                <Card key={scheme.id} className={scheme.is_default ? 'border-blue-500 border-2' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle>{scheme.name}</CardTitle>
                          {scheme.is_default && (
                            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                              Default
                            </span>
                          )}
                          {!scheme.is_active && (
                            <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        {scheme.description && (
                          <p className="text-sm text-gray-600 mt-1">{scheme.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!scheme.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(scheme.id)}
                            title="Set as default"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit(scheme)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!scheme.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(scheme.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold mb-3">Grading Criteria ({scheme.criteria.length} grades):</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                        {scheme.criteria
                          .sort((a, b) => (b.display_order || 0) - (a.display_order || 0))
                          .map((criterion) => (
                            <div
                              key={criterion.id || criterion.grade_name}
                              className="p-3 border rounded-lg text-center"
                            >
                              <div className="font-bold text-lg">{criterion.grade_name}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                {criterion.min_marks}-{criterion.max_marks}%
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                GPA: {criterion.gpa_value}
                              </div>
                              {!criterion.is_passing && (
                                <div className="text-xs text-red-600 mt-1">Failing</div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}






