'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { settingsService, SystemSetting, RolePermission, FeeStructure, AcademicYear } from '@/services/settingsService'
import {
  Settings, Building2, DollarSign, Users, Shield, Bell, Palette, GraduationCap,
  Save, Plus, Edit2, Trash2, Check, X, Download
} from 'lucide-react'

type TabId = 'general' | 'academic' | 'financial' | 'permissions' | 'appearance' | 'notifications'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({})

  // Fetch all settings
  const { data: allSettings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSystemSettings()
  })

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => settingsService.getRolePermissions()
  })

  const { data: feeStructures = [] } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: () => settingsService.getFeeStructure()
  })

  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => settingsService.getAcademicYears()
  })

  // Group settings by category
  const settingsByCategory = allSettings.reduce((acc: Record<string, SystemSetting[]>, setting) => {
    if (!acc[setting.category]) acc[setting.category] = []
    acc[setting.category].push(setting)
    return acc
  }, {})

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (settings: Record<string, string>) => settingsService.bulkUpdateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings updated successfully!')
      setEditingSettings({})
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update settings')
    }
  })

  const handleInputChange = (key: string, value: string) => {
    setEditingSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveCategory = (category: string) => {
    const categorySettings = settingsByCategory[category] || []
    const updates: Record<string, string> = {}
    
    categorySettings.forEach(setting => {
      if (editingSettings[setting.setting_key] !== undefined) {
        updates[setting.setting_key] = editingSettings[setting.setting_key]
      }
    })

    if (Object.keys(updates).length > 0) {
      bulkUpdateMutation.mutate(updates)
    }
  }

  const tabs = [
    { id: 'general' as TabId, name: 'General', icon: Building2 },
    { id: 'academic' as TabId, name: 'Academic', icon: GraduationCap },
    { id: 'financial' as TabId, name: 'Financial', icon: DollarSign },
    { id: 'permissions' as TabId, name: 'Permissions', icon: Shield },
    { id: 'appearance' as TabId, name: 'Appearance', icon: Palette },
    { id: 'notifications' as TabId, name: 'Notifications', icon: Bell },
  ]

  const renderSettingField = (setting: SystemSetting) => {
    const currentValue = editingSettings[setting.setting_key] ?? setting.setting_value

    if (setting.setting_type === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={currentValue === 'true'}
            onChange={(e) => handleInputChange(setting.setting_key, e.target.checked ? 'true' : 'false')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">{setting.description}</span>
        </div>
      )
    }

    if (setting.setting_type === 'number') {
      return (
        <div>
          <Label htmlFor={setting.setting_key}>{setting.description || setting.setting_key}</Label>
          <Input
            type="number"
            id={setting.setting_key}
            value={currentValue}
            onChange={(e) => handleInputChange(setting.setting_key, e.target.value)}
            className="mt-1"
          />
        </div>
      )
    }

    return (
      <div>
        <Label htmlFor={setting.setting_key}>{setting.description || setting.setting_key}</Label>
        <Input
          type="text"
          id={setting.setting_key}
          value={currentValue}
          onChange={(e) => handleInputChange(setting.setting_key, e.target.value)}
          className="mt-1"
          placeholder={setting.setting_value}
        />
      </div>
    )
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">Manage your school system configuration and preferences</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Settings
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic information about your school</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {(settingsByCategory['general'] || []).map((setting) => (
                    <div key={setting.id}>
                      {renderSettingField(setting)}
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button onClick={() => handleSaveCategory('general')} disabled={bulkUpdateMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {bulkUpdateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Academic Settings */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Academic Settings</CardTitle>
                  <CardDescription>Configure academic year, terms, and grading</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {(settingsByCategory['academic'] || []).map((setting) => (
                      <div key={setting.id}>
                        {renderSettingField(setting)}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Button onClick={() => handleSaveCategory('academic')} disabled={bulkUpdateMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      {bulkUpdateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Academic Years */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Academic Years</CardTitle>
                      <CardDescription>Manage academic year periods</CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Academic Year
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {academicYears.map((year) => (
                      <div
                        key={year.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-medium">{year.year_name}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                            </div>
                          </div>
                          {year.is_current && (
                            <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Financial Settings */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Settings</CardTitle>
                  <CardDescription>Configure currency, pricing, and billing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {(settingsByCategory['financial'] || []).map((setting) => (
                      <div key={setting.id}>
                        {renderSettingField(setting)}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Button onClick={() => handleSaveCategory('financial')} disabled={bulkUpdateMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      {bulkUpdateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Fee Structure */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Fee Structure</CardTitle>
                      <CardDescription>Manage class fees and charges</CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Fee
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Class Level</th>
                          <th className="text-left py-3 px-4">Fee Type</th>
                          <th className="text-right py-3 px-4">Amount</th>
                          <th className="text-left py-3 px-4">Academic Year</th>
                          <th className="text-center py-3 px-4">Status</th>
                          <th className="text-center py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feeStructures.map((fee) => (
                          <tr key={fee.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{fee.class_level}</td>
                            <td className="py-3 px-4 capitalize">{fee.fee_type}</td>
                            <td className="py-3 px-4 text-right font-medium">
                              {fee.currency} {fee.amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4">{fee.academic_year}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                fee.is_active
                                  ? 'text-green-700 bg-green-50'
                                  : 'text-gray-700 bg-gray-100'
                              }`}>
                                {fee.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center gap-2">
                                <Button size="sm" variant="outline">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Permissions Settings */}
          {activeTab === 'permissions' && (
            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>Manage what each user role can access and modify</CardDescription>
              </CardHeader>
              <CardContent>
                <PermissionsTable permissions={permissions} />
              </CardContent>
            </Card>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of your system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {(settingsByCategory['appearance'] || []).map((setting) => (
                    <div key={setting.id}>
                      {renderSettingField(setting)}
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button onClick={() => handleSaveCategory('appearance')} disabled={bulkUpdateMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {bulkUpdateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how and when users receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(settingsByCategory['notification'] || []).map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{setting.description || setting.setting_key}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {setting.setting_key}
                        </div>
                      </div>
                      {renderSettingField(setting)}
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button onClick={() => handleSaveCategory('notification')} disabled={bulkUpdateMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {bulkUpdateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

// Permissions Table Component
function PermissionsTable({ permissions }: { permissions: RolePermission[] }) {
  const queryClient = useQueryClient()

  // Group permissions by role
  const permissionsByRole = permissions.reduce((acc: Record<string, Record<string, boolean>>, perm) => {
    if (!acc[perm.role]) acc[perm.role] = {}
    acc[perm.role][perm.permission_key] = perm.permission_value
    return acc
  }, {})

  const permissionKeys = Array.from(new Set(permissions.map(p => p.permission_key)))
  const roles = ['admin', 'principal', 'teacher', 'student'] as const

  const updatePermissionMutation = useMutation({
    mutationFn: ({ role, key, value }: { role: string; key: string; value: boolean }) =>
      settingsService.updateRolePermission(role, key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      toast.success('Permission updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update permission')
    }
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium">Permission</th>
            {roles.map((role) => (
              <th key={role} className="text-center py-3 px-4 font-medium capitalize">
                {role}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissionKeys.map((key) => (
            <tr key={key} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4 font-medium capitalize">
                {key.replace(/_/g, ' ')}
              </td>
              {roles.map((role) => (
                <td key={`${role}-${key}`} className="py-3 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={permissionsByRole[role]?.[key] || false}
                    onChange={(e) =>
                      updatePermissionMutation.mutate({
                        role,
                        key,
                        value: e.target.checked
                      })
                    }
                    disabled={role === 'admin'} // Admin always has all permissions
                    className="h-5 w-5 rounded border-gray-300"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}