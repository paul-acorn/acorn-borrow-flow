import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Target, Clock, Banknote } from "lucide-react";

interface LoanDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealType: string;
  dealName: string;
  onSave: (data: any) => void;
}

export function LoanDetailsModal({ open, onOpenChange, dealType, dealName, onSave }: LoanDetailsModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    term: '',
    rationale: '',
    exitStrategy: '',
    plannedSpend: '',
    purchaseType: '',
    refinanceAmount: '',
    capitalRaise: ''
  });
  const { toast } = useToast();

  const handleSave = () => {
    onSave(formData);
    toast({
      title: "Loan Details Saved",
      description: "Your loan details have been saved successfully.",
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-navy">
            Loan Details - {dealName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="w-5 h-5" />
                <span>Basic Loan Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Loan Amount (£)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="500000"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term">Term (months)</Label>
                  <Input
                    id="term"
                    type="number"
                    placeholder="12"
                    value={formData.term}
                    onChange={(e) => setFormData({...formData, term: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Purpose & Strategy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rationale">Rationale for Loan</Label>
                <Textarea
                  id="rationale"
                  placeholder="Please explain the purpose of this loan..."
                  className="min-h-[100px]"
                  value={formData.rationale}
                  onChange={(e) => setFormData({...formData, rationale: e.target.value})}
                />
              </div>

              {(dealType === 'bridging' || dealType === 'development') && (
                <div className="space-y-2">
                  <Label htmlFor="exitStrategy">Exit Strategy</Label>
                  <Select
                    value={formData.exitStrategy}
                    onValueChange={(value) => setFormData({...formData, exitStrategy: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exit strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="refinance">Refinance to Mortgage</SelectItem>
                      <SelectItem value="retain">Retain & Refinance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Banknote className="w-5 h-5" />
                <span>Financial Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseType">Transaction Type</Label>
                <Select
                  value={formData.purchaseType}
                  onValueChange={(value) => setFormData({...formData, purchaseType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="refinance">Refinance</SelectItem>
                    <SelectItem value="refinance-capital">Refinance & Capital Raise</SelectItem>
                    <SelectItem value="second-charge">Second Charge Capital Raise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(dealType === 'development' || dealType === 'bridging') && (
                <div className="space-y-2">
                  <Label htmlFor="plannedSpend">Planned Development/Refurbishment Spend (£)</Label>
                  <Input
                    id="plannedSpend"
                    type="number"
                    placeholder="100000"
                    value={formData.plannedSpend}
                    onChange={(e) => setFormData({...formData, plannedSpend: e.target.value})}
                  />
                </div>
              )}

              {formData.purchaseType?.includes('refinance') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="refinanceAmount">Existing Debt to Refinance (£)</Label>
                    <Input
                      id="refinanceAmount"
                      type="number"
                      placeholder="300000"
                      value={formData.refinanceAmount}
                      onChange={(e) => setFormData({...formData, refinanceAmount: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capitalRaise">Additional Capital Raise (£)</Label>
                    <Input
                      id="capitalRaise"
                      type="number"
                      placeholder="100000"
                      value={formData.capitalRaise}
                      onChange={(e) => setFormData({...formData, capitalRaise: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
              Save Loan Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}