'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { teacherService } from '@/services/teacherService'
import { classService } from '@/services/classService'
import { studentService } from '@/services/studentService'
import { BookOpen, Users, Calendar, FileText, BarChart3 } from 'lucide-react'
import { Class, Student } from '@/types'

export default function TeacherClassesPage() {
  const router = useRouter()
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)

  // Fetch teacher's classes
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['my-classes'],
    queryFn: () => teacherService.getMyClasses(),
  })

  // Fetch students for selected class
  const { data: students = [] } = useQuery({
    queryKey: ['class-students', selectedClass?.id],
    queryFn: () => classService.getClassStudents(selectedClass!.id),
    enabled: !!selectedClass?.id,
  })

  return (
    <DashboardLayout allowedRoles={['teacher']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-600 mt-1">View and manage your assigned classes</p>
        </div>

        {!selectedClass ? (
          /* Classes List */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 col-span-full">Loading classes...</div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12 text-gray-500 col-span-full">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No classes assigned</p>
                <p>You haven't been assigned to any classes yet</p>
              </div>
            ) : (
              classes.map((cls: Class) => (
                <Card key={cls.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedClass(cls)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      {cls.name} - {cls.section}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Academic Year:</span>
                        <span className="font-medium">{cls.academic_year}</span>
                      </div>
                      <div className="pt-3 border-t">
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedClass(cls)
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Class Details */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{selectedClass.name} - {selectedClass.section}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Academic Year: {selectedClass.academic_year}</p>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedClass(null)}>
                    Back to Classes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/teacher/attendance?class_id=${selectedClass.id}`)}
                    className="flex flex-col items-center gap-2 h-auto p-4"
                  >
                    <Calendar className="h-6 w-6" />
                    <span>Mark Attendance</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/teacher/grades?class_id=${selectedClass.id}`)}
                    className="flex flex-col items-center gap-2 h-auto p-4"
                  >
                    <FileText className="h-6 w-6" />
                    <span>Enter Grades</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/teacher/attendance?class_id=${selectedClass.id}`)}
                    className="flex flex-col items-center gap-2 h-auto p-4"
                  >
                    <Users className="h-6 w-6" />
                    <span>View Students</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/teacher/grades?class_id=${selectedClass.id}`)}
                    className="flex flex-col items-center gap-2 h-auto p-4"
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span>Performance</span>
                  </Button>
                </div>

                {/* Students List */}
                <div>
                  <h3 className="font-semibold mb-4">Students ({students.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Admission No.</th>
                          <th className="text-left py-2 px-4">Name</th>
                          <th className="text-center py-2 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student: Student) => (
                          <tr key={student.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4">{student.admission_number}</td>
                            <td className="py-2 px-4">{student.user?.full_name || 'Unknown'}</td>
                            <td className="py-2 px-4 text-center">
                              <div className="flex justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => router.push(`/teacher/attendance?class_id=${selectedClass.id}&student_id=${student.id}`)}
                                >
                                  <Calendar className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => router.push(`/teacher/grades?class_id=${selectedClass.id}&student_id=${student.id}`)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}









