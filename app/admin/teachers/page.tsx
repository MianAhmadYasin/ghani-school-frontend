'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teacherService } from '@/services/teacherService'
import { classService } from '@/services/classService'
import { studentService } from '@/services/studentService'
import { attendanceService } from '@/services/attendanceService'
import { gradeService } from '@/services/gradeService'
import { EntityLink } from '@/components/shared/EntityLink'
import { Plus, Search, Edit, Trash2, Eye, X, BookOpen, Users, Calendar, BarChart3, FileText, Award } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { TeacherForm } from '@/components/teachers/TeacherForm'
import { Teacher, Class, Student } from '@/types'

export default function TeachersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null)
  const queryClient = useQueryClient()

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers', search],
    queryFn: () => teacherService.getTeachers({ search, limit: 1000 }),
  })

  // Fetch classes for selected teacher
  const { data: teacherClasses = [] } = useQuery({
    queryKey: ['classes', viewTeacher?.id],
    queryFn: () => classService.getClasses({ teacher_id: viewTeacher!.id, limit: 1000 }),
    enabled: !!viewTeacher?.id,
  })

  // Fetch all classes for students count
  const { data: allClasses = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classService.getClasses({ limit: 1000 }),
  })

  // Fetch students in teacher's classes
  const { data: teacherStudents = [] } = useQuery({
    queryKey: ['teacher-students', viewTeacher?.id],
    queryFn: async () => {
      const classes = await classService.getClasses({ teacher_id: viewTeacher!.id, limit: 1000 })
      const allStudents: Student[] = []
      for (const cls of classes) {
        const students = await classService.getClassStudents(cls.id)
        allStudents.push(...students)
      }
      return allStudents
    },
    enabled: !!viewTeacher?.id && teacherClasses.length > 0,
  })

  // Get students count for teacher's classes
  const teacherStats = useMemo(() => {
    if (!viewTeacher) return null
    
    const assignedClasses = allClasses.filter((cls: Class) => cls.teacher_id === viewTeacher.id)
    
    return {
      assignedClasses: assignedClasses.length,
      classNames: assignedClasses.map((cls: Class) => `${cls.name} - ${cls.section}`).join(', ') || 'None',
    }
  }, [viewTeacher, allClasses])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teacherService.deleteTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      toast.success('Teacher deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete teacher')
    }
  })

  const filteredTeachers = teachers.filter(teacher =>
    teacher.employee_id.toLowerCase().includes(search.toLowerCase()) ||
    teacher.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    teacher.qualification.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddTeacher = () => {
    setSelectedTeacher(null)
    setShowForm(true)
  }

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setShowForm(true)
  }

  const handleViewTeacher = (teacher: Teacher) => {
    setViewTeacher(teacher)
    setShowViewModal(true)
  }

  const handleDeleteTeacher = (teacher: Teacher) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Teacher',
      description: `Are you sure you want to delete ${teacher.user?.full_name || teacher.employee_id}? This action cannot be undone.`,
      onConfirm: () => {
        deleteMutation.mutate(teacher.id)
      },
    })
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['teachers'] })
    setShowForm(false)
    setSelectedTeacher(null)
  }

  const handleViewClasses = (teacher: Teacher) => {
    router.push(`/admin/classes?teacher_id=${teacher.id}`)
  }

  const handleMarkAttendance = (teacher: Teacher) => {
    router.push(`/admin/attendance?user_id=${teacher.user_id}&tab=teachers`)
  }

  return (
    <DashboardLayout allowedRoles={['admin', 'principal']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Teachers</h1>
            <p className="text-gray-600">Manage teacher records</p>
          </div>
          <Button onClick={handleAddTeacher}>
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Teachers</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search teachers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No teachers found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Employee ID</th>
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Join Date</th>
                      <th className="text-left py-3 px-4">Qualification</th>
                      <th className="text-left py-3 px-4">Subjects</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((teacher) => (
                      <tr key={teacher.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {teacher.employee_id}
                        </td>
                        <td className="py-3 px-4">
                          {teacher.user?.full_name || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          {formatDate(teacher.join_date)}
                        </td>
                        <td className="py-3 px-4">{teacher.qualification}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {teacher.subjects.slice(0, 2).map((subject) => (
                              <span
                                key={subject}
                                className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800"
                              >
                                {subject}
                              </span>
                            ))}
                            {teacher.subjects.length > 2 && (
                              <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                                +{teacher.subjects.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              teacher.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {teacher.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleViewTeacher(teacher)}
                              title="View Details"
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleViewClasses(teacher)}
                              title="View Classes"
                              className="h-8 w-8 p-0"
                            >
                              <BookOpen className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleMarkAttendance(teacher)}
                              title="Mark Attendance"
                              className="h-8 w-8 p-0"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEditTeacher(teacher)}
                              title="Edit Teacher"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteTeacher(teacher)}
                              title="Delete Teacher"
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teacher Form Modal */}
        {showForm && (
          <TeacherForm
            teacher={selectedTeacher || undefined}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
          />
        )}

        {/* Teacher View Modal */}
        {showViewModal && viewTeacher && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Teacher Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Teacher Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Teacher Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Employee ID</Label>
                      <p className="text-sm">{viewTeacher.employee_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                      <p className="text-sm">{viewTeacher.user?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-sm">{viewTeacher.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone</Label>
                      <p className="text-sm">{viewTeacher.user?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Join Date</Label>
                      <p className="text-sm">{formatDate(viewTeacher.join_date)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Qualification</Label>
                      <p className="text-sm">{viewTeacher.qualification}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          viewTeacher.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {viewTeacher.status}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-600">Address</Label>
                      <p className="text-sm">{viewTeacher.user?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Subjects */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewTeacher.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Salary Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Salary Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Basic Salary</Label>
                      <p className="text-sm">{viewTeacher.salary_info.currency} {viewTeacher.salary_info.basic_salary}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Allowances</Label>
                      <p className="text-sm">{viewTeacher.salary_info.currency} {viewTeacher.salary_info.allowances || 0}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Total Salary</Label>
                      <p className="text-sm font-semibold text-green-600">
                        {viewTeacher.salary_info.currency} {(viewTeacher.salary_info.basic_salary + (viewTeacher.salary_info.allowances || 0))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assigned Classes & Stats */}
                {teacherStats && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Assigned Classes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-600">Total Classes</p>
                              <p className="text-2xl font-bold text-blue-600">{teacherStats.assignedClasses}</p>
                            </div>
                            <BookOpen className="h-8 w-8 text-blue-600 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-600">Total Students</p>
                              <p className="text-2xl font-bold text-green-600">{teacherStudents.length}</p>
                            </div>
                            <Users className="h-8 w-8 text-green-600 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-2">Class Names</p>
                            <div className="flex flex-wrap gap-2">
                              {teacherClasses.length > 0 ? (
                                teacherClasses.map((cls: Class) => (
                                  <EntityLink
                                    key={cls.id}
                                    href={`/admin/classes?class_id=${cls.id}`}
                                    variant="badge"
                                  >
                                    {cls.name} - {cls.section}
                                  </EntityLink>
                                ))
                              ) : (
                                <p className="text-sm font-medium">No classes assigned</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowViewModal(false)
                        handleViewClasses(viewTeacher)
                      }}
                      className="flex items-center gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      View Classes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (teacherClasses.length > 0) {
                          const firstClass = teacherClasses[0]
                          router.push(`/admin/classes?class_id=${firstClass.id}&view=students`)
                        } else {
                          router.push('/admin/classes')
                        }
                      }}
                      className="flex items-center gap-2"
                      disabled={!teacherClasses.length}
                    >
                      <Users className="h-4 w-4" />
                      View Students ({teacherStudents.length})
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (teacherClasses.length > 0) {
                          const firstClass = teacherClasses[0]
                          router.push(`/admin/grades?class_id=${firstClass.id}`)
                        }
                      }}
                      className="flex items-center gap-2"
                      disabled={!teacherClasses.length}
                    >
                      <Award className="h-4 w-4" />
                      View Grades
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowViewModal(false)
                        handleMarkAttendance(viewTeacher)
                      }}
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Mark Attendance
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowViewModal(false)
                        router.push(`/admin/reports?teacher_id=${viewTeacher.id}&type=academic`)
                      }}
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Performance
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowViewModal(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setShowViewModal(false)
                    handleEditTeacher(viewTeacher)
                  }}>
                    Edit Teacher
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}



