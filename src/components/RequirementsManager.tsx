import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Calendar, AlertCircle, CheckCircle, Clock, Upload, FileText, X, Download } from "lucide-react";
import { z } from "zod";

interface Requirement {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface RequirementDocument {
  id: string;
  requirement_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

// File validation schema
const fileSchema = z.object({
  size: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
  type: z.string().refine(
    (type) => [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ].includes(type),
    "File type must be PDF, JPG, PNG, DOC, DOCX, XLS, or XLSX"
  ),
});

interface RequirementsManagerProps {
  dealId: string;
  canManage?: boolean;
}

export function RequirementsManager({ dealId, canManage = false }: RequirementsManagerProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [documents, setDocuments] = useState<Record<string, RequirementDocument[]>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRequirement, setNewRequirement] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!dealId) return;
    fetchRequirements();
    fetchDocuments();

    // Subscribe to real-time updates for requirements
    const requirementsChannel = supabase
      .channel(`requirements-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requirements",
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          fetchRequirements();
        }
      )
      .subscribe();

    // Subscribe to real-time updates for documents
    const documentsChannel = supabase
      .channel(`requirement-documents-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requirement_documents",
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requirementsChannel);
      supabase.removeChannel(documentsChannel);
    };
  }, [dealId]);

  const fetchRequirements = async () => {
    const { data, error } = await supabase
      .from("requirements")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load requirements",
        variant: "destructive",
      });
    } else {
      setRequirements(data || []);
    }
    setLoading(false);
  };

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from("requirement_documents" as any)
      .select(`
        *,
        profiles:uploaded_by (
          first_name,
          last_name
        )
      `)
      .eq("deal_id", dealId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Failed to load documents:", error);
    } else {
      // Group documents by requirement_id
      const typedData = (data || []) as any[];
      const grouped = typedData.reduce((acc, doc) => {
        if (!acc[doc.requirement_id]) {
          acc[doc.requirement_id] = [];
        }
        acc[doc.requirement_id].push(doc);
        return acc;
      }, {} as Record<string, RequirementDocument[]>);
      setDocuments(grouped);
    }
  };

  const handleAddRequirement = async () => {
    if (!newRequirement.title.trim()) {
      toast({
        title: "Error",
        description: "Requirement title is required",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("requirements").insert({
      deal_id: dealId,
      title: newRequirement.title,
      description: newRequirement.description || null,
      priority: newRequirement.priority,
      due_date: newRequirement.due_date || null,
      status: "pending",
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create requirement",
        variant: "destructive",
      });
      return;
    }

    // Log activity
    if (user) {
      await supabase.from("deal_activity_logs").insert({
        deal_id: dealId,
        user_id: user.id,
        action: "requirement_created",
        details: {
          requirement_title: newRequirement.title,
          priority: newRequirement.priority,
        },
      });
    }

    toast({
      title: "Success",
      description: "Requirement created successfully",
    });

    setNewRequirement({ title: "", description: "", priority: "medium", due_date: "" });
    setShowAddForm(false);
  };

  const handleUpdateStatus = async (requirementId: string, newStatus: string) => {
    const requirement = requirements.find((r) => r.id === requirementId);
    
    const { error } = await supabase
      .from("requirements")
      .update({ status: newStatus })
      .eq("id", requirementId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update requirement status",
        variant: "destructive",
      });
      return;
    }

    // Log activity
    if (user && requirement) {
      await supabase.from("deal_activity_logs").insert({
        deal_id: dealId,
        user_id: user.id,
        action: "requirement_status_changed",
        details: {
          requirement_title: requirement.title,
          old_status: requirement.status,
          new_status: newStatus,
        },
      });
    }

    toast({
      title: "Success",
      description: "Requirement status updated",
    });
  };

  const handleUpdatePriority = async (requirementId: string, newPriority: string) => {
    const { error } = await supabase
      .from("requirements")
      .update({ priority: newPriority })
      .eq("id", requirementId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update requirement priority",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Requirement priority updated",
    });
  };

  const handleFileUpload = async (requirementId: string, file: File) => {
    if (!user) return;

    // Validate file
    try {
      fileSchema.parse({ size: file.size, type: file.type });
    } catch (error: any) {
      toast({
        title: "Invalid File",
        description: error.errors?.[0]?.message || "Invalid file",
        variant: "destructive",
      });
      return;
    }

    setUploadingFile(requirementId);

    try {
      // Get the requirement to find the deal
      const { data: requirement, error: reqError } = await supabase
        .from('requirements')
        .select('deal_id, deals!inner(user_id)')
        .eq('id', requirementId)
        .single();

      if (reqError) throw reqError;

      const dealUserId = (requirement as any)?.deals?.user_id;
      if (!dealUserId) throw new Error('Deal user not found');

      // Get client profile
      const { data: clientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('deal_code, google_drive_folder_id')
        .eq('id', dealUserId)
        .single() as any;

      if (profileError) throw profileError;
      
      if (!clientProfile?.deal_code) {
        throw new Error('Client deal code not found');
      }

      // Get root folder ID from system settings
      const { data: settings, error: settingsError } = await supabase
        .from('system_settings' as any)
        .select('setting_value')
        .eq('setting_key', 'google_drive_root_folder_id')
        .maybeSingle();

      const rootFolderId = (settings as any)?.setting_value;

      if (!rootFolderId) {
        throw new Error('Google Drive root folder not configured. Please contact your administrator.');
      }

      // Check if client has a folder, create if not
      let clientFolderId = clientProfile.google_drive_folder_id;

      if (!clientFolderId) {
        // Create folder for client using their deal code
        const { data: folderData, error: folderError } = await supabase.functions.invoke('google-drive', {
          body: {
            action: 'createFolder',
            folderName: clientProfile.deal_code,
            parentFolderId: rootFolderId,
          },
        });

        if (folderError) throw folderError;
        clientFolderId = folderData.id;

        // Save folder ID to profile
        await supabase
          .from('profiles')
          .update({ google_drive_folder_id: clientFolderId } as any)
          .eq('id', dealUserId);
      }

      // Convert file to ArrayBuffer for upload
      const arrayBuffer = await file.arrayBuffer();

      // Upload file to Google Drive
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('google-drive', {
        body: {
          action: 'uploadBinary',
          fileName: file.name,
          fileData: Array.from(new Uint8Array(arrayBuffer)),
          mimeType: file.type,
          folderId: clientFolderId,
        },
      });

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase
        .from('requirement_documents' as any)
        .insert({
          requirement_id: requirementId,
          deal_id: dealId,
          file_name: file.name,
          file_path: `google-drive://${uploadData.id}`, // Store with prefix to indicate Google Drive
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
          google_drive_file_id: uploadData.id,
        });

      if (dbError) throw dbError;

      // Log activity
      await supabase.from("deal_activity_logs").insert({
        deal_id: dealId,
        user_id: user.id,
        action: "document_uploaded",
        details: {
          requirement_id: requirementId,
          file_name: file.name,
          storage: 'google_drive',
        },
      });

      toast({
        title: "Success",
        description: `${file.name} uploaded to Google Drive successfully`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(null);
    }
  };

  const handleFileDelete = async (documentId: string, filePath: string, googleDriveFileId?: string) => {
    try {
      // Delete from Google Drive if it's a Google Drive file
      if (googleDriveFileId) {
        const { error: driveError } = await supabase.functions.invoke('google-drive', {
          body: {
            action: 'delete',
            fileId: googleDriveFileId,
          },
        });

        if (driveError) {
          console.error('Failed to delete from Google Drive:', driveError);
          // Continue with database deletion even if Drive deletion fails
        }
      } else if (!filePath.startsWith('google-drive://')) {
        // Delete from Supabase storage if it's a storage file
        const { error: storageError } = await supabase.storage
          .from('requirement-documents')
          .remove([filePath]);

        if (storageError) {
          console.error('Failed to delete from storage:', storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('requirement_documents' as any)
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleFileDownload = async (filePath: string, fileName: string, googleDriveFileId?: string) => {
    try {
      let blob;

      if (googleDriveFileId) {
        // Download from Google Drive
        const { data, error } = await supabase.functions.invoke('google-drive', {
          body: {
            action: 'download',
            fileId: googleDriveFileId,
          },
        });

        if (error) throw error;
        blob = data;
      } else {
        // Download from Supabase storage
        const { data, error } = await supabase.storage
          .from('requirement-documents')
          .download(filePath);

        if (error) throw error;
        blob = data;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `${fileName} downloaded`,
      });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading requirements...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Additional Requirements</h3>
        {canManage && (
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Requirement
          </Button>
        )}
      </div>

      {showAddForm && canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Requirement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="req-title">Title *</Label>
              <Input
                id="req-title"
                value={newRequirement.title}
                onChange={(e) =>
                  setNewRequirement({ ...newRequirement, title: e.target.value })
                }
                placeholder="e.g., Submit proof of income"
              />
            </div>

            <div>
              <Label htmlFor="req-description">Description</Label>
              <Textarea
                id="req-description"
                value={newRequirement.description}
                onChange={(e) =>
                  setNewRequirement({ ...newRequirement, description: e.target.value })
                }
                placeholder="Add additional details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="req-priority">Priority</Label>
                <Select
                  value={newRequirement.priority}
                  onValueChange={(value) =>
                    setNewRequirement({ ...newRequirement, priority: value })
                  }
                >
                  <SelectTrigger id="req-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="req-due-date">Due Date</Label>
                <Input
                  id="req-due-date"
                  type="date"
                  value={newRequirement.due_date}
                  onChange={(e) =>
                    setNewRequirement({ ...newRequirement, due_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleAddRequirement}>Create Requirement</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {requirements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No additional requirements yet
            </CardContent>
          </Card>
        ) : (
          requirements.map((req) => (
            <Card key={req.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(req.status)}
                      <h4 className="font-medium text-foreground">{req.title}</h4>
                      <Badge variant={getPriorityColor(req.priority)} className="ml-2">
                        {req.priority}
                      </Badge>
                    </div>

                    {req.description && (
                      <p className="text-sm text-muted-foreground">{req.description}</p>
                    )}

                    {req.due_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Due: {new Date(req.due_date).toLocaleDateString()}
                      </div>
                    )}

                    {/* Uploaded Documents */}
                    {documents[req.id] && documents[req.id].length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Uploaded Documents ({documents[req.id].length}):
                        </p>
                        <div className="space-y-2">
                          {documents[req.id].map((doc) => {
                            const docWithProfile = doc as any;
                            const uploaderName = docWithProfile.profiles 
                              ? `${docWithProfile.profiles.first_name || ''} ${docWithProfile.profiles.last_name || ''}`.trim()
                              : 'Unknown';
                            const uploadDate = new Date(doc.uploaded_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });

                            return (
                              <div
                                key={doc.id}
                                className="p-3 bg-muted rounded-lg space-y-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <span>{formatFileSize(doc.file_size)}</span>
                                        <span>•</span>
                                        <span>{uploadDate}</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Uploaded by {uploaderName}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleFileDownload(doc.file_path, doc.file_name, docWithProfile.google_drive_file_id)}
                                      title="Download"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                    {(user?.id === doc.uploaded_by || canManage) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        onClick={() => handleFileDelete(doc.id, doc.file_path, docWithProfile.google_drive_file_id)}
                                        title="Delete"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className="mt-3">
                      <label htmlFor={`file-upload-${req.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={uploadingFile === req.id}
                          asChild
                        >
                          <span>
                            {uploadingFile === req.id ? (
                              <>Uploading...</>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                Upload Document
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                      <input
                        id={`file-upload-${req.id}`}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(req.id, file);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex flex-col gap-2">
                      <Select
                        value={req.status}
                        onValueChange={(value) => handleUpdateStatus(req.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={req.priority}
                        onValueChange={(value) => handleUpdatePriority(req.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
