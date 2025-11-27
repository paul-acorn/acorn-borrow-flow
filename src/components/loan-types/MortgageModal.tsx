import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpModal, HelpButton } from "@/components/HelpModal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Home, Target, Banknote, Building } from "lucide-react";

interface MortgageModalProps {
  formData: any;
  onFormDataChange: (data: any) => void;
}

export function MortgageModal({ formData, onFormDataChange }: MortgageModalProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [helpContent, setHelpContent] = useState({ title: '', content: '' });

  const showHelpModal = (title: string, content: string) => {
    setHelpContent({ title, content });
    setShowHelp(true);
  };

  const handleFieldChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    onFormDataChange(newData);
  };

  return (
    <div className="space-y-6">
      {/* Property Type & Purpose */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Home className="w-5 h-5" />
            <span>Property Type & Purpose</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Property Type</Label>
              <RadioGroup
                value={formData.propertyType || ''}
                onValueChange={(value) => handleFieldChange('propertyType', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="residential" id="residential" />
                  <Label htmlFor="residential">Residential</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="buy-to-let" id="buy-to-let" />
                  <Label htmlFor="buy-to-let">Buy to Let</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="holiday-let" id="holiday-let" />
                  <Label htmlFor="holiday-let">Holiday Let</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="second-property" id="second-property" />
                  <Label htmlFor="second-property">Second Property</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="commercial-investment" id="commercial-investment" />
                  <Label htmlFor="commercial-investment">Commercial Investment</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mixed-use-investment" id="mixed-use-investment" />
                  <Label htmlFor="mixed-use-investment">Mixed Use Investment</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-3">
              <Label>Purpose</Label>
              <RadioGroup
                value={formData.purpose || ''}
                onValueChange={(value) => handleFieldChange('purpose', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="purchase" id="purchase" />
                  <Label htmlFor="purchase">Purchase</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remortgage" id="remortgage" />
                  <Label htmlFor="remortgage">Remortgage (£4£)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="capital-raise" id="capital-raise" />
                  <Label htmlFor="capital-raise">Capital Raise</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {formData.purpose === 'capital-raise' && (
            <div className="space-y-2">
              <Label htmlFor="capitalRaisePurpose">Purpose of Capital Raise</Label>
              <Select
                value={formData.capitalRaisePurpose || undefined}
                onValueChange={(value) => handleFieldChange('capitalRaisePurpose', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home-improvements">Home Improvements</SelectItem>
                  <SelectItem value="debt-consolidation">Debt Consolidation</SelectItem>
                  <SelectItem value="business-investment">Business Investment</SelectItem>
                  <SelectItem value="property-purchase">Property Purchase</SelectItem>
                  <SelectItem value="education-fees">Education Fees</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="applicantType">Applicant Type</Label>
            <Select
              value={formData.applicantType || undefined}
              onValueChange={(value) => handleFieldChange('applicantType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select applicant type" />
              </SelectTrigger>
              <SelectContent>
                {formData.propertyType === 'residential' ? (
                  <>
                    <SelectItem value="personal">Personal</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="ltd-company">Ltd Company</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="trust">Trust</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Financial Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Banknote className="w-5 h-5" />
            <span>Financial Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Loan Amount (£)</Label>
              <Input
                id="loanAmount"
                type="number"
                placeholder="400000"
                value={formData.loanAmount || ''}
                onChange={(e) => handleFieldChange('loanAmount', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">Term (years)</Label>
              <Input
                id="term"
                type="number"
                placeholder="25"
                value={formData.term || ''}
                onChange={(e) => handleFieldChange('term', e.target.value)}
              />
            </div>
          </div>

          {formData.purpose === 'purchase' && (
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (£)</Label>
              <Input
                id="purchasePrice"
                type="number"
                placeholder="500000"
                value={formData.purchasePrice || ''}
                onChange={(e) => handleFieldChange('purchasePrice', e.target.value)}
              />
            </div>
          )}

          {(formData.purpose === 'remortgage' || formData.purpose === 'capital-raise') && (
            <div className="space-y-2">
              <Label htmlFor="propertyValue">Current Property Value (£)</Label>
              <Input
                id="propertyValue"
                type="number"
                placeholder="550000"
                value={formData.propertyValue || ''}
                onChange={(e) => handleFieldChange('propertyValue', e.target.value)}
              />
            </div>
          )}

          {formData.purpose === 'remortgage' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="existingMortgage">Existing Mortgage Balance (£)</Label>
                <Input
                  id="existingMortgage"
                  type="number"
                  placeholder="300000"
                  value={formData.existingMortgage || ''}
                  onChange={(e) => handleFieldChange('existingMortgage', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additionalBorrowing">Additional Borrowing (£)</Label>
                <Input
                  id="additionalBorrowing"
                  type="number"
                  placeholder="50000"
                  value={formData.additionalBorrowing || ''}
                  onChange={(e) => handleFieldChange('additionalBorrowing', e.target.value)}
                />
              </div>
            </div>
          )}

          {formData.purpose === 'capital-raise' && (
            <div className="space-y-2">
              <Label htmlFor="capitalRaiseAmount">Capital Raise Amount (£)</Label>
              <Input
                id="capitalRaiseAmount"
                type="number"
                placeholder="100000"
                value={formData.capitalRaiseAmount || ''}
                onChange={(e) => handleFieldChange('capitalRaiseAmount', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mortgage Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Mortgage Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Rate Type Preference</Label>
            <RadioGroup
              value={formData.rateType || ''}
              onValueChange={(value) => handleFieldChange('rateType', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="variable" id="variable" />
                <Label htmlFor="variable">Variable Rate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed">Fixed Rate</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.rateType === 'fixed' && (
            <div className="space-y-2">
              <Label htmlFor="fixedTerm">Fixed Rate Term (years)</Label>
              <Select
                value={formData.fixedTerm || undefined}
                onValueChange={(value) => handleFieldChange('fixedTerm', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Years</SelectItem>
                  <SelectItem value="3">3 Years</SelectItem>
                  <SelectItem value="5">5 Years</SelectItem>
                  <SelectItem value="7">7 Years</SelectItem>
                  <SelectItem value="10">10 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <Label>Additional Features (The best mortgage might not have all selected features)</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="automatedValuation"
                  checked={formData.automatedValuation || false}
                  onChange={(e) => handleFieldChange('automatedValuation', e.target.checked.toString())}
                />
                <Label htmlFor="automatedValuation">Automated Valuation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="freeLegalFees"
                  checked={formData.freeLegalFees || false}
                  onChange={(e) => handleFieldChange('freeLegalFees', e.target.checked.toString())}
                />
                <Label htmlFor="freeLegalFees">Free Legal Fees</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cashback"
                  checked={formData.cashback || false}
                  onChange={(e) => handleFieldChange('cashback', e.target.checked.toString())}
                />
                <Label htmlFor="cashback">Cashback</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BTL Specific Details */}
      {(formData.propertyType === 'buy-to-let' || formData.propertyType === 'holiday-let') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Buy-to-Let Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Expected Monthly Rent (£)</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  placeholder="2000"
                  value={formData.monthlyRent || ''}
                  onChange={(e) => handleFieldChange('monthlyRent', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolioSize">Current Portfolio Size</Label>
                <Input
                  id="portfolioSize"
                  type="number"
                  placeholder="3"
                  value={formData.portfolioSize || ''}
                  onChange={(e) => handleFieldChange('portfolioSize', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rentalExperience">Rental Experience (years)</Label>
                <Input
                  id="rentalExperience"
                  type="number"
                  placeholder="5"
                  value={formData.rentalExperience || ''}
                  onChange={(e) => handleFieldChange('rentalExperience', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voidPeriods">Expected Void Periods (%)</Label>
                <Input
                  id="voidPeriods"
                  type="number"
                  placeholder="10"
                  value={formData.voidPeriods || ''}
                  onChange={(e) => handleFieldChange('voidPeriods', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <HelpModal
        open={showHelp}
        onOpenChange={setShowHelp}
        title={helpContent.title}
        content={helpContent.content}
      />
    </div>
  );
}