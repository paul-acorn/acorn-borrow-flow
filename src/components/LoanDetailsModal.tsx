import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BridgingFinanceModal } from "@/components/loan-types/BridgingFinanceModal";
import { MortgageModal } from "@/components/loan-types/MortgageModal";
import { BusinessLoanModal } from "@/components/loan-types/BusinessLoanModal";
import { DevelopmentFinanceModal } from "@/components/loan-types/DevelopmentFinanceModal";
import { EquityReleaseModal } from "@/components/loan-types/EquityReleaseModal";

interface LoanDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealType: string;
  dealName: string;
  onSave: (data: any) => void;
  onCreateRefinance?: (refinanceData: any) => void;
}

export function LoanDetailsModal({ open, onOpenChange, dealType, dealName, onSave, onCreateRefinance }: LoanDetailsModalProps) {
  const [formData, setFormData] = useState({});
  const { toast } = useToast();

  const handleSave = () => {
    onSave({ ...formData, dealType, dealName });
    toast({
      title: "Loan Details Saved",
      description: `Your ${dealType} details have been saved successfully.`,
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleAutoRefinance = (refinanceData: any) => {
    if (onCreateRefinance) {
      onCreateRefinance(refinanceData);
      toast({
        title: "Refinance Product Created",
        description: "A mortgage application has been automatically created for your exit strategy.",
      });
    }
  };

  const renderLoanTypeModal = () => {
    const props = {
      formData: { ...formData, dealName },
      onFormDataChange: setFormData
    };

    switch (dealType) {
      case 'bridging':
        return <BridgingFinanceModal {...props} onAutoRefinance={handleAutoRefinance} />;
      case 'mortgage':
        return <MortgageModal {...props} />;
      case 'business':
        return <BusinessLoanModal {...props} />;
      case 'development':
        return <DevelopmentFinanceModal {...props} onAutoRefinance={handleAutoRefinance} />;
      case 'equity':
        return <EquityReleaseModal {...props} />;
      case 'factoring':
      case 'asset':
      case 'mca':
        // For now, use business loan modal as base - these can be specialized later
        return <BusinessLoanModal {...props} />;
      default:
        return <div className="p-4 text-center text-muted-foreground">Loan type not yet implemented</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-navy">
            {dealType.charAt(0).toUpperCase() + dealType.slice(1)} Details - {dealName}
          </DialogTitle>
        </DialogHeader>

        {renderLoanTypeModal()}

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
            Save {dealType.charAt(0).toUpperCase() + dealType.slice(1)} Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}