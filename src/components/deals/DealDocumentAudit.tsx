import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface RequirementDocument {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  status: string;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  uploaded_at: string;
  requirement_id: string;
  requirements?: {
    title: string;
  };
}

interface DealDocumentAuditProps {
  dealId: string;
}

const DealDocumentAudit = ({ dealId }: DealDocumentAuditProps) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; documentId: string | null }>({
    open: false,
    documentId: null,
  });
  const [rejectionReason, setRejectionReason] = useState("");

  const canReview = hasRole("broker") || hasRole("admin") || hasRole("super_admin");

  // Fetch all documents for this deal
  const { data: documents, isLoading, error } = useQuery({
    queryKey: ["deal-documents", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_documents")
        .select(`
          *,
          requirements (title)
        `)
        .eq("deal_id", dealId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      return data as RequirementDocument[];
    },
    enabled: !!dealId,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from("requirement_documents")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-documents", dealId] });
      toast({ title: "Document Approved", description: "The document has been marked as approved." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ documentId, reason }: { documentId: string; reason: string }) => {
      const { error } = await supabase
        .from("requirement_documents")
        .update({
          status: "rejected",
          review_notes: reason,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-documents", dealId] });
      setRejectionDialog({ open: false, documentId: null });
      setRejectionReason("");
      toast({ title: "Document Rejected", description: "The document has been marked as rejected." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleApprove = (documentId: string) => {
    approveMutation.mutate(documentId);
  };

  const handleRejectClick = (documentId: string) => {
    setRejectionDialog({ open: true, documentId });
  };

  const handleRejectConfirm = () => {
    if (rejectionDialog.documentId && rejectionReason.trim()) {
      rejectMutation.mutate({ documentId: rejectionDialog.documentId, reason: rejectionReason });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Error loading documents.
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No documents uploaded for this deal yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card
          key={doc.id}
          className={`transition-colors ${
            doc.status === "approved"
              ? "bg-green-500/5 border-green-500/20"
              : doc.status === "rejected"
              ? "bg-destructive/5 border-destructive/20"
              : ""
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              {/* Document Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{doc.file_name}</span>
                  {getStatusBadge(doc.status)}
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    {doc.requirements?.title || "General Document"} • {formatFileSize(doc.file_size)}
                  </p>
                  <p>Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                </div>

                {/* Rejection reason */}
                {doc.status === "rejected" && doc.review_notes && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded-md text-sm text-destructive">
                    <span className="font-medium">Rejection Reason:</span> {doc.review_notes}
                  </div>
                )}
              </div>

              {/* Action Buttons (Broker only, pending status only) */}
              {canReview && doc.status === "pending" && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-green-600 hover:bg-green-500/10 hover:text-green-700"
                    onClick={() => handleApprove(doc.id)}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRejectClick(doc.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectionDialog.open} onOpenChange={(open) => setRejectionDialog({ open, documentId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this document. The client will see this message.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialog({ open: false, documentId: null })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DealDocumentAudit;
