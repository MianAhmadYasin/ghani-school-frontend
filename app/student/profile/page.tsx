'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentService } from '@/services/studentService'
import { classService } from '@/services/classService'
import { User, Edit, Save, X, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toast'

export default function StudentProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<any>(null)
  const queryClient = useQueryClient()

  // Fetch student profile
  const { data: studentProfile, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => studentService.getMyProfile(),
  })

  // Fetch class info
  const { data: classInfo } = useQuery({
    queryKey: ['my-class', studentProfile?.class_id],
    queryFn: () => classService.getClass(studentProfile!.class_id!),
    enabled: !!studentProfile?.class_id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => studentService.updateStudent(studentProfile!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile'] })
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update profile')
    }
  })

  const handleStartEdit = () => {
    if (studentProfile) {
      setEditedData({
        phone: studentProfile.user?.phone || '',
        address: studentProfile.user?.address || '',
        guardian_name: studentProfile.guardian_info.name,
        guardian_phone: studentProfile.guardian_info.phone,
        guardian_email: studentProfile.guardian_info.email || '',
        guardian_address: studentProfile.guardian_info.address || '',
      })
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    if (editedData) {
      updateMutation.mutate({
        phone: editedData.phone,
        address: editedData.address,
        guardian_info: {
          name: editedData.guardian_name,
          phone: editedData.guardian_phone,
          email: editedData.guardian_email,
          address: editedData.guardian_address,
        }
      })
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="text-center py-12 text-gray-500">Loading profile...</div>
      </DashboardLayout>
    )
  }

  if (!studentProfile) {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="text-center py-12 text-gray-500">Profile not found</div>
      </DashboardLayout>
    )
  }

  const data = isEditing ? editedData : {
    phone: studentProfile.user?.phone || '',
    address: studentProfile.user?.address || '',
    guardian_name: studentProfile.guardian_info.name,
    guardian_phone: studentProfile.guardian_info.phone,
    guardian_email: studentProfile.guardian_info.email || '',
    guardian_address: studentProfile.guardian_info.address || '',
  }

  return (
    <DashboardLayout allowedRoles={['student']}>
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

        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                <p className="text-sm font-semibold mt-1">
                  {studentProfile.user?.full_name || 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Admission Number</Label>
                <p className="text-sm font-semibold mt-1">{studentProfile.admission_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">{studentProfile.user?.email || 'N/A'}</p>
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
                <Label className="text-sm font-medium text-gray-600">Class</Label>
                <p className="text-sm font-semibold mt-1">
                  {classInfo ? `${classInfo.name} - ${classInfo.section}` : 'Not assigned'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Admission Date</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">{formatDate(studentProfile.admission_date)}</p>
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
                    studentProfile.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }>
                    {studentProfile.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guardian Information */}
        <Card>
          <CardHeader>
            <CardTitle>Guardian Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Guardian Name</Label>
                {isEditing ? (
                  <Input
                    value={data.guardian_name}
                    onChange={(e) => setEditedData({ ...data, guardian_name: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-semibold mt-1">{data.guardian_name}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Relation</Label>
                <p className="text-sm capitalize mt-1">
                  {studentProfile.guardian_info.relation}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Guardian Phone</Label>
                {isEditing ? (
                  <Input
                    value={data.guardian_phone}
                    onChange={(e) => setEditedData({ ...data, guardian_phone: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{data.guardian_phone}</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Guardian Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={data.guardian_email}
                    onChange={(e) => setEditedData({ ...data, guardian_email: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{data.guardian_email || 'N/A'}</p>
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-600">Guardian Address</Label>
                {isEditing ? (
                  <Input
                    value={data.guardian_address}
                    onChange={(e) => setEditedData({ ...data, guardian_address: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{data.guardian_address || 'N/A'}</p>
                  </div>
                )}
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
      </div>
    </DashboardLayout>
  )
}









