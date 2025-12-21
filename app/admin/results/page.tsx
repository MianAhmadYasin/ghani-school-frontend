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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Eye, FileText, Filter, Download, Edit, Trash2, Search,
  TrendingUp, Users, Award, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import { resultService } from '@/services/resultService'
import { examService } from '@/services/examService'
import { classService } from '@/services/classService'
import { ExamResult, ResultStatus } from '@/types'
import { StatsSkeleton, TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export default function AdminResultsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedExam, setSelectedExam] = useState<string>('all')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch all classes
  const { data: classes = [] } = useQuery({
    queryKey: ['all-classes'],
    queryFn: () => classService.getClasses({ limit: 1000 }),
  })

  // Create classes map for quick lookup
  const classesMap = new Map(classes.map((cls: any) => [cls.id, cls]))

  // Fetch exams for selected class
  const { data: exams = [] } = useQuery({
    queryKey: ['exams', selectedClass],
    queryFn: () => examService.getExams({ 
      class_id: selectedClass === 'all' ? undefined : selectedClass,
      limit: 1000 
    }),
    enabled: true,
  })

  // Create exams map for quick lookup
  const examsMap = new Map(exams.map((exam: any) => [exam.id, exam]))

  // Fetch results
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['all-results', selectedExam, selectedClass],
    queryFn: () => resultService.getResults({ 
      exam_id: selectedExam === 'all' ? undefined : selectedExam,
      class_id: selectedClass === 'all' ? undefined : selectedClass,
      limit: 1000 
    }),
  })

  // Delete result mutation
  const deleteResultMutation = useMutation({
    mutationFn: (id: string) => resultService.deleteResult(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-results'] })
      toast.success('Result deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete result')
    }
  })

  const getStatusBadge = (status: ResultStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
      case 'absent':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Absent</Badge>
      case 'absent_with_excuse':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Absent (Excuse)</Badge>
      case 'incomplete':
        return <Badge variant="outline">Incomplete</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredResults = results.filter((result: ExamResult) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        result.student_name?.toLowerCase().includes(searchLower) ||
        result.admission_number?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  // Calculate statistics
  const stats = {
    total: filteredResults.length,
    passed: filteredResults.filter((r: ExamResult) => r.percentage >= 50).length,
    failed: filteredResults.filter((r: ExamResult) => r.percentage < 50).length,
    average: filteredResults.length > 0
      ? (filteredResults.reduce((sum: number, r: ExamResult) => sum + r.percentage, 0) / filteredResults.length).toFixed(1)
      : 0
  }

  return (
    <DashboardLayout allowedRoles={['admin', 'principal']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exam Results</h1>
            <p className="text-gray-600 mt-1">View and manage all exam results across the school</p>
          </div>
        </div>

        {/* Statistics */}
        <ErrorBoundary>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Results</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Passed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.passed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average %</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.average}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </ErrorBoundary>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label>Filter by Class</Label>
                <Select value={selectedClass} onValueChange={(value) => {
                  setSelectedClass(value)
                  setSelectedExam('all')
                }}>
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
                <Label>Filter by Exam</Label>
                <Select 
                  value={selectedExam} 
                  onValueChange={setSelectedExam}
                  disabled={selectedClass === 'all' && classes.length > 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Exams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    {exams.map((exam: any) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.exam_name} - {exam.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Search Student</Label>
                <Input
                  placeholder="Search by name or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedClass('all')
                    setSelectedExam('all')
                    setSearchTerm('')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <ErrorBoundary>
          {isLoading ? (
            <TableSkeleton rows={8} columns={10} />
          ) : filteredResults.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No Results Found</p>
                <p className="mb-4">No results match your filters. Try adjusting your search criteria.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedClass('all')
                    setSelectedExam('all')
                    setSearchTerm('')
                  }}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
          <Card>
            <CardHeader>
              <CardTitle>Results ({filteredResults.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Student</th>
                      <th className="text-center py-3 px-4">Admission No.</th>
                      <th className="text-left py-3 px-4">Exam</th>
                      <th className="text-center py-3 px-4">Marks Obtained</th>
                      <th className="text-center py-3 px-4">Total Marks</th>
                      <th className="text-center py-3 px-4">Percentage</th>
                      <th className="text-center py-3 px-4">Grade</th>
                      <th className="text-center py-3 px-4">Status</th>
                      <th className="text-center py-3 px-4">Uploaded By</th>
                      <th className="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result: ExamResult) => {
                      const exam = examsMap.get(result.exam_id)
                      return (
                        <tr key={result.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{result.student_name || 'Unknown'}</td>
                          <td className="py-3 px-4 text-center">{result.admission_number || '-'}</td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <div className="font-medium">{exam?.exam_name || 'Unknown Exam'}</div>
                              <div className="text-gray-500">{exam?.subject || ''}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold">{result.marks_obtained}</td>
                        <td className="py-3 px-4 text-center">{result.total_marks}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={result.percentage >= 50 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {result.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline">{result.grade || '-'}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getStatusBadge(result.status)}
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600">
                          {result.uploaded_by_name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => router.push(`/teacher/results?exam_id=${result.exam_id}&result_id=${result.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this result?')) {
                                  deleteResultMutation.mutate(result.id)
                                }
                              }}
                              disabled={deleteResultMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          )}
        </ErrorBoundary>
      </div>
    </DashboardLayout>
  )
}

