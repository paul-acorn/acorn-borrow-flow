import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileCheck, 
  FileX, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Eye,
  Shield,
  Clock,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Document {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  verified: boolean;
  verification_notes: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    deal_code: string;
  };
}

interface VerificationDetails {
  confidence?: number;
  extracted_data?: Record<string, any>;
  fraud_indicators?: string[];
  notes?: string;
  verified_at?: string;
  manual_review?: boolean;
  reviewed_at?: string;
}

export function DocumentReviewDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [filterType, setFilterType] = useState<string>("all");
  const [manualReviewNotes, setManualReviewNotes] = useState("");

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['client-documents', filterStatus, filterType],
    queryFn: async () => {
      let query = supabase
        .from('client_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (filterStatus === 'pending') {
        query = query.eq('verified', false);
      } else if (filterStatus === 'verified') {
        query = query.eq('verified', true);
      }

      if (filterType !== 'all') {
        query = query.eq('document_type', filterType);
      }

      const { data: docs, error } = await query;
      if (error) throw error;

      // Fetch profile data separately for each document
      const docsWithProfiles = await Promise.all(
        (docs || []).map(async (doc) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, deal_code')
            .eq('id', doc.user_id)
            .single();

          return {
            ...doc,
            profiles: profile || { first_name: '', last_name: '', email: '', deal_code: '' }
          };
        })
      );

      return docsWithProfiles as Document[];
    },
  });

  // AI Verification mutation
  const verifyDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const document = documents.find(d => d.id === documentId);
      if (!document) throw new Error('Document not found');

      const { data, error } = await supabase.functions.invoke('verify-document', {
        body: { 
          documentId,
          documentType: document.document_type 
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      toast({
        title: "Verification Complete",
        description: "Document has been analyzed by AI.",
      });
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Failed to verify document",
        variant: "destructive",
      });
    },
  });

  // Manual review mutation
  const manualReviewMutation = useMutation({
    mutationFn: async ({ documentId, verified, notes }: { documentId: string; verified: boolean; notes: string }) => {
      const { error } = await supabase
        .from('client_documents')
        .update({
          verified,
          verification_notes: JSON.stringify({
            manual_review: true,
            notes,
            reviewed_at: new Date().toISOString()
          })
        })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      setSelectedDocument(null);
      setManualReviewNotes("");
      toast({
        title: "Review Saved",
        description: "Manual review has been recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Review Failed",
        description: error instanceof Error ? error.message : "Failed to save review",
        variant: "destructive",
      });
    },
  });

  const handleViewDocument = async (document: Document) => {
    setSelectedDocument(document);
    
    const { data } = await supabase.storage
      .from('client-documents')
      .createSignedUrl(document.file_path, 3600);
    
    if (data?.signedUrl) {
      setImageUrl(data.signedUrl);
    }
  };

  const getVerificationDetails = (doc: Document): VerificationDetails | null => {
    if (!doc.verification_notes) return null;
    try {
      return JSON.parse(doc.verification_notes);
    } catch {
      return null;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const pendingCount = documents.filter(d => !d.verified).length;
  const verifiedCount = documents.filter(d => d.verified).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Review Dashboard</h2>
          <p className="text-muted-foreground">Review and verify client documents</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">AI-Powered Verification</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-2xl font-bold">{verifiedCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{documents.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Document Type</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="identity">Identity</SelectItem>
              <SelectItem value="proof_of_address">Proof of Address</SelectItem>
              <SelectItem value="bank_statement">Bank Statement</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents found
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const verificationDetails = getVerificationDetails(doc);
                const hasFraudIndicators = verificationDetails?.fraud_indicators && verificationDetails.fraud_indicators.length > 0;

                return (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-2 rounded-lg ${doc.verified ? 'bg-success/10' : hasFraudIndicators ? 'bg-destructive/10' : 'bg-muted'}`}>
                        {doc.verified ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : hasFraudIndicators ? (
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                        ) : (
                          <FileCheck className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium truncate">{doc.file_name}</p>
                          <Badge variant="outline" className="text-xs">
                            {getDocumentTypeLabel(doc.document_type)}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{doc.profiles.first_name} {doc.profiles.last_name}</span>
                          <span>•</span>
                          <span>{doc.profiles.deal_code}</span>
                          <span>•</span>
                          <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>

                        {verificationDetails && (
                          <div className="mt-2 space-y-1">
                            {verificationDetails.confidence !== undefined && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground">Confidence:</span>
                                <span className={`text-xs font-medium ${
                                  verificationDetails.confidence > 80 ? 'text-success' :
                                  verificationDetails.confidence > 50 ? 'text-orange-500' :
                                  'text-destructive'
                                }`}>
                                  {verificationDetails.confidence}%
                                </span>
                              </div>
                            )}
                            {hasFraudIndicators && (
                              <div className="flex items-start space-x-2">
                                <AlertTriangle className="w-3 h-3 text-destructive mt-0.5" />
                                <span className="text-xs text-destructive">
                                  {verificationDetails.fraud_indicators!.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                      
                <Button
                  size="sm"
                  onClick={() => verifyDocumentMutation.mutate(doc.id)}
                  disabled={verifyDocumentMutation.isPending}
                >
                  {verifyDocumentMutation.isPending && verifyDocumentMutation.variables === doc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      AI Verify
                    </>
                  )}
                </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Review Modal */}
      <Dialog open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Review</DialogTitle>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-6">
              {/* Document Preview */}
              <div className="border rounded-lg overflow-hidden">
                {imageUrl && (
                  selectedDocument.mime_type.startsWith('image/') ? (
                    <img src={imageUrl} alt="Document" className="w-full" />
                  ) : (
                    <iframe src={imageUrl} className="w-full h-[500px]" />
                  )
                )}
              </div>

              {/* Document Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Client</Label>
                  <p className="font-medium">
                    {selectedDocument.profiles.first_name} {selectedDocument.profiles.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedDocument.profiles.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Document Type</Label>
                  <p className="font-medium">{getDocumentTypeLabel(selectedDocument.document_type)}</p>
                </div>
              </div>

              {/* AI Verification Results */}
              {(() => {
                const details = getVerificationDetails(selectedDocument);
                if (details && !details.manual_review) {
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Shield className="w-5 h-5" />
                          <span>AI Verification Results</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {details.confidence !== undefined && (
                          <div>
                            <Label>Confidence Score</Label>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    details.confidence > 80 ? 'bg-success' :
                                    details.confidence > 50 ? 'bg-orange-500' :
                                    'bg-destructive'
                                  }`}
                                  style={{ width: `${details.confidence}%` }}
                                />
                              </div>
                              <span className="font-medium">{details.confidence}%</span>
                            </div>
                          </div>
                        )}

                        {details.extracted_data && Object.keys(details.extracted_data).length > 0 && (
                          <div>
                            <Label>Extracted Data</Label>
                            <div className="mt-2 space-y-2">
                              {Object.entries(details.extracted_data).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{key.replace(/_/g, ' ')}:</span>
                                  <span className="font-medium">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {details.fraud_indicators && details.fraud_indicators.length > 0 && (
                          <div>
                            <Label className="text-destructive">Fraud Indicators</Label>
                            <ul className="mt-2 space-y-1">
                              {details.fraud_indicators.map((indicator, idx) => (
                                <li key={idx} className="flex items-start space-x-2 text-sm">
                                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                                  <span>{indicator}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {details.notes && (
                          <div>
                            <Label>AI Analysis</Label>
                            <p className="mt-2 text-sm text-muted-foreground">{details.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                }
                return null;
              })()}

              {/* Manual Review */}
              <div className="space-y-4">
                <Label>Manual Review Notes</Label>
                <Textarea
                  placeholder="Add your review notes here..."
                  value={manualReviewNotes}
                  onChange={(e) => setManualReviewNotes(e.target.value)}
                  rows={4}
                />
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => manualReviewMutation.mutate({
                      documentId: selectedDocument.id,
                      verified: true,
                      notes: manualReviewNotes
                    })}
                    disabled={manualReviewMutation.isPending}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={() => manualReviewMutation.mutate({
                      documentId: selectedDocument.id,
                      verified: false,
                      notes: manualReviewNotes
                    })}
                    disabled={manualReviewMutation.isPending}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}