'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classService } from '@/services/classService'
import { studentService } from '@/services/studentService'
import { teacherService } from '@/services/teacherService'
import { gradeService } from '@/services/gradeService'
import { attendanceService } from '@/services/attendanceService'
import { EntityLink } from '@/components/shared/EntityLink'
import { Plus, Search, Edit, Trash2, Users, Eye, X, Calendar, FileText, BarChart3, GraduationCap } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ClassForm } from '@/components/classes/ClassForm'
import { StudentEnrollment } from '@/components/classes/StudentEnrollment'
import { Class, Teacher, Student, Grade } from '@/types'
import { useEffect } from 'react'

export default function ClassesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewClass, setViewClass] = useState<Class | null>(null)
  const [showEnrollment, setShowEnrollment] = useState(false)
  const [enrollmentClass, setEnrollmentClass] = useState<Class | null>(null)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const queryClient = useQueryClient()

  const selectedTeacherId = searchParams.get('teacher_id')
  const selectedClassId = searchParams.get('class_id')

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes', selectedTeacherId],
    queryFn: () => classService.getClasses({ 
      teacher_id: selectedTeacherId || undefined,
      limit: 1000 
    }),
  })

  // Auto-open class detail if class_id is in query params
  useEffect(() => {
    if (selectedClassId && classes.length > 0) {
      const classToView = classes.find((c: Class) => c.id === selectedClassId)
      if (classToView && !viewClass) {
        setViewClass(classToView)
        setShowViewModal(true)
      }
    }
  }, [selectedClassId, classes, viewClass])

  // Fetch students for viewed class
  const { data: classStudents = [] } = useQuery({
    queryKey: ['class-students', viewClass?.id],
    queryFn: () => classService.getClassStudents(viewClass!.id),
    enabled: !!viewClass?.id,
  })

  // Fetch teacher info for viewed class
  const { data: classTeacher } = useQuery({
    queryKey: ['teacher', viewClass?.teacher_id],
    queryFn: () => teacherService.getTeacher(viewClass!.teacher_id!),
    enabled: !!viewClass?.teacher_id,
  })

  // Fetch class grades for statistics
  const { data: classGrades = [] } = useQuery({
    queryKey: ['class-grades', viewClass?.id],
    queryFn: () => gradeService.getGrades({ class_id: viewClass!.id, limit: 1000 }),
    enabled: !!viewClass?.id,
  })

  // Fetch class attendance statistics
  const { data: classAttendance = [] } = useQuery({
    queryKey: ['class-attendance', viewClass?.id],
    queryFn: () => {
      if (!viewClass || !classStudents.length) return []
      const studentIds = classStudents.map((s: Student) => s.user_id).filter(Boolean)
      return attendanceService.getAttendance({ limit: 1000 })
    },
    enabled: !!viewClass?.id && classStudents.length > 0,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classService.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Class deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete class')
    }
  })

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(search.toLowerCase()) ||
    cls.section.toLowerCase().includes(search.toLowerCase()) ||
    cls.academic_year.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddClass = () => {
    setSelectedClass(null)
    setShowForm(true)
  }

  const handleEditClass = (classData: Class) => {
    setSelectedClass(classData)
    setShowForm(true)
  }

  const handleViewClass = (classData: Class) => {
    setViewClass(classData)
    setShowViewModal(true)
  }

  const handleManageStudents = (classData: Class) => {
    setEnrollmentClass(classData)
    setShowEnrollment(true)
  }

  const handleDeleteClass = (classData: Class) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Class',
      description: `Are you sure you want to delete ${classData.name} - ${classData.section}? This action cannot be undone.`,
      onConfirm: () => {
        deleteMutation.mutate(classData.id)
      },
    })
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['classes'] })
    setShowForm(false)
    setSelectedClass(null)
  }

  return (
    <DashboardLayout allowedRoles={['admin', 'principal']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Classes</h1>
            <p className="text-gray-600">Manage school classes</p>
          </div>
          <Button onClick={handleAddClass}>
            <Plus className="mr-2 h-4 w-4" />
            Create Class
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Classes</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search classes..."
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
            ) : filteredClasses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No classes found
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredClasses.map((cls) => (
                  <Card key={cls.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>
                          {cls.name} - {cls.section}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleViewClass(cls)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEditClass(cls)}
                            title="Edit Class"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeleteClass(cls)}
                            title="Delete Class"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Academic Year:</span>
                          <span className="font-medium">{cls.academic_year}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Teacher:</span>
                          <span className="font-medium">
                            {cls.teacher_id ? 'Assigned' : 'Not Assigned'}
                          </span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1" 
                            variant="outline"
                            onClick={() => handleManageStudents(cls)}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            Students
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/admin/attendance?class_id=${cls.id}`)}
                            title="View Attendance"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/admin/grades?class_id=${cls.id}`)}
                            title="View Grades"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class Form Modal */}
        {showForm && (
          <ClassForm
            classData={selectedClass || undefined}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
          />
        )}

        {/* Class View Modal */}
        {showViewModal && viewClass && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Class Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Class Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Class Name</Label>
                      <p className="text-sm font-semibold">{viewClass.name} - {viewClass.section}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Academic Year</Label>
                      <p className="text-sm">{viewClass.academic_year}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Class Teacher</Label>
                      {classTeacher ? (
                        <EntityLink 
                          href={`/admin/teachers?teacher_id=${classTeacher.id}`}
                          variant="badge"
                        >
                          {classTeacher.user?.full_name || classTeacher.employee_id}
                        </EntityLink>
                      ) : (
                        <p className="text-sm">{viewClass.teacher_id ? 'Assigned' : 'Not Assigned'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                      <p className="text-sm">{formatDate(viewClass.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Class Statistics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Class Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600">Total Students</p>
                            <p className="text-2xl font-bold text-blue-600">{classStudents.length}</p>
                          </div>
                          <Users className="h-8 w-8 text-blue-600 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600">Total Grades</p>
                            <p className="text-2xl font-bold text-purple-600">{classGrades.length}</p>
                          </div>
                          <FileText className="h-8 w-8 text-purple-600 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600">Avg Attendance</p>
                            <p className="text-2xl font-bold text-green-600">
                              {classAttendance.length > 0 
                                ? Math.round((classAttendance.filter((a: any) => a.status === 'present').length / classAttendance.length) * 100)
                                : 0}%
                            </p>
                          </div>
                          <Calendar className="h-8 w-8 text-green-600 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600">Avg Grade</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {classGrades.length > 0
                                ? (classGrades.reduce((sum: number, g: Grade) => sum + Number(g.marks), 0) / classGrades.length).toFixed(1)
                                : '0'}%
                            </p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-orange-600 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Students List Preview */}
                {classStudents.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Students ({classStudents.length})</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowViewModal(false)
                          handleManageStudents(viewClass)
                        }}
                      >
                        Manage All
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                      {classStudents.slice(0, 6).map((student: Student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium">{student.user?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{student.admission_number}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setShowViewModal(false)
                              router.push(`/admin/students?student_id=${student.id}`)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {classStudents.length > 6 && (
                        <div className="col-span-full text-center text-sm text-gray-500">
                          +{classStudents.length - 6} more students
                        </div>
                      )}
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
                        handleManageStudents(viewClass)
                      }}
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Manage Students
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowViewModal(false)
                        router.push(`/admin/attendance?class_id=${viewClass.id}`)
                      }}
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      View Attendance
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowViewModal(false)
                        router.push(`/admin/grades?class_id=${viewClass.id}`)
                      }}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Grades
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowViewModal(false)
                        router.push(`/admin/reports?class_id=${viewClass.id}&type=academic`)
                      }}
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Class Report
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowViewModal(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setShowViewModal(false)
                    handleEditClass(viewClass)
                  }}>
                    Edit Class
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Student Enrollment Modal */}
        {showEnrollment && enrollmentClass && (
          <StudentEnrollment
            classData={enrollmentClass}
            onClose={() => setShowEnrollment(false)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}



