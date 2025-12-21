'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { attendanceSalaryService, MonthlySalaryCalculation } from '@/services/attendanceSalaryService'
import { teacherService } from '@/services/teacherService'
import {
  Calculator,
  Eye,
  Save,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Users,
  Calendar,
  DollarSign,
  TrendingDown,
  FileSpreadsheet,
  Download,
} from 'lucide-react'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function SalaryCalculator() {
  const queryClient = useQueryClient()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([])
  const [previewTeacherId, setPreviewTeacherId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherService.getTeachers({ limit: 1000 }),
  })

  // Fetch salary calculations
  const { data: calculations = [], isLoading: isLoadingCalculations } = useQuery({
    queryKey: ['salary-calculations', selectedMonth, selectedYear],
    queryFn: () =>
      attendanceSalaryService.getSalaryCalculations({
        month: selectedMonth,
        year: selectedYear,
      }),
  })

  // Calculate mutation
  const calculateMutation = useMutation({
    mutationFn: (data: { month: number; year: number; teacher_ids?: string[] }) =>
      attendanceSalaryService.calculateMonthlySalary(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salary-calculations'] })
      toast.success(`Calculated salaries for ${data.length} teacher(s) successfully!`)
      setSelectedTeacherIds([])
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Failed to calculate salaries'
      toast.error(errorMessage)
    }
  })

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: ({ teacher_id, month, year }: { teacher_id: string; month: number; year: number }) =>
      attendanceSalaryService.previewSalaryCalculation(teacher_id, month, year),
    onSuccess: (data) => {
      setPreviewData(data)
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Failed to preview salary'
      toast.error(errorMessage)
    }
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (calculation_id: string) =>
      attendanceSalaryService.approveSalaryCalculation(calculation_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-calculations'] })
      toast.success('Salary calculation approved!')
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Failed to approve calculation'
      toast.error(errorMessage)
    }
  })

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: (calculation_ids: string[]) =>
      attendanceSalaryService.bulkApproveSalaryCalculations(calculation_ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['salary-calculations'] })
      toast.success(`Approved ${result.approved_count} calculation(s)!`)
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Failed to approve calculations'
      toast.error(errorMessage)
    }
  })

  // Recalculate mutation
  const recalculateMutation = useMutation({
    mutationFn: (calculation_id: string) =>
      attendanceSalaryService.recalculateSalary(calculation_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-calculations'] })
      toast.success('Salary recalculated successfully!')
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Failed to recalculate salary'
      toast.error(errorMessage)
    }
  })

  const handleCalculate = () => {
    if (!selectedMonth || !selectedYear) {
      toast.error('Please select month and year')
      return
    }

    calculateMutation.mutate({
      month: selectedMonth,
      year: selectedYear,
      teacher_ids: selectedTeacherIds.length > 0 ? selectedTeacherIds : undefined,
    })
  }

  const handlePreview = (teacher_id: string) => {
    setPreviewTeacherId(teacher_id)
    previewMutation.mutate({
      teacher_id,
      month: selectedMonth,
      year: selectedYear,
    })
  }

  const handleBulkApprove = () => {
    const unapprovedIds = calculations
      .filter((calc) => !calc.is_approved)
      .map((calc) => calc.id)
    
    if (unapprovedIds.length === 0) {
      toast.info('No unapproved calculations to approve')
      return
    }

    if (confirm(`Approve ${unapprovedIds.length} calculation(s)?`)) {
      bulkApproveMutation.mutate(unapprovedIds)
    }
  }

  const pendingApprovals = useMemo(
    () => calculations.filter((calc) => !calc.is_approved).length,
    [calculations]
  )

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t: any) => t.id === teacherId)
    return teacher?.user?.full_name || 'Unknown'
  }

  return (
    <div className="space-y-6">
      {/* Calculation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Salary Calculation
          </CardTitle>
          <CardDescription>
            Calculate teacher salaries based on attendance for a specific month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                type="number"
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
                min={2020}
                max={2100}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleCalculate}
                disabled={calculateMutation.isPending}
                className="w-full"
              >
                {calculateMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Salaries
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Teacher Selection (Optional) */}
          <div className="mt-4 space-y-2">
            <Label>Select Teachers (Optional - Leave empty for all teachers)</Label>
            <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
              {teachers.map((teacher: any) => (
                <div key={teacher.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`teacher-${teacher.id}`}
                    checked={selectedTeacherIds.includes(teacher.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTeacherIds([...selectedTeacherIds, teacher.id])
                      } else {
                        setSelectedTeacherIds(selectedTeacherIds.filter((id) => id !== teacher.id))
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label
                    htmlFor={`teacher-${teacher.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {teacher.user?.full_name || 'Unknown'} ({teacher.employee_id})
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {calculations.length > 0 && (
            <div className="mt-4 flex gap-2">
              {pendingApprovals > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBulkApprove}
                  disabled={bulkApproveMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve All ({pendingApprovals})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {previewData && previewTeacherId && (
        <Card className="border-2 border-blue-300">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Salary Preview</CardTitle>
                <CardDescription>
                  {getTeacherName(previewTeacherId)} - {monthNames[selectedMonth - 1]} {selectedYear}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPreviewData(null)
                  setPreviewTeacherId(null)
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Basic Salary</p>
                  <p className="text-lg font-semibold">${previewData.basic_salary?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Per Day Salary</p>
                  <p className="text-lg font-semibold">${previewData.per_day_salary?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Working Days</p>
                  <p className="text-lg font-semibold">{previewData.total_working_days || 0}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Present Days</p>
                  <p className="text-lg font-semibold text-green-600">{previewData.present_days || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Absent Days</p>
                  <p className="text-lg font-semibold text-red-600">{previewData.absent_days || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Late Days</p>
                  <p className="text-lg font-semibold text-yellow-600">{previewData.late_days || 0}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Total Deductions</span>
                <span className="text-lg font-semibold text-red-600">
                  ${previewData.total_deductions?.toFixed(2) || '0.00'}
                </span>
              </div>
              {previewData.deductions_by_rule && Object.keys(previewData.deductions_by_rule).length > 0 && (
                <div className="mt-2 space-y-1">
                  {Object.entries(previewData.deductions_by_rule).map(([rule, amount]: [string, any]) => (
                    <div key={rule} className="flex justify-between text-xs text-gray-500">
                      <span>{rule}:</span>
                      <span>${amount?.toFixed(2) || '0.00'}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Net Salary</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${previewData.net_salary?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Calculated Salaries - {monthNames[selectedMonth - 1]} {selectedYear}
            </span>
            {calculations.length > 0 && (
              <Badge variant="outline">
                {calculations.length} calculation(s)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCalculations ? (
            <div className="text-center py-8">Loading calculations...</div>
          ) : calculations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No calculations found</p>
              <p className="text-sm">Calculate salaries for the selected month to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {calculations.map((calc) => (
                <Card key={calc.id} className={calc.is_approved ? 'border-green-300 bg-green-50' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="font-semibold text-lg">
                            {getTeacherName(calc.teacher_id)}
                          </h4>
                          {calc.is_approved ? (
                            <Badge className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-600">Basic Salary</p>
                            <p className="font-semibold">${calc.basic_salary.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Present Days</p>
                            <p className="font-semibold text-green-600">{calc.present_days}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Deductions</p>
                            <p className="font-semibold text-red-600">${calc.total_deductions.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Net Salary</p>
                            <p className="font-semibold text-blue-600 text-lg">${calc.net_salary.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 text-xs text-gray-600">
                          <span>Absent: {calc.absent_days}</span>
                          <span>|</span>
                          <span>Half Day: {calc.half_days}</span>
                          <span>|</span>
                          <span>Late: {calc.late_days}</span>
                          <span>|</span>
                          <span>Working Days: {calc.total_working_days}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(calc.teacher_id)}
                          disabled={previewMutation.isPending}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!calc.is_approved && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Recalculate this salary? This will reset approval status.')) {
                                  recalculateMutation.mutate(calc.id)
                                }
                              }}
                              disabled={recalculateMutation.isPending}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setConfirmDialog({
                                  open: true,
                                  title: 'Approve Salary Calculation',
                                  description: 'Are you sure you want to approve this salary calculation?',
                                  onConfirm: () => {
                                    approveMutation.mutate(calc.id)
                                  },
                                })
                              }}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </>
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
    </div>
  )
}






