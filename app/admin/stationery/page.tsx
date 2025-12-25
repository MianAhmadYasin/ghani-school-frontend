'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, X, Package, AlertTriangle } from 'lucide-react'
import { financeService } from '@/services/financeService'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

export default function StationeryPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
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

  // Form state matching database schema
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    reorder_level: ''
  })

  // Fetch stationery items from database
  const { data: stationery = [], isLoading } = useQuery({
    queryKey: ['stationery', categoryFilter],
    queryFn: () => financeService.getStationeryItems({
      category: categoryFilter !== 'all' ? categoryFilter : undefined
    }),
  })

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const itemData = {
        name: data.name,
        category: data.category,
        quantity: parseInt(data.quantity),
        unit: data.unit,
        reorder_level: parseInt(data.reorder_level)
      }

      if (selectedItem) {
        return financeService.updateStationeryItem(selectedItem.id, itemData)
      } else {
        return financeService.createStationeryItem(itemData as any)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stationery'] })
      setShowForm(false)
      setSelectedItem(null)
      resetForm()
      toast.success(selectedItem ? 'Item updated successfully!' : 'Item created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to save item')
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeService.deleteStationeryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stationery'] })
      toast.success('Item deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete item')
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: '',
      unit: '',
      reorder_level: ''
    })
  }

  const handleEdit = (item: any) => {
    setSelectedItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      reorder_level: item.reorder_level.toString()
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Stationery Item',
      description: 'Are you sure you want to delete this item? This action cannot be undone.',
      onConfirm: () => {
        deleteMutation.mutate(id)
      },
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.category || !formData.quantity || !formData.unit) {
      alert('Please fill all required fields')
      return
    }

    saveMutation.mutate(formData)
  }

  // Filter by search
  const filteredItems = stationery.filter((item: any) =>
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase())
  )

  // Calculate stats
  const totalItems = filteredItems.length
  const lowStockItems = filteredItems.filter((item: any) => 
    item.quantity <= item.reorder_level
  ).length
  const outOfStockItems = filteredItems.filter((item: any) => 
    item.quantity === 0
  ).length
  const totalQuantity = filteredItems.reduce((sum: number, item: any) => 
    sum + (item.quantity || 0), 0
  )

  return (
    <DashboardLayout allowedRoles={['admin', 'principal']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stationery Management</h1>
            <p className="text-gray-600">Manage school inventory and supplies</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); setSelectedItem(null) }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-gray-600">Different items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalQuantity}</div>
              <p className="text-xs text-gray-600">All units</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
              <p className="text-xs text-gray-600">Need reorder</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
              <p className="text-xs text-gray-600">Urgent!</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="uniform">Uniform</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => {
                setSearch('')
                setCategoryFilter('all')
              }}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Items List */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading inventory...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items found. Add your first stationery item!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Item Name</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-left p-3">Quantity</th>
                      <th className="text-left p-3">Unit</th>
                      <th className="text-left p-3">Reorder Level</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item: any) => {
                      const isLowStock = item.quantity <= item.reorder_level
                      const isOutOfStock = item.quantity === 0
                      
                      return (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{item.name}</td>
                          <td className="p-3 capitalize">{item.category}</td>
                          <td className="p-3">
                            <span className={
                              isOutOfStock ? 'text-red-600 font-semibold' :
                              isLowStock ? 'text-yellow-600 font-semibold' :
                              'text-green-600 font-semibold'
                            }>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="p-3">{item.unit}</td>
                          <td className="p-3">{item.reorder_level}</td>
                          <td className="p-3">
                            {isOutOfStock ? (
                              <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
                            ) : isLowStock ? (
                              <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">Available</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
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
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedItem ? 'Edit Item' : 'Add New Item'}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setSelectedItem(null); resetForm() }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Label>Item Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., Mathematics Textbook"
                        required
                      />
                    </div>

                    <div>
                      <Label>Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="books">Books</SelectItem>
                          <SelectItem value="supplies">Supplies</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="uniform">Uniform</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Unit *</Label>
                      <Input
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        placeholder="e.g., pieces, boxes, packs"
                        required
                      />
                    </div>

                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        placeholder="e.g., 100"
                        required
                      />
                    </div>

                    <div>
                      <Label>Reorder Level *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.reorder_level}
                        onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
                        placeholder="e.g., 10"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Alert when quantity falls below this level
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => { setShowForm(false); setSelectedItem(null); resetForm() }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? 'Saving...' : selectedItem ? 'Update Item' : 'Add Item'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

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
    </DashboardLayout>
  )
}
