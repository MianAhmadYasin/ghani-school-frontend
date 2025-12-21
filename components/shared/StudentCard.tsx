'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Users, Eye, FileText, Calendar, Award, ChevronRight } from 'lucide-react'
import { Student } from '@/types'

interface StudentCardProps {
  student: Student
  showActions?: boolean
  showStats?: boolean
  stats?: {
    attendanceRate?: number
    averageGrade?: number
    totalGrades?: number
  }
}

export function StudentCard({ 
  student, 
  showActions = true, 
  showStats = false,
  stats 
}: StudentCardProps) {
  const router = useRouter()

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-gray-900">
                  {student.user?.full_name || 'Unknown'}
                </h3>
                <Badge className={
                  student.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }>
                  {student.status}
                </Badge>
              </div>
              <div className="mt-1 space-y-1">
                <p className="text-sm text-gray-600">
                  Admission: {student.admission_number}
                </p>
                {student.class_id && (
                  <p className="text-sm text-gray-600">
                    Class ID: {student.class_id}
                  </p>
                )}
                {student.guardian_info?.name && (
                  <p className="text-sm text-gray-500">
                    Guardian: {student.guardian_info.name}
                  </p>
                )}
              </div>
              {showStats && stats && (
                <div className="flex gap-4 mt-3 pt-3 border-t">
                  {stats.attendanceRate !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500">Attendance</p>
                      <p className="text-sm font-semibold">{stats.attendanceRate}%</p>
                    </div>
                  )}
                  {stats.averageGrade !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500">Avg Grade</p>
                      <p className="text-sm font-semibold">{stats.averageGrade}%</p>
                    </div>
                  )}
                  {stats.totalGrades !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500">Grades</p>
                      <p className="text-sm font-semibold">{stats.totalGrades}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {showActions && (
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/admin/students?student_id=${student.id}`)}
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push(`/admin/grades?student_id=${student.id}`)}
                className="flex items-center gap-1"
                title="View Grades"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push(`/admin/attendance?user_id=${student.user_id}`)}
                className="flex items-center gap-1"
                title="View Attendance"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


