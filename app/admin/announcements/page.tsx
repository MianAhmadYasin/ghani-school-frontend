"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Plus, Search, Filter, Calendar, Users, Edit, Trash2, Eye } from "lucide-react";
import { announcementService, Announcement, AnnouncementCreate } from "@/services/announcementService";
import { toast } from "@/components/ui/toast";

interface AnnouncementFormData {
  title: string;
  content: string;
  target_audience: string;
  priority: string;
  start_date: Date;
  end_date?: Date;
  is_active: boolean;
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  normal: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const targetAudienceColors = {
  all: "bg-purple-100 text-purple-800",
  students: "bg-green-100 text-green-800",
  teachers: "bg-blue-100 text-blue-800",
  parents: "bg-yellow-100 text-yellow-800",
  staff: "bg-gray-100 text-gray-800",
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all_items");
  const [audienceFilter, setAudienceFilter] = useState("all_items");
  const [statusFilter, setStatusFilter] = useState("all_items");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statistics
  const stats = {
    total: announcements.length,
    active: announcements.filter(a => a.is_active).length,
    urgent: announcements.filter(a => a.priority === "urgent").length,
    thisMonth: announcements.filter(a => {
      const createdDate = new Date(a.created_at);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
    }).length,
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, searchTerm, priorityFilter, audienceFilter, statusFilter]);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const data = await announcementService.getAll();
      setAnnouncements(data);
    } catch (error: any) {
      console.error("Failed to fetch announcements:", error);
      toast.error(error.response?.data?.detail || "Failed to fetch announcements");
    } finally {
      setIsLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = announcements;

    if (searchTerm) {
      filtered = filtered.filter(announcement =>
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priorityFilter && priorityFilter !== "all_items") {
      filtered = filtered.filter(announcement => announcement.priority === priorityFilter);
    }

    if (audienceFilter && audienceFilter !== "all_items") {
      filtered = filtered.filter(announcement => announcement.target_audience === audienceFilter);
    }

    if (statusFilter && statusFilter !== "all_items") {
      filtered = filtered.filter(announcement => 
        statusFilter === "active" ? announcement.is_active : !announcement.is_active
      );
    }

    setFilteredAnnouncements(filtered);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Announcement',
      description: 'Are you sure you want to delete this announcement? This action cannot be undone.',
      onConfirm: () => {
        try {
          await announcementService.delete(id);
          setAnnouncements(announcements.filter(a => a.id !== id));
          toast.success("Announcement deleted successfully");
        } catch (error: any) {
          console.error("Failed to delete announcement:", error);
          toast.error(error.response?.data?.detail || "Failed to delete announcement");
        }
      },
    })
  }

  const handleCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setIsFormOpen(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: AnnouncementFormData) => {
    try {
      setIsSubmitting(true);
      
      const announcementData: AnnouncementCreate = {
        title: data.title,
        content: data.content,
        target_audience: data.target_audience as any,
        priority: data.priority as any,
        start_date: data.start_date.toISOString().split('T')[0],
        end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : undefined,
        is_active: data.is_active,
      };

      if (editingAnnouncement) {
        const updated = await announcementService.update(editingAnnouncement.id, announcementData);
        setAnnouncements(announcements.map(a => a.id === updated.id ? updated : a));
        toast.success("Announcement updated successfully");
      } else {
        const created = await announcementService.create(announcementData);
        setAnnouncements([created, ...announcements]);
        toast.success("Announcement created successfully");
      }
      
      setIsFormOpen(false);
      setEditingAnnouncement(null);
    } catch (error: any) {
      console.error("Failed to save announcement:", error);
      toast.error(error.response?.data?.detail || "Failed to save announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={['admin', 'principal']}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">
            Manage school announcements and communications
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleCreateAnnouncement}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_items">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Audiences" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_items">All Audiences</SelectItem>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="teachers">Teachers</SelectItem>
                <SelectItem value="parents">Parents</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_items">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setPriorityFilter("all_items");
                setAudienceFilter("all_items");
                setStatusFilter("all_items");
              }}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
              <p className="text-gray-600">
                {searchTerm || priorityFilter || audienceFilter || statusFilter
                  ? "Try adjusting your filters to see more results."
                  : "Create your first announcement to get started."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {announcement.title}
                      </h3>
                      <Badge className={priorityColors[announcement.priority as keyof typeof priorityColors]}>
                        {announcement.priority}
                      </Badge>
                      <Badge className={targetAudienceColors[announcement.target_audience as keyof typeof targetAudienceColors]}>
                        {announcement.target_audience}
                      </Badge>
                      {announcement.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Start: {new Date(announcement.start_date).toLocaleDateString()}</span>
                      </div>
                      {announcement.end_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>End: {new Date(announcement.end_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>Created: {new Date(announcement.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditAnnouncement(announcement)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Announcement Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}
            </DialogTitle>
          </DialogHeader>
          <AnnouncementFormDialog
            onSubmit={handleFormSubmit}
            initialData={editingAnnouncement ? {
              title: editingAnnouncement.title,
              content: editingAnnouncement.content,
              target_audience: editingAnnouncement.target_audience,
              priority: editingAnnouncement.priority,
              start_date: new Date(editingAnnouncement.start_date),
              end_date: editingAnnouncement.end_date ? new Date(editingAnnouncement.end_date) : undefined,
              is_active: editingAnnouncement.is_active,
            } : undefined}
            isLoading={isSubmitting}
            mode={editingAnnouncement ? "edit" : "create"}
          />
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}

// Simplified form component for dialog
function AnnouncementFormDialog({
  onSubmit,
  initialData,
  isLoading,
  mode,
}: {
  onSubmit: (data: AnnouncementFormData) => Promise<void>;
  initialData?: Partial<AnnouncementFormData>;
  isLoading?: boolean;
  mode?: "create" | "edit";
}) {
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: initialData?.title || "",
    content: initialData?.content || "",
    target_audience: initialData?.target_audience || "all",
    priority: initialData?.priority || "normal",
    start_date: initialData?.start_date || new Date(),
    end_date: initialData?.end_date,
    is_active: initialData?.is_active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }
    if (!formData.start_date) {
      newErrors.start_date = "Start date is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter announcement title"
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Content *</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Enter announcement content"
          rows={6}
          className={`w-full rounded-md border px-3 py-2 text-sm ${errors.content ? "border-red-500" : "border-gray-300"}`}
        />
        {errors.content && <p className="text-sm text-red-600">{errors.content}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Audience *</label>
          <Select
            value={formData.target_audience}
            onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="students">Students</SelectItem>
              <SelectItem value="teachers">Teachers</SelectItem>
              <SelectItem value="parents">Parents</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Priority *</label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date *</label>
          <Input
            type="date"
            value={formData.start_date.toISOString().split('T')[0]}
            onChange={(e) => setFormData({ ...formData, start_date: new Date(e.target.value) })}
            className={errors.start_date ? "border-red-500" : ""}
          />
          {errors.start_date && <p className="text-sm text-red-600">{errors.start_date}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">End Date (Optional)</label>
          <Input
            type="date"
            value={formData.end_date ? formData.end_date.toISOString().split('T')[0] : ""}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value ? new Date(e.target.value) : undefined })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="is_active" className="text-sm font-medium">
          Active (announcement will be visible)
        </label>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? "Saving..." : mode === "create" ? "Create Announcement" : "Update Announcement"}
        </Button>
      </div>
    </form>
  );
}