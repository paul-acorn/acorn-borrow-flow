import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TrendingUp, Target, Banknote } from "lucide-react";

interface BridgingFinanceModalProps {
  formData: any;
  onFormDataChange: (data: any) => void;
  onAutoRefinance?: (refinanceData: any) => void;
}

export function BridgingFinanceModal({ formData, onFormDataChange, onAutoRefinance }: BridgingFinanceModalProps) {
  const handleFieldChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    onFormDataChange(newData);
    
    // Auto-create refinance product if exit strategy is refinance
    if (field === 'exitStrategy' && value === 'refinance' && onAutoRefinance) {
      onAutoRefinance({
        type: 'mortgage',
        name: `${formData.dealName || 'Property'} - Refinance`,
        amount: formData.amount || 0,
        purpose: 'refinance',
        linkedToBridging: true
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Transaction Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Transaction Type</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Transaction Type</Label>
            <RadioGroup
              value={formData.transactionType || ''}
              onValueChange={(value) => handleFieldChange('transactionType', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="purchase" id="purchase" />
                <Label htmlFor="purchase">Purchase</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="refinance" id="refinance" />
                <Label htmlFor="refinance">Refinance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="raise-capital" id="raise-capital" />
                <Label htmlFor="raise-capital">Raise Capital</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bridgingPurpose">Bridging Purpose</Label>
            <Select
              value={formData.bridgingPurpose || ''}
              onValueChange={(value) => handleFieldChange('bridgingPurpose', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select bridging purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="refurbishment">Refurbishment</SelectItem>
                <SelectItem value="auction-purchase">Auction Purchase</SelectItem>
                <SelectItem value="bmv-purchase">Below Market Value Purchase</SelectItem>
                <SelectItem value="business-capital">Business Capital Raise</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.bridgingPurpose === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="otherPurpose">Please specify</Label>
              <Textarea
                id="otherPurpose"
                placeholder="Please describe the purpose..."
                value={formData.otherPurpose || ''}
                onChange={(e) => handleFieldChange('otherPurpose', e.target.value)}
              />
            </div>
          )}
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
                placeholder="500000"
                value={formData.loanAmount || ''}
                onChange={(e) => handleFieldChange('loanAmount', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">Term (months)</Label>
              <Input
                id="term"
                type="number"
                placeholder="12"
                value={formData.term || ''}
                onChange={(e) => handleFieldChange('term', e.target.value)}
              />
            </div>
          </div>

          {formData.transactionType === 'purchase' && (
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (£)</Label>
              <Input
                id="purchasePrice"
                type="number"
                placeholder="600000"
                value={formData.purchasePrice || ''}
                onChange={(e) => handleFieldChange('purchasePrice', e.target.value)}
              />
            </div>
          )}

          {(formData.transactionType === 'refinance' || formData.transactionType === 'raise-capital' || formData.bridgingPurpose === 'bmv-purchase') && (
            <div className="space-y-2">
              <Label htmlFor="propertyValue">Property Value (£)</Label>
              <Input
                id="propertyValue"
                type="number"
                placeholder="700000"
                value={formData.propertyValue || ''}
                onChange={(e) => handleFieldChange('propertyValue', e.target.value)}
              />
            </div>
          )}

          {formData.bridgingPurpose === 'bmv-purchase' && (
            <div className="space-y-2">
              <Label htmlFor="bmvExplanation">Below Market Value Explanation</Label>
              <Textarea
                id="bmvExplanation"
                placeholder="Please explain why this property is below market value and the circumstances..."
                className="min-h-[80px]"
                value={formData.bmvExplanation || ''}
                onChange={(e) => handleFieldChange('bmvExplanation', e.target.value)}
              />
            </div>
          )}

          {(formData.transactionType === 'refinance' || formData.transactionType === 'raise-capital') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="existingLoansCount">Number of Existing Loans to Repay</Label>
                <Input
                  id="existingLoansCount"
                  type="number"
                  placeholder="1"
                  value={formData.existingLoansCount || ''}
                  onChange={(e) => handleFieldChange('existingLoansCount', e.target.value)}
                />
              </div>
              {Array.from({ length: parseInt(formData.existingLoansCount || '0') }, (_, i) => (
                <div key={i} className="space-y-2 p-4 border rounded-lg">
                  <Label>Existing Loan {i + 1}</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`existingLoanBalance${i}`}>Balance (£)</Label>
                      <Input
                        id={`existingLoanBalance${i}`}
                        type="number"
                        placeholder="200000"
                        value={formData[`existingLoanBalance${i}`] || ''}
                        onChange={(e) => handleFieldChange(`existingLoanBalance${i}`, e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`existingLoanLender${i}`}>Lender</Label>
                      <Input
                        id={`existingLoanLender${i}`}
                        placeholder="Current lender name"
                        value={formData[`existingLoanLender${i}`] || ''}
                        onChange={(e) => handleFieldChange(`existingLoanLender${i}`, e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`existingLoanRate${i}`}>Interest Rate (%)</Label>
                      <Input
                        id={`existingLoanRate${i}`}
                        type="number"
                        step="0.01"
                        placeholder="5.5"
                        value={formData[`existingLoanRate${i}`] || ''}
                        onChange={(e) => handleFieldChange(`existingLoanRate${i}`, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(formData.bridgingPurpose === 'refurbishment' || formData.bridgingPurpose?.includes('development')) && (
            <div className="space-y-2">
              <Label htmlFor="gdv">Gross Development Value - GDV (£)</Label>
              <Input
                id="gdv"
                type="number"
                placeholder="800000"
                value={formData.gdv || ''}
                onChange={(e) => handleFieldChange('gdv', e.target.value)}
              />
            </div>
          )}

          {formData.bridgingPurpose === 'refurbishment' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refurbCosts">Refurbishment Costs (£)</Label>
                <Input
                  id="refurbCosts"
                  type="number"
                  placeholder="100000"
                  value={formData.refurbCosts || ''}
                  onChange={(e) => handleFieldChange('refurbCosts', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Upload Schedule of Works</Label>
                <p className="text-sm text-muted-foreground">This will be requested on the loan details page</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exit Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Exit Strategy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exitStrategy">Exit Strategy</Label>
            <Select
              value={formData.exitStrategy || ''}
              onValueChange={(value) => handleFieldChange('exitStrategy', value)}
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

          {formData.exitStrategy === 'refinance' && (
            <div className="space-y-2">
              <Label htmlFor="projectedRent">Projected Monthly Rent (£)</Label>
              <Input
                id="projectedRent"
                type="number"
                placeholder="2500"
                value={formData.projectedRent || ''}
                onChange={(e) => handleFieldChange('projectedRent', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                A mortgage application will be created for 75% of the GDV ({formData.gdv ? `£${(parseFloat(formData.gdv) * 0.75).toLocaleString()}` : '£0'})
              </p>
            </div>
          )}

          {formData.exitStrategy === 'sale' && (
            <div className="space-y-2">
              <Label htmlFor="projectedSalePrice">Projected Sale Price (£)</Label>
              <Input
                id="projectedSalePrice"
                type="number"
                placeholder="750000"
                value={formData.projectedSalePrice || ''}
                onChange={(e) => handleFieldChange('projectedSalePrice', e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="exitTimeline">Exit Timeline (months)</Label>
            <Input
              id="exitTimeline"
              type="number"
              placeholder="6"
              value={formData.exitTimeline || ''}
              onChange={(e) => handleFieldChange('exitTimeline', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rationale">Rationale for Loan</Label>
            <Textarea
              id="rationale"
              placeholder="Please explain the purpose and strategy for this bridging loan..."
              className="min-h-[100px]"
              value={formData.rationale || ''}
              onChange={(e) => handleFieldChange('rationale', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {formData.exitStrategy === 'refinance' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Auto-Refinance Product</h4>
                <p className="text-sm text-blue-800 mt-1">
                  A mortgage application will be automatically created when you save this bridging finance application to facilitate your refinance exit strategy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}