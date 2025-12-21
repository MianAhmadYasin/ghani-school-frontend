'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, FileText, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react'

export default function PrincipalReportsPage() {
  const router = useRouter()

  return (
    <DashboardLayout allowedRoles={['principal']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive reports dashboard</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/admin/reports?type=academic')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Academic Reports</h3>
                  <p className="text-sm text-gray-600">Performance & grades</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/admin/reports?type=attendance')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Attendance Reports</h3>
                  <p className="text-sm text-gray-600">Student & teacher attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/admin/reports?type=financial')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Financial Reports</h3>
                  <p className="text-sm text-gray-600">Revenue & expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/admin/reports?type=students')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Student Reports</h3>
                  <p className="text-sm text-gray-600">Student analytics</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/admin/reports')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">All Reports</h3>
                  <p className="text-sm text-gray-600">View all available reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}









