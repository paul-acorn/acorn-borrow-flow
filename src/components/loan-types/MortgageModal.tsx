import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const handleFieldChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    onFormDataChange(newData);
  };

  return (
    <div className="space-y-6">
      {/* Mortgage Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Home className="w-5 h-5" />
            <span>Mortgage Type</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Mortgage Type</Label>
            <RadioGroup
              value={formData.mortgageType || ''}
              onValueChange={(value) => handleFieldChange('mortgageType', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="residential-purchase" id="residential-purchase" />
                <Label htmlFor="residential-purchase">Residential Purchase</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="btl-purchase" id="btl-purchase" />
                <Label htmlFor="btl-purchase">Buy-to-Let Purchase</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remortgage" id="remortgage" />
                <Label htmlFor="remortgage">Remortgage</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="product-transfer" id="product-transfer" />
                <Label htmlFor="product-transfer">Product Transfer</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyPurpose">Property Purpose</Label>
            <Select
              value={formData.propertyPurpose || ''}
              onValueChange={(value) => handleFieldChange('propertyPurpose', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner-occupied">Owner Occupied</SelectItem>
                <SelectItem value="buy-to-let">Buy-to-Let</SelectItem>
                <SelectItem value="holiday-let">Holiday Let</SelectItem>
                <SelectItem value="commercial-investment">Commercial Investment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicantType">Applicant Type</Label>
            <Select
              value={formData.applicantType || ''}
              onValueChange={(value) => handleFieldChange('applicantType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select applicant type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="ltd-company">Ltd Company</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="trust">Trust</SelectItem>
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

          {(formData.mortgageType === 'residential-purchase' || formData.mortgageType === 'btl-purchase') && (
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

          {(formData.mortgageType === 'remortgage' || formData.mortgageType === 'product-transfer') && (
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

          {formData.mortgageType === 'remortgage' && (
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
        </CardContent>
      </Card>

      {/* BTL Specific Details */}
      {(formData.propertyPurpose === 'buy-to-let' || formData.propertyPurpose === 'holiday-let') && (
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

      {/* Income Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Income Verification</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="incomeType">Primary Income Type</Label>
            <Select
              value={formData.incomeType || ''}
              onValueChange={(value) => handleFieldChange('incomeType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select income type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employed">Employed</SelectItem>
                <SelectItem value="self-employed">Self-Employed</SelectItem>
                <SelectItem value="company-director">Ltd Company Director</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="annualIncome">Annual Gross Income (£)</Label>
            <Input
              id="annualIncome"
              type="number"
              placeholder="75000"
              value={formData.annualIncome || ''}
              onChange={(e) => handleFieldChange('annualIncome', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose of Mortgage</Label>
            <Textarea
              id="purpose"
              placeholder="Please describe the intended use of the property and mortgage..."
              className="min-h-[100px]"
              value={formData.purpose || ''}
              onChange={(e) => handleFieldChange('purpose', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}