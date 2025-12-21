'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { studentService } from '@/services/studentService'
import { Package, Calendar } from 'lucide-react'
import { StationeryDistribution } from '@/types'
import { formatDate } from '@/lib/utils'

export default function StudentStationeryPage() {
  // Fetch student stationery distributions
  const { data: distributions = [], isLoading } = useQuery({
    queryKey: ['my-stationery'],
    queryFn: () => studentService.getMyStationery(),
  })

  return (
    <DashboardLayout allowedRoles={['student']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Stationery</h1>
          <p className="text-gray-600 mt-1">View your distributed stationery items</p>
        </div>

        {/* Stationery Items */}
        <Card>
          <CardHeader>
            <CardTitle>Distributed Items</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : distributions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No stationery items distributed</p>
                <p>Distributed stationery items will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {distributions.map((dist: StationeryDistribution & { item?: any }) => (
                  <Card key={dist.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{dist.item?.name || 'Stationery Item'}</h4>
                            <p className="text-sm text-gray-600">{dist.item?.category || 'General'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-semibold">{dist.quantity} {dist.item?.unit || 'units'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Distributed:</span>
                          <span className="font-semibold">{formatDate(dist.distributed_date)}</span>
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
    </DashboardLayout>
  )
}









