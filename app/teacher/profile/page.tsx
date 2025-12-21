'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teacherService } from '@/services/teacherService'
import { classService } from '@/services/classService'
import { Edit, Save, X, Mail, Phone, MapPin, Calendar, GraduationCap, BookOpen } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toast'

export default function TeacherProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<any>(null)
  const queryClient = useQueryClient()

  // Fetch teacher profile
  const { data: teacherProfile, isLoading } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: () => teacherService.getMyProfile(),
  })

  // Fetch assigned classes
  const { data: classes = [] } = useQuery({
    queryKey: ['my-classes'],
    queryFn: () => teacherService.getMyClasses(),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => teacherService.updateTeacher(teacherProfile!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] })
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update profile')
    }
  })

  const handleStartEdit = () => {
    if (teacherProfile) {
      setEditedData({
        phone: teacherProfile.user?.phone || '',
        address: teacherProfile.user?.address || '',
      })
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    if (editedData) {
      updateMutation.mutate({
        phone: editedData.phone,
        address: editedData.address,
      })
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout allowedRoles={['teacher']}>
        <div className="text-center py-12 text-gray-500">Loading profile...</div>
      </DashboardLayout>
    )
  }

  if (!teacherProfile) {
    return (
      <DashboardLayout allowedRoles={['teacher']}>
        <div className="text-center py-12 text-gray-500">Profile not found</div>
      </DashboardLayout>
    )
  }

  const data = isEditing ? editedData : {
    phone: teacherProfile.user?.phone || '',
    address: teacherProfile.user?.address || '',
  }

  return (
    <DashboardLayout allowedRoles={['teacher']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">View and update your profile information</p>
          </div>
          {!isEditing && (
            <Button onClick={handleStartEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Teacher Information */}
        <Card>
          <CardHeader>
            <CardTitle>Teacher Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Employee ID</Label>
                <p className="text-sm font-semibold mt-1">{teacherProfile.employee_id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                <p className="text-sm font-semibold mt-1">
                  {teacherProfile.user?.full_name || 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">{teacherProfile.user?.email || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Phone</Label>
                {isEditing ? (
                  <Input
                    value={data.phone}
                    onChange={(e) => setEditedData({ ...data, phone: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{data.phone || 'N/A'}</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Join Date</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">{formatDate(teacherProfile.join_date)}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Qualification</Label>
                <div className="flex items-center gap-2 mt-1">
                  <GraduationCap className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">{teacherProfile.qualification}</p>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-600">Address</Label>
                {isEditing ? (
                  <Input
                    value={data.address}
                    onChange={(e) => setEditedData({ ...data, address: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{data.address || 'N/A'}</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <div className="mt-1">
                  <Badge className={
                    teacherProfile.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }>
                    {teacherProfile.status}
                  </Badge>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subjects */}
        <Card>
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {teacherProfile.subjects.map((subject: string) => (
                <Badge key={subject} className="bg-blue-100 text-blue-800 px-3 py-1">
                  {subject}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assigned Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-gray-500">No classes assigned</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {classes.map((cls: any) => (
                  <div key={cls.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold">{cls.name} - {cls.section}</p>
                        <p className="text-sm text-gray-600">{cls.academic_year}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary Information */}
        <Card>
          <CardHeader>
            <CardTitle>Salary Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Basic Salary</Label>
                <p className="text-lg font-semibold mt-1">
                  {teacherProfile.salary_info.currency} {teacherProfile.salary_info.basic_salary}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Allowances</Label>
                <p className="text-lg font-semibold mt-1">
                  {teacherProfile.salary_info.currency} {teacherProfile.salary_info.allowances || 0}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Total Salary</Label>
                <p className="text-lg font-semibold text-green-600 mt-1">
                  {teacherProfile.salary_info.currency} {
                    teacherProfile.salary_info.basic_salary + (teacherProfile.salary_info.allowances || 0)
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}









