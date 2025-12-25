"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Search, Filter, Calendar, Download, Edit, Trash2, Upload, BookOpen, GraduationCap } from "lucide-react";
import { paperService, Paper, PaperCreate, PaperStats } from "@/services/paperService";
import { toast } from "@/components/ui/toast";
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface PaperFormData {
  class_id: string;
  class_name: string;
  subject: string;
  term: string;
  year: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  description?: string;
}

const termColors = {
  first_term: "bg-blue-100 text-blue-800",
  second_term: "bg-green-100 text-green-800",
  third_term: "bg-purple-100 text-purple-800",
};

const termLabels = {
  first_term: "First Term",
  second_term: "Second Term",
  third_term: "Third Term",
};

export default function TeacherPapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [stats, setStats] = useState<PaperStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [termFilter, setTermFilter] = useState("all_items");
  const [yearFilter, setYearFilter] = useState("all_items");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
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
  });

  useEffect(() => {
    fetchPapers();
    fetchStats();
  }, []);

  useEffect(() => {
    filterPapers();
  }, [papers, searchTerm, termFilter, yearFilter]);

  const fetchPapers = async () => {
    try {
      setIsLoading(true);
      // Teacher endpoint will automatically filter by their ID
      const data = await paperService.getAll();
      setPapers(data);
    } catch (error: any) {
      console.error("Failed to fetch papers:", error);
      toast.error(error.response?.data?.detail || "Failed to fetch papers");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await paperService.getStats();
      setStats(data);
    } catch (error: any) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const filterPapers = () => {
    let filtered = papers;

    if (searchTerm) {
      filtered = filtered.filter(paper =>
        paper.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.file_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (termFilter && termFilter !== "all_items") {
      filtered = filtered.filter(paper => paper.term === termFilter);
    }

    if (yearFilter && yearFilter !== "all_items") {
      filtered = filtered.filter(paper => paper.year.toString() === yearFilter);
    }

    setFilteredPapers(filtered);
  };

  const handleDeletePaper = async (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Paper',
      description: 'Are you sure you want to delete this paper? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await paperService.delete(id);
          setPapers(papers.filter(p => p.id !== id));
          toast.success("Paper deleted successfully");
          fetchStats();
        } catch (error: any) {
          console.error("Failed to delete paper:", error);
          toast.error(error.response?.data?.detail || "Failed to delete paper");
        }
      },
    });
  };

  const handleCreatePaper = () => {
    setEditingPaper(null);
    setUploadedFile(null);
    setIsFormOpen(true);
  };

  const handleEditPaper = (paper: Paper) => {
    setEditingPaper(paper);
    setUploadedFile(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: PaperFormData) => {
    try {
      setIsSubmitting(true);

      if (editingPaper) {
        const updated = await paperService.update(editingPaper.id, data);
        setPapers(papers.map(p => p.id === updated.id ? updated : p));
        alert("Paper updated successfully");
      } else {
        const created = await paperService.create(data);
        setPapers([created, ...papers]);
        alert("Paper uploaded successfully");
      }

      setIsFormOpen(false);
      setEditingPaper(null);
      setUploadedFile(null);
      fetchStats();
    } catch (error: any) {
      console.error("Failed to save paper:", error);
      alert(error.response?.data?.detail || "Failed to save paper");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = (paper: Paper) => {
    window.open(paper.file_url, '_blank');
  };

  const uniqueYears = Array.from(new Set(papers.map(p => p.year.toString()))).sort().reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Exam Papers</h1>
          <p className="text-gray-600 mt-1">
            Upload and manage your exam papers
          </p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleCreatePaper}
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Paper
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">My Papers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_papers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Upload className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Uploads</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recent_uploads}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Subjects</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(stats.papers_by_subject).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search papers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={termFilter} onValueChange={setTermFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_items">All Terms</SelectItem>
                <SelectItem value="first_term">First Term</SelectItem>
                <SelectItem value="second_term">Second Term</SelectItem>
                <SelectItem value="third_term">Third Term</SelectItem>
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_items">All Years</SelectItem>
                {uniqueYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setTermFilter("all_items");
                setYearFilter("all_items");
              }}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Papers List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPapers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No papers found</h3>
              <p className="text-gray-600">
                {searchTerm || termFilter || yearFilter
                  ? "Try adjusting your filters to see more results."
                  : "Upload your first exam paper to get started."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPapers.map((paper) => (
            <Card key={paper.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {paper.subject}
                      </h3>
                      <Badge className={termColors[paper.term as keyof typeof termColors]}>
                        {termLabels[paper.term as keyof typeof termLabels]}
                      </Badge>
                      <Badge className="bg-gray-100 text-gray-800">
                        {paper.year}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        <span>{paper.class_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(paper.upload_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-700">
                      <span className="font-medium">File:</span> {paper.file_name}
                      {paper.file_size && (
                        <span className="ml-2 text-gray-500">
                          ({(paper.file_size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      )}
                    </div>

                    {paper.description && (
                      <p className="text-sm text-gray-600 mt-2">{paper.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(paper)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPaper(paper)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePaper(paper.id)}
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

      {/* Paper Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPaper ? "Edit Paper" : "Upload New Paper"}
            </DialogTitle>
          </DialogHeader>
          <PaperFormDialog
            onSubmit={handleFormSubmit}
            initialData={editingPaper ? {
              class_id: editingPaper.class_id,
              class_name: editingPaper.class_name,
              subject: editingPaper.subject,
              term: editingPaper.term,
              year: editingPaper.year,
              file_url: editingPaper.file_url,
              file_name: editingPaper.file_name,
              file_type: editingPaper.file_type,
              file_size: editingPaper.file_size,
              description: editingPaper.description,
            } : undefined}
            isLoading={isSubmitting}
            mode={editingPaper ? "edit" : "create"}
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
          />
        </DialogContent>
      </Dialog>

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
  );
}

// Paper form component (reused from admin)
function PaperFormDialog({
  onSubmit,
  initialData,
  isLoading,
  mode,
  uploadedFile,
  setUploadedFile,
}: {
  onSubmit: (data: PaperFormData) => Promise<void>;
  initialData?: Partial<PaperFormData>;
  isLoading?: boolean;
  mode?: "create" | "edit";
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
}) {
  const [formData, setFormData] = useState<PaperFormData>({
    class_id: initialData?.class_id || "",
    class_name: initialData?.class_name || "",
    subject: initialData?.subject || "",
    term: initialData?.term || "first_term",
    year: initialData?.year || new Date().getFullYear(),
    file_url: initialData?.file_url || "",
    file_name: initialData?.file_name || "",
    file_type: initialData?.file_type || "",
    file_size: initialData?.file_size,
    description: initialData?.description || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.class_name.trim()) {
      newErrors.class_name = "Class name is required";
    }
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }
    if (!formData.year) {
      newErrors.year = "Year is required";
    }
    if (!formData.file_url && !uploadedFile) {
      newErrors.file = "Please upload a file";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("Please upload PDF, Word, or Image files only");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setUploadedFile(file);
      setFormData({
        ...formData,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const finalFormData = { ...formData };
    
    if (uploadedFile) {
      setIsUploading(true);
      try {
        const mockUrl = `/uploads/papers/${Date.now()}_${uploadedFile.name}`;
        finalFormData.file_url = mockUrl;
      } catch (error) {
        toast.error("Failed to upload file");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    await onSubmit(finalFormData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Class Name *</label>
          <Input
            value={formData.class_name}
            onChange={(e) => setFormData({ ...formData, class_name: e.target.value, class_id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            placeholder="e.g., Class 10-A"
            className={errors.class_name ? "border-red-500" : ""}
          />
          {errors.class_name && <p className="text-sm text-red-600">{errors.class_name}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Subject *</label>
          <Input
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="e.g., Mathematics"
            className={errors.subject ? "border-red-500" : ""}
          />
          {errors.subject && <p className="text-sm text-red-600">{errors.subject}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Term *</label>
          <Select
            value={formData.term}
            onValueChange={(value) => setFormData({ ...formData, term: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="first_term">First Term</SelectItem>
              <SelectItem value="second_term">Second Term</SelectItem>
              <SelectItem value="third_term">Third Term</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Year *</label>
          <Input
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            min={2020}
            max={2100}
            className={errors.year ? "border-red-500" : ""}
          />
          {errors.year && <p className="text-sm text-red-600">{errors.year}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Upload File * (PDF, Word, or Image)</label>
        <Input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className={errors.file ? "border-red-500" : ""}
        />
        {uploadedFile && (
          <p className="text-sm text-green-600">
            Selected: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
        {formData.file_name && !uploadedFile && (
          <p className="text-sm text-gray-600">
            Current file: {formData.file_name}
          </p>
        )}
        {errors.file && <p className="text-sm text-red-600">{errors.file}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description (Optional)</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Add any additional notes about this paper..."
          rows={3}
          className="w-full rounded-md border px-3 py-2 text-sm border-gray-300"
        />
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
          disabled={isLoading || isUploading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading || isUploading ? "Processing..." : mode === "create" ? "Upload Paper" : "Update Paper"}
        </Button>
      </div>
    </form>
  );
}

