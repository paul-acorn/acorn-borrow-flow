import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  Home, 
  Building, 
  Banknote, 
  Calculator, 
  Truck, 
  CreditCard, 
  PiggyBank 
} from "lucide-react";

interface DealCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; amount: number; type: LoanType }) => void;
}

type LoanType = 'bridging' | 'mortgage' | 'development' | 'business' | 'factoring' | 'asset' | 'mca' | 'equity';

const loanTypes = [
  {
    type: 'bridging' as LoanType,
    label: 'Bridging Finance',
    description: 'Short-term property financing',
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    type: 'mortgage' as LoanType,
    label: 'Mortgage',
    description: 'Residential & BTL mortgages',
    icon: Home,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    type: 'development' as LoanType,
    label: 'Development Finance',
    description: 'Property development funding',
    icon: Building,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    type: 'business' as LoanType,
    label: 'Business Loans',
    description: 'Commercial lending solutions',
    icon: Banknote,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    type: 'factoring' as LoanType,
    label: 'Factoring',
    description: 'Invoice financing solutions',
    icon: Calculator,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    type: 'asset' as LoanType,
    label: 'Asset Finance',
    description: 'Equipment & vehicle finance',
    icon: Truck,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    type: 'mca' as LoanType,
    label: 'Merchant Cash Advance',
    description: 'Business cash flow solutions',
    icon: CreditCard,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    type: 'equity' as LoanType,
    label: 'Equity Release',
    description: 'Later life lending',
    icon: PiggyBank,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
];

export function DealCreationModal({ open, onOpenChange, onSubmit }: DealCreationModalProps) {
  const [selectedType, setSelectedType] = useState<LoanType | null>(null);
  const [dealName, setDealName] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    if (!selectedType || !dealName || !amount) return;
    
    onSubmit({
      name: dealName,
      amount: parseFloat(amount),
      type: selectedType,
    });
    
    // Reset form
    setSelectedType(null);
    setDealName('');
    setAmount('');
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-navy">Create New Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loan Type Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-navy">Select Finance Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loanTypes.map((loanType) => {
                const IconComponent = loanType.icon;
                const isSelected = selectedType === loanType.type;
                
                return (
                  <Card
                    key={loanType.type}
                    className={`cursor-pointer transition-all border-2 ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedType(loanType.type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${loanType.bgColor}`}>
                          <IconComponent className={`w-6 h-6 ${loanType.color}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-navy">{loanType.label}</h4>
                          <p className="text-sm text-muted-foreground">{loanType.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Deal Details */}
          {selectedType && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-navy">Application Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dealName">Application Name</Label>
                  <Input
                    id="dealName"
                    placeholder="e.g., High Street Property Purchase"
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Funding Amount (£)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="500000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              
              {amount && (
                <div className="p-4 bg-gradient-surface rounded-lg border">
                  <div className="text-sm text-muted-foreground">Funding Amount</div>
                  <div className="text-2xl font-bold text-navy">
                    {formatCurrency(amount)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedType || !dealName || !amount}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              Create Application
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}