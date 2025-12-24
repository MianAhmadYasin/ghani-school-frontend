'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { studentService } from '@/services/studentService'
import { classService } from '@/services/classService'
import { Student, Class } from '@/types'
import { toast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Loader2, X, Plus, Users, UserMinus } from 'lucide-react'

interface StudentEnrollmentProps {
  classData: Class
  onClose: () => void
}

export function StudentEnrollment({ classData, onClose }: StudentEnrollmentProps) {
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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

  // Get students in this class
  const { data: classStudents = [], isLoading: isLoadingStudents, refetch } = useQuery({
    queryKey: ['classStudents', classData.id],
    queryFn: () => classService.getClassStudents(classData.id),
  })

  // Get all students
  const { data: allStudents = [] } = useQuery({
    queryKey: ['availableStudents', classData.id],
    queryFn: () => studentService.getStudents({ 
      limit: 1000
    }),
  })

  // Filter out students already in this class
  const availableStudents = allStudents.filter(
    student => !classStudents.some(cs => cs.user_id === student.user_id)
  )

  const addStudentMutation = useMutation({
    mutationFn: (studentId: string) => 
      classService.addStudents(classData.id, [studentId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classStudents', classData.id] })
      queryClient.invalidateQueries({ queryKey: ['availableStudents', classData.id] })
      setSelectedStudent('')
      toast.success('Student added to class successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to add student to class')
    }
  })

  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string) => 
      classService.removeStudent(classData.id, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classStudents', classData.id] })
      queryClient.invalidateQueries({ queryKey: ['availableStudents', classData.id] })
      toast.success('Student removed from class successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to remove student from class')
    }
  })

  const filteredAvailableStudents = availableStudents.filter(student =>
    student.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddStudent = () => {
    if (selectedStudent) {
      addStudentMutation.mutate(selectedStudent)
    }
  }

  const handleRemoveStudent = (student: Student) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Student from Class',
      description: `Are you sure you want to remove ${student.user?.full_name || student.admission_number} from this class?`,
      onConfirm: () => {
        removeStudentMutation.mutate(student.id)
      },
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students in {classData.name} - {classData.section}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Student Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Student to Class</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="student-search">Search Students</Label>
                <Input
                  id="student-search"
                  placeholder="Search by name or admission number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="select-student">Select Student</Label>
                <Select
                  value={selectedStudent || 'placeholder'}
                  onValueChange={(value) => setSelectedStudent(value === 'placeholder' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled>Choose a student</SelectItem>
                    {filteredAvailableStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.user?.full_name} ({student.admission_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleAddStudent}
                  disabled={!selectedStudent || addStudentMutation.isPending}
                >
                  {addStudentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Current Students */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Current Students ({classStudents.length})
            </h3>
            
            {isLoadingStudents ? (
              <div className="text-center py-8 text-gray-500">Loading students...</div>
            ) : classStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No students enrolled in this class
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Admission No.</th>
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {student.admission_number}
                        </td>
                        <td className="py-3 px-4">
                          {student.user?.full_name || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          {student.user?.email || 'N/A'}
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveStudent(student)}
                            disabled={removeStudentMutation.isPending}
                            className="text-red-600 hover:text-red-800"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant="destructive"
      />
    </div>
  )
}

