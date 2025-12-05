import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Upload, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealName: string;
  onSave: (data: any) => void;
}

interface DocumentCategory {
  id: string;
  name: string;
  required: boolean;
  documents: string[];
  description: string;
}

const documentCategories: DocumentCategory[] = [
  {
    id: 'identity',
    name: 'Identity Documents',
    required: true,
    documents: ['Passport', 'Driving License', 'Utility Bill'],
    description: 'Photo ID and proof of address'
  },
  {
    id: 'financial',
    name: 'Financial Documents',
    required: true,
    documents: ['Bank Statements (3 months)', 'Payslips (3 months)', 'Tax Returns', 'SA302'],
    description: 'Income and bank account verification'
  },
  {
    id: 'business',
    name: 'Business Documents',
    required: false,
    documents: ['Business Accounts', 'Management Accounts', 'Business Bank Statements'],
    description: 'For self-employed or business applications'
  },
  {
    id: 'property',
    name: 'Property Documents',
    required: true,
    documents: ['Property Valuation', 'Purchase Contract', 'Planning Permission', 'Title Deeds'],
    description: 'Property-related documentation'
  },
  {
    id: 'legal',
    name: 'Legal Documents',
    required: false,
    documents: ['Legal Pack', 'Searches', 'Survey Report', 'Insurance Quote'],
    description: 'Legal and survey documentation'
  }
];

export function DocumentUploadModal({ open, onOpenChange, dealName, onSave }: DocumentUploadModalProps) {
  const [uploadedDocs, setUploadedDocs] = useState<{[key: string]: string}>({});
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleUpload = async (categoryId: string, docType: string) => {
    try {
      toast({
        title: "Uploading...",
        description: `Connecting to secure storage...`,
      });

      const dummyContent = `This is a test document for ${docType} in deal: ${dealName}.\nUploaded securely via Acorn Finance.`;
      const base64Content = btoa(dummyContent);

      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: {
          action: 'upload',
          fileName: `${dealName}/${categoryId}/${docType}.txt`, 
          fileContent: base64Content,
          mimeType: 'text/plain'
        }
      });

      if (error) {
        throw error;
      }

      console.log('Upload successful:', data);

      setUploadedDocs(prev => ({
        ...prev,
        [`${categoryId}-${docType}`]: 'uploaded'
      }));
      
      toast({
        title: "Success",
        description: `${docType} has been saved securely to Google Drive.`,
      });

    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: "Could not save to Google Drive. Please check your connection.",
        variant: "destructive"
      });
    }
  };

  const handleSave = () => {
    onSave({ uploadedDocs });
    toast({
      title: "Documents Saved",
      description: "Your document status has been saved.",
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getDocumentStatus = (categoryId: string, docType: string) => {
    const key = `${categoryId}-${docType}`;
    return uploadedDocs[key] || 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Uploaded</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      default:
        return <Badge variant="secondary" className="bg-red-100 text-red-700">Required</Badge>;
    }
  };

  // Shared content for both Dialog and Drawer
  const ModalContent = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">Document Upload Guidelines</h3>
        </div>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Upload clear, high-quality images or PDFs</li>
          <li>• Ensure all text is legible and dates are visible</li>
          <li>• Documents should be recent (within 3 months for statements)</li>
          <li>• Maximum file size: 10MB per document</li>
        </ul>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className={`${isMobile ? 'flex flex-wrap gap-1 h-auto p-1' : 'grid grid-cols-6'} bg-secondary`}>
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="identity" className="text-xs">Identity</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs">Financial</TabsTrigger>
          <TabsTrigger value="business" className="text-xs">Business</TabsTrigger>
          <TabsTrigger value="property" className="text-xs">Property</TabsTrigger>
          <TabsTrigger value="legal" className="text-xs">Legal</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {documentCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>{category.name}</span>
                    {category.required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {category.documents.map((docType) => {
                    const status = getDocumentStatus(category.id, docType);
                    return (
                      <div key={docType} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(status)}
                          <div>
                            <div className="font-medium text-sm">{docType}</div>
                            {getStatusBadge(status)}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpload(category.id, docType)}
                          disabled={status === 'uploaded'}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {status === 'uploaded' ? 'Done' : 'Upload'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {documentCategories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <FileText className="w-4 h-4" />
                  <span>{category.name}</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.documents.map((docType) => {
                    const status = getDocumentStatus(category.id, docType);
                    return (
                      <div key={docType} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(status)}
                            <h4 className="font-medium text-sm">{docType}</h4>
                            {getStatusBadge(status)}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleUpload(category.id, docType)}
                          disabled={status === 'uploaded'}
                          className="w-full h-16 border-dashed"
                        >
                          <div className="text-center">
                            <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                            <span className="text-xs">
                              {status === 'uploaded' ? 'Uploaded' : `Upload ${docType}`}
                            </span>
                          </div>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={handleCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          className="flex-1 bg-gradient-primary hover:opacity-90"
        >
          Save Status
        </Button>
      </div>
    </div>
  );

  // Render as Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl">
              Document Upload - {dealName}
            </DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 pb-4 overflow-y-auto max-h-[70vh]">
            <ModalContent />
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-navy">
            Document Upload - {dealName}
          </DialogTitle>
        </DialogHeader>
        <ModalContent />
      </DialogContent>
    </Dialog>
  );
}
