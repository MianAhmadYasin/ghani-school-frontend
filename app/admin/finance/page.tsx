'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { financeService } from '@/services/financeService'
import {
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Heart,
  Plus,
  AlertTriangle,
  Receipt,
  Wallet,
  PieChart,
  CreditCard,
  FileText,
  Search,
  Filter,
  Download,
  Calendar
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { StationeryItemForm } from '@/components/finance/StationeryItemForm'
import { ExpenseForm } from '@/components/finance/ExpenseForm'
import { DonationForm } from '@/components/finance/DonationForm'
import { SalaryForm } from '@/components/finance/SalaryForm'
import { toast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

type FinanceTab = 'overview' | 'expenses' | 'income' | 'stationery' | 'salaries' | 'reports'

export default function FinancePage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview')
  const [showItemForm, setShowItemForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editExpense, setEditExpense] = useState<any>(null)
  const [showDonationForm, setShowDonationForm] = useState(false)
  const [editDonation, setEditDonation] = useState<any>(null)
  const [showSalaryForm, setShowSalaryForm] = useState(false)
  const [editSalary, setEditSalary] = useState<any>(null)
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
  
  // Filters
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: stationeryItems = [] } = useQuery({
    queryKey: ['stationery-items'],
    queryFn: () => financeService.getStationeryItems(),
  })

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => financeService.getExpenses(),
  })

  const { data: donations = [] } = useQuery({
    queryKey: ['donations'],
    queryFn: () => financeService.getDonations(),
  })

  const { data: salaries = [] } = useQuery({
    queryKey: ['salaries'],
    queryFn: () => financeService.getSalaryRecords(),
  })

  // Calculate financial metrics
  const lowStockItems = stationeryItems.filter(
    item => item.quantity <= item.reorder_level
  )

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalDonations = donations.reduce((sum, don) => sum + don.amount, 0)
  const totalSalaries = salaries.reduce((sum, sal) => sum + sal.net_salary, 0)
  const totalStationeryValue = stationeryItems.reduce((sum, item) => sum + (item.quantity * 10), 0) // Assuming avg price
  
  // Monthly breakdown
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const monthlyExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date)
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
  }).reduce((sum, exp) => sum + exp.amount, 0)

  const monthlyDonations = donations.filter(don => {
    const donDate = new Date(don.date)
    return donDate.getMonth() === currentMonth && donDate.getFullYear() === currentYear
  }).reduce((sum, don) => sum + don.amount, 0)

  // Category breakdown
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {} as Record<string, number>)

  const netBalance = totalDonations - totalExpenses - totalSalaries

  const stats = [
    {
      title: 'Total Income',
      value: formatCurrency(totalDonations),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+12% from last month'
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: '-5% from last month'
    },
    {
      title: 'Salary Payouts',
      value: formatCurrency(totalSalaries),
      icon: Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: 'On track'
    },
    {
      title: 'Net Balance',
      value: formatCurrency(netBalance),
      icon: DollarSign,
      color: netBalance >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: netBalance >= 0 ? 'bg-green-100' : 'bg-red-100',
      change: netBalance >= 0 ? 'Positive' : 'Deficit'
    },
    {
      title: 'Stationery Value',
      value: formatCurrency(totalStationeryValue),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: `${stationeryItems.length} items`
    },
    {
      title: 'Low Stock Alert',
      value: lowStockItems.length.toString(),
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: 'Needs attention'
    },
  ]

  const tabs = [
    { id: 'overview' as FinanceTab, name: 'Overview', icon: PieChart },
    { id: 'expenses' as FinanceTab, name: 'Expenses', icon: Receipt },
    { id: 'income' as FinanceTab, name: 'Income & Donations', icon: Heart },
    { id: 'stationery' as FinanceTab, name: 'Stationery', icon: Package },
    { id: 'salaries' as FinanceTab, name: 'Salaries', icon: Wallet },
    { id: 'reports' as FinanceTab, name: 'Reports', icon: FileText },
  ]

  return (
    <DashboardLayout allowedRoles={['admin', 'principal']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Finance Management</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive financial tracking and management system
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-full p-2 ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <p className="text-xs text-gray-600 mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

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
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Monthly Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Summary</CardTitle>
                  <CardDescription>
                    Financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-600">Income</p>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600 mt-2">
                        {formatCurrency(monthlyDonations)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">This month</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-600">Expenses</p>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </div>
                      <p className="text-2xl font-bold text-red-600 mt-2">
                        {formatCurrency(monthlyExpenses)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">This month</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-600">Savings</p>
                        <Wallet className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className={`text-2xl font-bold mt-2 ${monthlyDonations - monthlyExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(monthlyDonations - monthlyExpenses)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Net this month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Expense Breakdown by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(expensesByCategory).sort(([,a], [,b]) => b - a).slice(0, 8).map(([category, amount]) => {
                      const percentage = totalExpenses > 0 ? (amount / totalExpenses * 100) : 0
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{category}</span>
                            <span className="text-gray-600">{formatCurrency(amount)} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('expenses')}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full p-3 bg-red-100">
                        <Receipt className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Record Expense</p>
                        <p className="text-xs text-gray-500">Add new expense</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('income')}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full p-3 bg-green-100">
                        <Heart className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Record Income</p>
                        <p className="text-xs text-gray-500">Add donation/fee</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('stationery')}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full p-3 bg-purple-100">
                        <Package className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Manage Stock</p>
                        <p className="text-xs text-gray-500">Update inventory</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('reports')}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full p-3 bg-blue-100">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">View Reports</p>
                        <p className="text-xs text-gray-500">Financial analysis</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* EXPENSES TAB */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Expense Management</CardTitle>
                      <CardDescription>
                        Track and manage all school expenses
                      </CardDescription>
                    </div>
                    <Button onClick={() => { setEditExpense(null); setShowExpenseForm(true) }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Expense
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="">All Categories</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Salaries">Salaries & Wages</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Supplies">Supplies</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Technology">Technology</option>
                      <option value="Events">Events</option>
                      <option value="Other">Other</option>
                    </select>
                    <Button variant="outline" onClick={() => { setSearchTerm(''); setDateFilter(''); setCategoryFilter('') }}>
                      Clear Filters
                    </Button>
                  </div>

                  {/* Expenses List */}
                  <div className="space-y-3">
                    {expenses
                      .filter(exp => {
                        const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase())
                        const matchesCategory = !categoryFilter || exp.category === categoryFilter
                        return matchesSearch && matchesCategory
                      })
                      .slice(0, 20)
                      .map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full p-2 bg-red-50">
                              <Receipt className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium">{expense.description}</p>
                              <p className="text-sm text-gray-600">{expense.category}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-red-600">
                              {formatCurrency(expense.amount)}
                            </p>
                            <p className="text-xs text-gray-600">{new Date(expense.date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setEditExpense(expense); setShowExpenseForm(true) }}>
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600"
                              onClick={async () => { 
                                if (confirm('Delete this expense?')) { 
                                  try {
                                    await financeService.deleteExpense(expense.id); 
                                    queryClient.invalidateQueries({ queryKey: ['expenses'] });
                                    toast.success('Expense deleted successfully');
                                  } catch (error: any) {
                                    toast.error(error?.response?.data?.detail || 'Failed to delete expense');
                                  }
                                } 
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {expenses.length === 0 && (
                    <div className="text-center py-12">
                      <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-gray-600">No expenses recorded yet</p>
                      <Button className="mt-4" onClick={() => setShowExpenseForm(true)}>
                        Add Your First Expense
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* INCOME TAB */}
          {activeTab === 'income' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Income & Donations</CardTitle>
                      <CardDescription>
                        Track all income sources including donations, fees, and grants
                      </CardDescription>
                    </div>
                    <Button onClick={() => { setEditDonation(null); setShowDonationForm(true) }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Record Income
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {donations.map((donation) => (
                      <div
                        key={donation.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full p-2 bg-green-50">
                              <Heart className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">{donation.donor_name}</p>
                              <p className="text-sm text-gray-600">
                                {donation.purpose || 'General Donation'} • Receipt: {donation.receipt_number}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {formatCurrency(donation.amount)}
                            </p>
                            <p className="text-xs text-gray-600">{new Date(donation.date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setEditDonation(donation); setShowDonationForm(true) }}>
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600"
                              onClick={async () => { 
                                if (confirm('Delete this donation?')) { 
                                  try {
                                    await financeService.deleteDonation(donation.id); 
                                    queryClient.invalidateQueries({ queryKey: ['donations'] });
                                    toast.success('Donation deleted successfully');
                                  } catch (error: any) {
                                    toast.error(error?.response?.data?.detail || 'Failed to delete donation');
                                  }
                                } 
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {donations.length === 0 && (
                    <div className="text-center py-12">
                      <Heart className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-gray-600">No income recorded yet</p>
                      <Button className="mt-4" onClick={() => setShowDonationForm(true)}>
                        Record Your First Income
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* STATIONERY TAB */}
          {activeTab === 'stationery' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Stationery Inventory</CardTitle>
                      <CardDescription>
                        Manage school stationery and supplies inventory
                      </CardDescription>
                    </div>
                    <Button onClick={() => { setEditItem(null); setShowItemForm(true) }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {lowStockItems.length > 0 && (
                    <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <p className="text-sm font-medium text-yellow-800">
                          {lowStockItems.length} items running low on stock - Reorder needed!
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {stationeryItems.map((item) => (
                      <Card key={item.id} className={`${item.quantity <= item.reorder_level ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Package className="h-5 w-5 text-purple-600" />
                                <h3 className="font-semibold">{item.name}</h3>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                              <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-purple-600">
                                  {item.quantity}
                                </p>
                                <p className="text-sm text-gray-600">{item.unit}</p>
                              </div>
                              {item.quantity <= item.reorder_level && (
                                <p className="text-xs text-yellow-600 mt-1 font-medium">
                                  ⚠️ Below reorder level ({item.reorder_level})
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditItem(item); setShowItemForm(true) }}>
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600"
                              onClick={async () => { 
                                if (confirm('Delete this item?')) { 
                                  try {
                                    await financeService.deleteStationeryItem(item.id); 
                                    queryClient.invalidateQueries({ queryKey: ['stationery-items'] });
                                    toast.success('Item deleted successfully');
                                  } catch (error: any) {
                                    toast.error(error?.response?.data?.detail || 'Failed to delete item');
                                  }
                                } 
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {stationeryItems.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-gray-600">No stationery items yet</p>
                      <Button className="mt-4" onClick={() => setShowItemForm(true)}>
                        Add Your First Item
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* SALARIES TAB */}
          {activeTab === 'salaries' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Salary Management</CardTitle>
                    <CardDescription>View and manage teacher salary records</CardDescription>
                  </div>
                  <Button onClick={() => setShowSalaryForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Salary Record
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {salaries.slice(0, 15).map((salary) => (
                    <div
                      key={salary.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-lg">
                          {new Date(salary.year, salary.month - 1).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Teacher ID: {salary.teacher_id?.substring(0, 8)}...
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Basic: {formatCurrency(salary.basic_salary)}</span>
                          {salary.bonuses > 0 && <span className="text-green-600">Bonuses: +{formatCurrency(salary.bonuses)}</span>}
                          {salary.deductions > 0 && <span className="text-red-600">Deductions: -{formatCurrency(salary.deductions)}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {formatCurrency(salary.net_salary)}
                        </p>
                        <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium mt-2 ${
                          salary.paid_date ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {salary.paid_date ? `Paid ${new Date(salary.paid_date).toLocaleDateString()}` : 'Pending Payment'}
                        </div>
                        <div className="flex gap-2 mt-3 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => { setEditSalary(salary); setShowSalaryForm(true) }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {salaries.length === 0 && (
                  <div className="text-center py-12">
                    <Wallet className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-600 mb-4">No salary records found</p>
                    <Button onClick={() => setShowSalaryForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Salary Record
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Reports & Analytics</CardTitle>
                  <CardDescription>Comprehensive financial analysis and reporting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Income vs Expenses */}
                    <div className="rounded-lg border p-6">
                      <h3 className="font-semibold mb-4">Income vs Expenses</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm">Total Income</span>
                            <span className="font-medium text-green-600">{formatCurrency(totalDonations)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-green-600 h-3 rounded-full" style={{ width: '100%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm">Total Expenses</span>
                            <span className="font-medium text-red-600">{formatCurrency(totalExpenses)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-red-600 h-3 rounded-full" 
                              style={{ width: `${totalDonations > 0 ? (totalExpenses / totalDonations * 100) : 0}%` }} 
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm">Salaries</span>
                            <span className="font-medium text-blue-600">{formatCurrency(totalSalaries)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-600 h-3 rounded-full" 
                              style={{ width: `${totalDonations > 0 ? (totalSalaries / totalDonations * 100) : 0}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="rounded-lg border p-6">
                      <h3 className="font-semibold mb-4">Financial Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Total Transactions</span>
                          <span className="font-semibold">{expenses.length + donations.length}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Expense Categories</span>
                          <span className="font-semibold">{Object.keys(expensesByCategory).length}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Average Expense</span>
                          <span className="font-semibold">
                            {expenses.length > 0 ? formatCurrency(totalExpenses / expenses.length) : formatCurrency(0)}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Average Donation</span>
                          <span className="font-semibold">
                            {donations.length > 0 ? formatCurrency(totalDonations / donations.length) : formatCurrency(0)}
                          </span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Inventory Items</span>
                          <span className="font-semibold">{stationeryItems.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Expense Categories */}
                    <div className="rounded-lg border p-6">
                      <h3 className="font-semibold mb-4">Top Expense Categories</h3>
                      <div className="space-y-3">
                        {Object.entries(expensesByCategory)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 5)
                          .map(([category, amount], index) => (
                          <div key={category} className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{category}</p>
                              <p className="text-sm text-gray-600">{formatCurrency(amount)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Items */}
                    <div className="rounded-lg border p-6 bg-blue-50">
                      <h3 className="font-semibold mb-4">Recommended Actions</h3>
                      <ul className="space-y-2">
                        {netBalance < 0 && (
                          <li className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                            <span>Review expenses - currently in deficit</span>
                          </li>
                        )}
                        {lowStockItems.length > 0 && (
                          <li className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <span>Reorder {lowStockItems.length} stationery items</span>
                          </li>
                        )}
                        <li className="flex items-start gap-2 text-sm">
                          <CreditCard className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span>Monthly expenses are {monthlyExpenses > 0 ? 'on track' : 'not recorded'}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <FileText className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>Export reports for accounting records</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Forms */}
      {showItemForm && (
        <StationeryItemForm onClose={() => { setShowItemForm(false); setEditItem(null) }} initialData={editItem || undefined}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['stationery-items'] })} />
      )}
      {showExpenseForm && (
        <ExpenseForm onClose={() => { setShowExpenseForm(false); setEditExpense(null) }} initialData={editExpense || undefined}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['expenses'] })} />
      )}
      {showDonationForm && (
        <DonationForm onClose={() => { setShowDonationForm(false); setEditDonation(null) }} initialData={editDonation || undefined}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['donations'] })} />
      )}
      {showSalaryForm && (
        <SalaryForm onClose={() => { setShowSalaryForm(false); setEditSalary(null) }} initialData={editSalary || undefined}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['salaries'] })} />
      )}
    </DashboardLayout>
  )
}
