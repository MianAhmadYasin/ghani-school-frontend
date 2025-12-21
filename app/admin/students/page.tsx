'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentService } from '@/services/studentService'
import { gradeService } from '@/services/gradeService'
import { attendanceService } from '@/services/attendanceService'
import { classService } from '@/services/classService'
import { ReportCardModal } from '@/components/shared/ReportCardModal'
import { EntityLink } from '@/components/shared/EntityLink'
import { Plus, Search, Edit, Trash2, Eye, X, FileText, Calendar, Award, BarChart3, TrendingUp, BookOpen } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { StudentForm } from '@/components/students/StudentForm'
import { Student, Grade, Attendance, Class } from '@/types'

export default function StudentsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewStudent, setViewStudent] = useState<Student | null>(null)
  const [showReportCardModal, setShowReportCardModal] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  })
  const queryClient = useQueryClient()

  const { data: students = [], isLoading, refetch } = useQuery({
    queryKey: ['students', search],
    queryFn: () => studentService.getStudents({ search, limit: 1000 }),
  })

  // Fetch grades for selected student
  const { data: studentGrades = [] } = useQuery({
    queryKey: ['grades', viewStudent?.id],
    queryFn: () => gradeService.getGrades({ student_id: viewStudent!.id, limit: 1000 }),
    enabled: !!viewStudent?.id,
  })

  // Fetch attendance for selected student
  const { data: studentAttendance = [] } = useQuery({
    queryKey: ['attendance', viewStudent?.user_id],
    queryFn: () => attendanceService.getAttendance({ 
      user_id: viewStudent!.user_id, 
      limit: 1000 
    }),
    enabled: !!viewStudent?.user_id,
  })

  // Fetch class information for selected student
  const { data: classInfo } = useQuery({
    queryKey: ['class', viewStudent?.class_id],
    queryFn: () => classService.getClass(viewStudent!.class_id!),
    enabled: !!viewStudent?.class_id,
  })

  // Calculate student statistics
  const studentStats = useMemo(() => {
    if (!viewStudent) return null
    
    const totalGrades = studentGrades.length
    const passingGrades = studentGrades.filter((g: Grade) => Number(g.marks) >= 50).length
    const averageMarks = totalGrades > 0
      ? (studentGrades.reduce((sum: number, g: Grade) => sum + Number(g.marks), 0) / totalGrades).toFixed(1)
      : 0
    
    const totalAttendance = studentAttendance.length
    const presentAttendance = studentAttendance.filter((a: Attendance) => a.status === 'present').length
    const attendanceRate = totalAttendance > 0
      ? Math.round((presentAttendance / totalAttendance) * 100)
      : 0

    return {
      totalGrades,
      passingGrades,
      averageMarks,
      attendanceRate,
      totalAttendance,
      presentAttendance,
    }
  }, [viewStudent, studentGrades, studentAttendance])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete student')
    }
  })

  const filteredStudents = students.filter(student =>
    student.admission_number.toLowerCase().includes(search.toLowerCase()) ||
    student.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    student.guardian_info.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddStudent = () => {
    setSelectedStudent(null)
    setShowForm(true)
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setShowForm(true)
  }

  const handleViewStudent = (student: Student) => {
    setViewStudent(student)
    setShowViewModal(true)
  }

  const handleDeleteStudent = (student: Student) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Student',
      description: `Are you sure you want to delete ${student.user?.full_name || student.admission_number}? This action cannot be undone.`,
      onConfirm: () => {
        deleteMutation.mutate(student.id)
      },
    })
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['students'] })
    setShowForm(false)
    setSelectedStudent(null)
  }

  const handleViewGrades = (student: Student) => {
    router.push(`/admin/grades?student_id=${student.id}`)
  }

  const handleViewAttendance = (student: Student) => {
    router.push(`/admin/attendance?user_id=${student.user_id}`)
  }

  const handleViewReportCard = (student: Student) => {
    setViewStudent(student)
    setShowReportCardModal(true)
  }

  return (
    <DashboardLayout allowedRoles={['admin', 'principal']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Students</h1>
            <p className="text-gray-600">Manage student records</p>
          </div>
          <Button onClick={handleAddStudent}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Students</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search students..."
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
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No students found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Admission No.</th>
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Admission Date</th>
                      <th className="text-left py-3 px-4">Guardian</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {student.admission_number}
                        </td>
                        <td className="py-3 px-4">
                          {student.user?.full_name || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          {formatDate(student.admission_date)}
                        </td>
                        <td className="py-3 px-4">
                          {student.guardian_info.name}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              student.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleViewStudent(student)}
                              title="View Details"
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleViewGrades(student)}
                              title="View Grades"
                              className="h-8 w-8 p-0"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleViewAttendance(student)}
                              title="View Attendance"
                              className="h-8 w-8 p-0"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEditStudent(student)}
                              title="Edit Student"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteStudent(student)}
                              title="Delete Student"
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

        {/* Student Form Modal */}
        {showForm && (
          <StudentForm
            student={selectedStudent || undefined}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
          />
        )}

        {/* Student View Modal */}
        {showViewModal && viewStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Student Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Student Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Student Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Admission Number</Label>
                      <p className="text-sm">{viewStudent.admission_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                      <p className="text-sm">{viewStudent.user?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-sm">{viewStudent.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone</Label>
                      <p className="text-sm">{viewStudent.user?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Admission Date</Label>
                      <p className="text-sm">{formatDate(viewStudent.admission_date)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Class</Label>
                      {classInfo ? (
                        <EntityLink 
                          href={`/admin/classes?class_id=${classInfo.id}`}
                          variant="badge"
                        >
                          {classInfo.name} - {classInfo.section}
                        </EntityLink>
                      ) : (
                        <p className="text-sm">Not assigned</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          viewStudent.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {viewStudent.status}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-600">Address</Label>
                      <p className="text-sm">{viewStudent.user?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Guardian Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Guardian Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Guardian Name</Label>
                      <p className="text-sm">{viewStudent.guardian_info.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Relation</Label>
                      <p className="text-sm capitalize">{viewStudent.guardian_info.relation}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Guardian Phone</Label>
                      <p className="text-sm">{viewStudent.guardian_info.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Guardian Email</Label>
                      <p className="text-sm">{viewStudent.guardian_info.email || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-600">Guardian Address</Label>
                      <p className="text-sm">{viewStudent.guardian_info.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                {studentStats && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Quick Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-600">Average Marks</p>
                              <p className="text-2xl font-bold text-blue-600">{studentStats.averageMarks}%</p>
                            </div>
                            <Award className="h-8 w-8 text-blue-600 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-600">Total Grades</p>
                              <p className="text-2xl font-bold text-purple-600">{studentStats.totalGrades}</p>
                            </div>
                            <FileText className="h-8 w-8 text-purple-600 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-600">Attendance Rate</p>
                              <p className="text-2xl font-bold text-green-600">{studentStats.attendanceRate}%</p>
                            </div>
                            <Calendar className="h-8 w-8 text-green-600 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-600">Passing Grades</p>
                              <p className="text-2xl font-bold text-orange-600">{studentStats.passingGrades}/{studentStats.totalGrades}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-orange-600 opacity-50" />
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
                        handleViewGrades(viewStudent)
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
                        handleViewAttendance(viewStudent)
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
                        handleViewReportCard(viewStudent)
                      }}
                      className="flex items-center gap-2"
                    >
                      <Award className="h-4 w-4" />
                      Report Card
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowViewModal(false)
                        router.push(`/admin/reports?student_id=${viewStudent.id}&type=academic`)
                      }}
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Generate Report
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
                    handleEditStudent(viewStudent)
                  }}>
                    Edit Student
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Report Card Modal */}
        {showReportCardModal && viewStudent && studentGrades.length > 0 && (
          <ReportCardModal
            student={viewStudent}
            grades={studentGrades}
            classInfo={classInfo || undefined}
            term="First Term"
            academicYear={new Date().getFullYear().toString()}
            isOpen={showReportCardModal}
            onClose={() => setShowReportCardModal(false)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}



