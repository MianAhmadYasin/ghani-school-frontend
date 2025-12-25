"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Search, Filter, Calendar, User, Download, Edit, Trash2, Upload, BookOpen, GraduationCap, CheckCircle, XCircle, Clock, Send, AlertCircle } from "lucide-react";
import { paperService, Paper, PaperCreate, PaperStats } from "@/services/paperService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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

export default function PapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [stats, setStats] = useState<PaperStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all_items");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [termFilter, setTermFilter] = useState("all_items");
  const [yearFilter, setYearFilter] = useState("all_items");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showPendingApprovals, setShowPendingApprovals] = useState(false);
  const [selectedPaperForApproval, setSelectedPaperForApproval] = useState<Paper | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
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
  const queryClient = useQueryClient();

  // Fetch pending papers
  const { data: pendingPapersData, refetch: refetchPending } = useQuery({
    queryKey: ['pending-papers'],
    queryFn: () => paperService.getPending(),
  });

  // Approval/Rejection mutations
  const approveMutation = useMutation({
    mutationFn: (paperId: string) => paperService.approve(paperId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-papers'] });
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      toast.success('Paper approved successfully!');
      setSelectedPaperForApproval(null);
      setApprovalAction(null);
      refetchPending();
      fetchPapers();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to approve paper');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ paperId, reason }: { paperId: string; reason: string }) => 
      paperService.reject(paperId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-papers'] });
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      toast.success('Paper rejected');
      setSelectedPaperForApproval(null);
      setApprovalAction(null);
      setRejectionReason("");
      refetchPending();
      fetchPapers();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to reject paper');
    }
  });

  useEffect(() => {
    fetchPapers();
    fetchStats();
  }, []);

  useEffect(() => {
    filterPapers();
  }, [papers, searchTerm, classFilter, subjectFilter, termFilter, yearFilter]);

  const fetchPapers = async () => {
    try {
      setIsLoading(true);
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

    if (classFilter && classFilter !== "all_items") {
      filtered = filtered.filter(paper => paper.class_name === classFilter);
    }

    if (subjectFilter) {
      filtered = filtered.filter(paper => paper.subject.toLowerCase().includes(subjectFilter.toLowerCase()));
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
        toast.success("Paper updated successfully");
      } else {
        const created = await paperService.create(data);
        setPapers([created, ...papers]);
        toast.success("Paper uploaded successfully");
      }

      setIsFormOpen(false);
      setEditingPaper(null);
      setUploadedFile(null);
      fetchStats();
    } catch (error: any) {
      console.error("Failed to save paper:", error);
      toast.error(error.response?.data?.detail || "Failed to save paper");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = (paper: Paper) => {
    window.open(paper.file_url, '_blank');
  };

  // Get unique values for filters
  const uniqueClasses = Array.from(new Set(papers.map(p => p.class_name))).sort();
  const uniqueYears = Array.from(new Set(papers.map(p => p.year.toString()))).sort().reverse();

  return (
    <DashboardLayout allowedRoles={['admin', 'principal', 'teacher']}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paper Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and organize exam papers for all classes
          </p>
        </div>
        <div className="flex gap-3">
          {pendingPapersData && pendingPapersData.count > 0 && (
            <Button
              variant="outline"
              className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
              onClick={() => setShowPendingApprovals(true)}
            >
              <Clock className="h-4 w-4 mr-2" />
              Pending Approvals ({pendingPapersData.count})
            </Button>
          )}
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleCreatePaper}
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Paper
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Papers</p>
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
                <GraduationCap className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Classes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(stats.papers_by_class).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-orange-600" />
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search papers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_items">All Classes</SelectItem>
                {uniqueClasses.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Subject..."
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            />

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
                setClassFilter("all_items");
                setSubjectFilter("");
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
                {searchTerm || classFilter || subjectFilter || termFilter || yearFilter
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
                        <User className="h-4 w-4" />
                        <span>{paper.uploaded_by_name || 'Unknown'}</span>
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

      {/* Pending Approvals Dialog */}
      <Dialog open={showPendingApprovals} onOpenChange={setShowPendingApprovals}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Papers Pending Approval</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pendingPapersData && pendingPapersData.papers.length > 0 ? (
              pendingPapersData.papers.map((paper: Paper) => (
                <Card key={paper.id} className="border-l-4 border-l-yellow-400">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold">{paper.file_name}</h3>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />Pending
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-3">
                          <div><span className="font-medium">Subject:</span> {paper.subject}</div>
                          <div><span className="font-medium">Class:</span> {paper.class_name}</div>
                          <div><span className="font-medium">Term:</span> {paper.term}</div>
                          <div><span className="font-medium">Year:</span> {paper.year}</div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Uploaded by: {paper.uploaded_by_name || 'Unknown'}
                          {paper.submitted_for_approval_at && (
                            <span className="ml-4">
                              Submitted: {new Date(paper.submitted_for_approval_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setSelectedPaperForApproval(paper);
                            setApprovalAction('approve');
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setSelectedPaperForApproval(paper);
                            setApprovalAction('reject');
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No Pending Papers</p>
                <p>All papers have been reviewed</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval/Rejection Dialog */}
      <Dialog open={!!approvalAction} onOpenChange={() => {
        setApprovalAction(null);
        setSelectedPaperForApproval(null);
        setRejectionReason("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Paper' : 'Reject Paper'}
            </DialogTitle>
          </DialogHeader>
          {selectedPaperForApproval && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Paper:</strong> {selectedPaperForApproval.file_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Subject:</strong> {selectedPaperForApproval.subject} | 
                  <strong> Class:</strong> {selectedPaperForApproval.class_name}
                </p>
              </div>
              {approvalAction === 'reject' && (
                <div>
                  <Label>Rejection Reason *</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows={4}
                    className="mt-2"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setApprovalAction(null);
                    setSelectedPaperForApproval(null);
                    setRejectionReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  onClick={() => {
                    if (approvalAction === 'approve') {
                      approveMutation.mutate(selectedPaperForApproval.id);
                    } else {
                      if (!rejectionReason.trim()) {
                        toast.error('Please provide a rejection reason');
                        return;
                      }
                      rejectMutation.mutate({
                        paperId: selectedPaperForApproval.id,
                        reason: rejectionReason
                      });
                    }
                  }}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
    </DashboardLayout>
  );
}

// Paper form component
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
      // Check file type
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

      // Check file size (max 10MB)
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

    // If there's a new file, simulate upload (in real app, upload to storage)
    const finalFormData = { ...formData };
    
    if (uploadedFile) {
      setIsUploading(true);
      try {
        // Simulate file upload - in real app, upload to Supabase storage
        // For now, create a mock URL
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

