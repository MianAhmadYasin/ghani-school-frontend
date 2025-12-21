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
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Edit, Trash2, Eye, Upload, FileText, CheckCircle, XCircle,
  Clock, Send, FileCheck, AlertCircle, BookOpen, Calendar
} from 'lucide-react'
import { examService } from '@/services/examService'
import { paperService } from '@/services/paperService'
import { teacherService } from '@/services/teacherService'
import { classService } from '@/services/classService'
import { Exam, ApprovalStatus } from '@/types'

type TabId = 'create-exam' | 'upload-paper' | 'my-exams' | 'pending-approval'

export default function TeacherExamsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabId>('my-exams')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [isCreatingExam, setIsCreatingExam] = useState(false)

  // Exam form state
  const [examForm, setExamForm] = useState({
    exam_name: '',
    exam_type: 'term_exam' as any,
    term: 'First Term',
    academic_year: new Date().getFullYear().toString(),
    class_id: '',
    subject: '',
    total_marks: 100,
    passing_marks: 50,
    exam_date: '',
    duration_minutes: '',
    instructions: ''
  })

  // Fetch teacher's classes
  const { data: classes = [] } = useQuery({
    queryKey: ['my-classes'],
    queryFn: () => teacherService.getMyClasses(),
  })

  // Fetch teacher profile for subjects
  const { data: teacherProfile } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: () => teacherService.getMyProfile(),
  })

  // Fetch exams
  const { data: exams = [] } = useQuery({
    queryKey: ['my-exams', selectedClass],
    queryFn: () => examService.getExams({ 
      class_id: selectedClass === 'all' ? undefined : selectedClass,
      limit: 1000 
    }),
  })

  // Create classes map for quick lookup
  const classesMap = new Map(classes.map((cls: any) => [cls.id, cls]))

  // Fetch pending papers
  const { data: pendingPapersData } = useQuery({
    queryKey: ['pending-papers'],
    queryFn: () => paperService.getPending(),
  })

  // Create exam mutation
  const createExamMutation = useMutation({
    mutationFn: (data: any) => examService.createExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-exams'] })
      toast.success('Exam created successfully!')
      setIsCreatingExam(false)
      setExamForm({
        exam_name: '',
        exam_type: 'term_exam',
        term: 'First Term',
        academic_year: new Date().getFullYear().toString(),
        class_id: '',
        subject: '',
        total_marks: 100,
        passing_marks: 50,
        exam_date: '',
        duration_minutes: '',
        instructions: ''
      })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create exam')
    }
  })

  // Submit paper for approval mutation
  const submitPaperMutation = useMutation({
    mutationFn: (paperId: string) => paperService.submitForApproval(paperId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-papers'] })
      toast.success('Paper submitted for approval successfully!')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to submit paper')
    }
  })

  const subjects = teacherProfile?.subjects || []

  const tabs = [
    { id: 'create-exam' as TabId, name: 'Create Exam', icon: Plus },
    { id: 'upload-paper' as TabId, name: 'Upload Paper', icon: Upload },
    { id: 'my-exams' as TabId, name: 'My Exams', icon: BookOpen },
    { id: 'pending-approval' as TabId, name: 'Pending Approval', icon: Clock },
  ]

  const getApprovalBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">Draft</Badge>
    }
  }

  return (
    <DashboardLayout allowedRoles={['teacher', 'admin', 'principal']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
            <p className="text-gray-600 mt-1">Create exams and manage exam papers for your classes</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const pendingCount = tab.id === 'pending-approval' && pendingPapersData?.count ? pendingPapersData.count : 0
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                  {pendingCount > 0 && (
                    <Badge className="ml-2 bg-yellow-100 text-yellow-800">{pendingCount}</Badge>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Create Exam Tab */}
          {activeTab === 'create-exam' && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Exam</CardTitle>
                <p className="text-sm text-gray-600">Define exam details for your class</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Class *</Label>
                      <Select 
                        value={examForm.class_id} 
                        onValueChange={(value) => setExamForm({...examForm, class_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls: any) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} - {cls.section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Subject *</Label>
                      <Select 
                        value={examForm.subject} 
                        onValueChange={(value) => setExamForm({...examForm, subject: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject: string) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Exam Name *</Label>
                      <Input
                        value={examForm.exam_name}
                        onChange={(e) => setExamForm({...examForm, exam_name: e.target.value})}
                        placeholder="e.g., First Term Examination"
                      />
                    </div>

                    <div>
                      <Label>Exam Type *</Label>
                      <Select 
                        value={examForm.exam_type} 
                        onValueChange={(value) => setExamForm({...examForm, exam_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="term_exam">Term Exam</SelectItem>
                          <SelectItem value="mid_term">Mid Term</SelectItem>
                          <SelectItem value="final">Final Exam</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="assignment">Assignment</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Term *</Label>
                      <Select 
                        value={examForm.term} 
                        onValueChange={(value) => setExamForm({...examForm, term: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="First Term">First Term</SelectItem>
                          <SelectItem value="Second Term">Second Term</SelectItem>
                          <SelectItem value="Third Term">Third Term</SelectItem>
                          <SelectItem value="Final">Final / Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Academic Year *</Label>
                      <Input
                        type="text"
                        value={examForm.academic_year}
                        onChange={(e) => setExamForm({...examForm, academic_year: e.target.value})}
                        placeholder="e.g., 2024-2025"
                      />
                    </div>

                    <div>
                      <Label>Total Marks *</Label>
                      <Input
                        type="number"
                        value={examForm.total_marks}
                        onChange={(e) => setExamForm({...examForm, total_marks: parseFloat(e.target.value) || 0})}
                        min="1"
                      />
                    </div>

                    <div>
                      <Label>Passing Marks *</Label>
                      <Input
                        type="number"
                        value={examForm.passing_marks}
                        onChange={(e) => setExamForm({...examForm, passing_marks: parseFloat(e.target.value) || 0})}
                        min="0"
                        max={examForm.total_marks}
                      />
                    </div>

                    <div>
                      <Label>Exam Date</Label>
                      <Input
                        type="date"
                        value={examForm.exam_date}
                        onChange={(e) => setExamForm({...examForm, exam_date: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={examForm.duration_minutes}
                        onChange={(e) => setExamForm({...examForm, duration_minutes: e.target.value})}
                        placeholder="e.g., 120"
                        min="1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Instructions</Label>
                      <Textarea
                        value={examForm.instructions}
                        onChange={(e) => setExamForm({...examForm, instructions: e.target.value})}
                        placeholder="Exam instructions or guidelines..."
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreatingExam(false)
                        setExamForm({
                          exam_name: '',
                          exam_type: 'term_exam',
                          term: 'First Term',
                          academic_year: new Date().getFullYear().toString(),
                          class_id: '',
                          subject: '',
                          total_marks: 100,
                          passing_marks: 50,
                          exam_date: '',
                          duration_minutes: '',
                          instructions: ''
                        })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (!examForm.exam_name || !examForm.class_id || !examForm.subject) {
                          toast.error('Please fill all required fields')
                          return
                        }
                        createExamMutation.mutate(examForm)
                      }}
                      disabled={createExamMutation.isPending}
                    >
                      {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Paper Tab */}
          {activeTab === 'upload-paper' && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Exam Paper</CardTitle>
                <p className="text-sm text-gray-600">Upload exam papers and submit for approval</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Paper Upload</p>
                  <p>Paper upload functionality will be integrated with the Papers page</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/admin/papers')}
                  >
                    Go to Papers Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* My Exams Tab */}
          {activeTab === 'my-exams' && (
            <Card>
              <CardHeader>
                <CardTitle>My Exams</CardTitle>
                <p className="text-sm text-gray-600">View and manage your created exams</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Filter by Class" />
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
                    <Button onClick={() => setActiveTab('create-exam')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Exam
                    </Button>
                  </div>

                  {exams.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No Exams Found</p>
                      <p>Create your first exam to get started</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {exams.map((exam: Exam) => (
                        <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{exam.exam_name}</CardTitle>
                              <Badge variant="outline">{exam.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{exam.subject}</p>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
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
                            <div className="mt-4 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => router.push(`/teacher/results?exam_id=${exam.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Results
                              </Button>
                              {exam.status === 'draft' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Navigate to results page to upload results
                                    router.push(`/teacher/results?exam_id=${exam.id}`)
                                  }}
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Approval Tab */}
          {activeTab === 'pending-approval' && (
            <Card>
              <CardHeader>
                <CardTitle>Papers Pending Approval</CardTitle>
                <p className="text-sm text-gray-600">Track status of submitted papers</p>
              </CardHeader>
              <CardContent>
                {!pendingPapersData || pendingPapersData.papers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No Pending Papers</p>
                    <p>All your papers have been reviewed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPapersData.papers.map((paper: any) => (
                      <Card key={paper.id} className="border-l-4 border-l-yellow-400">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold">{paper.file_name}</h3>
                                {getApprovalBadge(paper.approval_status)}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Subject:</span> {paper.subject}
                                </div>
                                <div>
                                  <span className="font-medium">Class:</span> {paper.class_name}
                                </div>
                                <div>
                                  <span className="font-medium">Term:</span> {paper.term}
                                </div>
                                <div>
                                  <span className="font-medium">Year:</span> {paper.year}
                                </div>
                              </div>
                              {paper.rejection_reason && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                  <strong>Rejection Reason:</strong> {paper.rejection_reason}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {paper.approval_status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (confirm('Submit this paper for approval?')) {
                                      submitPaperMutation.mutate(paper.id)
                                    }
                                  }}
                                  disabled={submitPaperMutation.isPending}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Submit
                                </Button>
                              )}
                              {paper.approval_status === 'rejected' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push('/admin/papers')}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit & Resubmit
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

