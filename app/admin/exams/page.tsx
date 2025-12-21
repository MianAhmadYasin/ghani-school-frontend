'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Edit, Trash2, Eye, BookOpen, Calendar, Filter,
  CheckCircle, XCircle, Clock, FileText, TrendingUp
} from 'lucide-react'
import { examService } from '@/services/examService'
import { classService } from '@/services/classService'
import { Exam, ExamStatus } from '@/types'
import { CardGridSkeleton } from '@/components/shared/LoadingSkeleton'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export default function AdminExamsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedTerm, setSelectedTerm] = useState<string>('all')

  // Fetch all classes
  const { data: classes = [] } = useQuery({
    queryKey: ['all-classes'],
    queryFn: () => classService.getClasses({ limit: 1000 }),
  })

  // Create classes map for quick lookup
  const classesMap = new Map(classes.map((cls: any) => [cls.id, cls]))

  // Fetch exams with filters
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['all-exams', selectedClass, selectedStatus, selectedTerm],
    queryFn: () => examService.getExams({ 
      class_id: selectedClass === 'all' ? undefined : selectedClass,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      term: selectedTerm === 'all' ? undefined : selectedTerm,
      limit: 1000 
    }),
  })

  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: (id: string) => examService.deleteExam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-exams'] })
      toast.success('Exam deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete exam')
    }
  })

  const getStatusBadge = (status: ExamStatus) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
      default:
        return <Badge variant="outline">Draft</Badge>
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin', 'principal']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
            <p className="text-gray-600 mt-1">View and manage all exams across the school</p>
          </div>
          <Button onClick={() => router.push('/teacher/exams')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Exam
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Filter by Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Filter by Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Filter by Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    <SelectItem value="First Term">First Term</SelectItem>
                    <SelectItem value="Second Term">Second Term</SelectItem>
                    <SelectItem value="Third Term">Third Term</SelectItem>
                    <SelectItem value="Final">Final / Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exams List */}
        <ErrorBoundary>
          {isLoading ? (
            <CardGridSkeleton count={6} />
          ) : exams.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No Exams Found</p>
                <p className="mb-4">No exams match your filters or no exams have been created yet</p>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/teacher/exams')}
                >
                  Create Your First Exam
                </Button>
              </CardContent>
            </Card>
          ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam: Exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{exam.exam_name}</CardTitle>
                    {getStatusBadge(exam.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <FileText className="h-4 w-4" />
                    <span>{exam.subject}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Class:</span>
                      <span className="font-medium">
                        {classesMap.get(exam.class_id) 
                          ? `${classesMap.get(exam.class_id)!.name} - ${classesMap.get(exam.class_id)!.section}`
                          : exam.class_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Term:</span>
                      <span className="font-medium">{exam.term}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Academic Year:</span>
                      <span className="font-medium">{exam.academic_year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Marks:</span>
                      <span className="font-medium">{exam.total_marks}</span>
                    </div>
                    {exam.exam_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{new Date(exam.exam_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/admin/results?exam_id=${exam.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Results
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteExamMutation.mutate(exam.id)}
                      disabled={deleteExamMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </ErrorBoundary>
      </div>
    </DashboardLayout>
  )
}

