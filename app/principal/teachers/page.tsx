'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuery } from '@tanstack/react-query'
import { teacherService } from '@/services/teacherService'
import { Search, Users, GraduationCap, Eye, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Teacher } from '@/types'

export default function PrincipalTeachersPage() {
  const [search, setSearch] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers', search],
    queryFn: () => teacherService.getTeachers({ search, limit: 1000 }),
  })

  const filteredTeachers = teachers.filter(teacher =>
    teacher.employee_id.toLowerCase().includes(search.toLowerCase()) ||
    teacher.user?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout allowedRoles={['principal']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Teachers</h1>
            <p className="text-gray-600">View teacher information and performance</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Teachers</CardTitle>
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
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No teachers found</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTeachers.map((teacher: Teacher) => (
                  <Card key={teacher.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{teacher.user?.full_name || 'Unknown'}</h4>
                            <p className="text-sm text-gray-600">{teacher.employee_id}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTeacher(teacher)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Qualification:</span>
                          <span className="font-medium">{teacher.qualification}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            teacher.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {teacher.status}
                          </span>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-600 mb-1">Subjects:</p>
                          <div className="flex flex-wrap gap-1">
                            {teacher.subjects.slice(0, 3).map((subject) => (
                              <span key={subject} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {subject}
                              </span>
                            ))}
                            {teacher.subjects.length > 3 && (
                              <span className="text-xs text-gray-500">+{teacher.subjects.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teacher Detail Modal */}
        {selectedTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Teacher Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTeacher(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Employee ID</p>
                    <p className="font-semibold">{selectedTeacher.employee_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{selectedTeacher.user?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedTeacher.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Join Date</p>
                    <p className="font-semibold">{formatDate(selectedTeacher.join_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Qualification</p>
                    <p className="font-semibold">{selectedTeacher.qualification}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedTeacher.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedTeacher.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeacher.subjects.map((subject) => (
                      <span key={subject} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full" onClick={() => setSelectedTeacher(null)}>
                    Close
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

