'use client'

import { useState, useMemo } from 'react'
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
  Upload, Download, FileText, Plus, Edit, Trash2, Save, X,
  CheckCircle, AlertCircle, FileSpreadsheet, Eye, RefreshCw,
  TrendingUp, Users, Award, FileCheck
} from 'lucide-react'
import { examService } from '@/services/examService'
import { resultService } from '@/services/resultService'
import { classService } from '@/services/classService'
import { teacherService } from '@/services/teacherService'
import { Exam, ExamResult, ResultStatus } from '@/types'

type TabId = 'upload' | 'manual-entry' | 'view-results'

export default function TeacherResultsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabId>('upload')
  const [selectedExam, setSelectedExam] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadErrors, setUploadErrors] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [overwriteExisting, setOverwriteExisting] = useState(false)

  // Fetch teacher's classes
  const { data: classes = [] } = useQuery({
    queryKey: ['my-classes'],
    queryFn: () => teacherService.getMyClasses(),
  })

  // Fetch exams for selected class
  const { data: exams = [] } = useQuery({
    queryKey: ['exams', selectedClass],
    queryFn: () => examService.getExams({ 
      class_id: selectedClass || undefined,
      limit: 1000 
    }),
    enabled: !!selectedClass,
  })

  // Fetch students for selected class
  const { data: students = [] } = useQuery({
    queryKey: ['class-students', selectedClass],
    queryFn: () => classService.getClassStudents(selectedClass),
    enabled: !!selectedClass,
  })

  // Fetch results for selected exam
  const { data: results = [] } = useQuery({
    queryKey: ['results', selectedExam],
    queryFn: () => resultService.getResults({ 
      exam_id: selectedExam || undefined,
      limit: 1000 
    }),
    enabled: !!selectedExam,
  })

  // Download template mutation
  const downloadTemplateMutation = useMutation({
    mutationFn: async (examId: string) => {
      const blob = await resultService.downloadTemplate(examId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `exam_results_template_${examId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
    onSuccess: () => {
      toast.success('Template downloaded successfully!')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to download template')
    }
  })

  // Validate upload mutation
  const validateUploadMutation = useMutation({
    mutationFn: async ({ examId, file }: { examId: string; file: File }) => {
      return resultService.validateUpload(examId, file)
    },
    onSuccess: (data) => {
      if (data.valid) {
        toast.success(`File is valid! ${data.valid_entries} entries ready to upload.`)
      } else {
        toast.error(`File validation failed. ${data.invalid_entries} errors found.`)
        setUploadErrors(data.errors)
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to validate file')
    }
  })

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (data: { examId: string; file: File; overwrite: boolean }) => {
      // Parse CSV file
      const text = await data.file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim())
      
      const results = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const row: any = {}
        headers.forEach((header, idx) => {
          row[header] = values[idx]
        })
        
        if (row.admission_number && row.marks_obtained) {
          results.push({
            admission_number: row.admission_number,
            marks_obtained: parseFloat(row.marks_obtained) || 0,
            remarks: row.remarks || undefined,
            status: row.status || 'active'
          })
        }
      }
      
      return resultService.bulkUpload({
        exam_id: data.examId,
        results,
        overwrite_existing: data.overwrite
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['results'] })
      toast.success(`Successfully uploaded ${data.success_count} results!`)
      setUploadFile(null)
      setUploadErrors([])
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to upload results')
    }
  })

  const handleFileUpload = async () => {
    if (!selectedExam || !uploadFile) {
      toast.error('Please select an exam and upload a file')
      return
    }

    setIsUploading(true)
    try {
      // First validate
      const validation = await validateUploadMutation.mutateAsync({
        examId: selectedExam,
        file: uploadFile
      })

      if (!validation.valid) {
        setUploadErrors(validation.errors)
        setIsUploading(false)
        return
      }

      // Then upload
      await bulkUploadMutation.mutateAsync({
        examId: selectedExam,
        file: uploadFile,
        overwrite: overwriteExisting
      })
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const tabs = [
    { id: 'upload' as TabId, name: 'Bulk Upload', icon: Upload },
    { id: 'manual-entry' as TabId, name: 'Manual Entry', icon: Plus },
    { id: 'view-results' as TabId, name: 'View Results', icon: Eye },
  ]

  return (
    <DashboardLayout allowedRoles={['teacher', 'admin', 'principal']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Result Management</h1>
            <p className="text-gray-600 mt-1">Upload and manage exam results for your classes</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Select Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
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
                <Label>Select Exam</Label>
                <Select 
                  value={selectedExam} 
                  onValueChange={setSelectedExam}
                  disabled={!selectedClass}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam: Exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.exam_name} - {exam.subject} ({exam.term})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedExam && (
                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => downloadTemplateMutation.mutate(selectedExam)}
                    disabled={downloadTemplateMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
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
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Bulk Upload Tab */}
          {activeTab === 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle>Bulk Upload Results</CardTitle>
                <p className="text-sm text-gray-600">Upload exam results from CSV file</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {!selectedExam ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Select an Exam</p>
                    <p>Choose a class and exam to upload results</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div>
                        <Label>Upload CSV File</Label>
                        <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept=".csv"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setUploadFile(file)
                                  setUploadErrors([])
                                }
                              }}
                              className="max-w-xs mx-auto"
                            />
                            {uploadFile && (
                              <p className="text-sm text-gray-600">
                                Selected: {uploadFile.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Input
                          type="checkbox"
                          id="overwrite"
                          checked={overwriteExisting}
                          onChange={(e) => setOverwriteExisting(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="overwrite" className="cursor-pointer">
                          Overwrite existing results
                        </Label>
                      </div>

                      {uploadErrors.length > 0 && (
                        <Card className="bg-red-50 border-red-200">
                          <CardHeader>
                            <CardTitle className="text-red-800">Validation Errors</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {uploadErrors.map((error, idx) => (
                                <div key={idx} className="text-sm text-red-700">
                                  Row {error.row}: {error.error}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="flex gap-3">
                        <Button
                          onClick={handleFileUpload}
                          disabled={!uploadFile || isUploading || bulkUploadMutation.isPending}
                        >
                          {isUploading ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Results
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setUploadFile(null)
                            setUploadErrors([])
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Manual Entry Tab */}
          {activeTab === 'manual-entry' && (
            <Card>
              <CardHeader>
                <CardTitle>Manual Result Entry</CardTitle>
                <p className="text-sm text-gray-600">Enter results manually for individual students</p>
              </CardHeader>
              <CardContent>
                {!selectedExam ? (
                  <div className="text-center py-12 text-gray-500">
                    <Plus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Select an Exam</p>
                    <p>Choose an exam to enter results manually</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Manual entry will be implemented in the next phase. Please use bulk upload for now.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* View Results Tab */}
          {activeTab === 'view-results' && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Results</CardTitle>
                <p className="text-sm text-gray-600">View and manage uploaded exam results</p>
              </CardHeader>
              <CardContent>
                {!selectedExam ? (
                  <div className="text-center py-12 text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Select an Exam</p>
                    <p>Choose an exam to view results</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No Results Found</p>
                    <p>No results have been uploaded for this exam yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Student</th>
                          <th className="text-center py-3 px-4">Admission No.</th>
                          <th className="text-center py-3 px-4">Marks Obtained</th>
                          <th className="text-center py-3 px-4">Total Marks</th>
                          <th className="text-center py-3 px-4">Percentage</th>
                          <th className="text-center py-3 px-4">Grade</th>
                          <th className="text-center py-3 px-4">Status</th>
                          <th className="text-center py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result: ExamResult) => (
                          <tr key={result.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{result.student_name || 'Unknown'}</td>
                            <td className="py-3 px-4 text-center">{result.admission_number}</td>
                            <td className="py-3 px-4 text-center font-semibold">{result.marks_obtained}</td>
                            <td className="py-3 px-4 text-center">{result.total_marks}</td>
                            <td className="py-3 px-4 text-center">{result.percentage.toFixed(1)}%</td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="outline">{result.grade || '-'}</Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="outline">{result.status}</Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center gap-2">
                                <Button size="sm" variant="ghost">
                                  <Edit className="h-4 w-4" />
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
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

