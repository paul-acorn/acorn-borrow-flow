import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building, Target, Banknote, Users } from "lucide-react";

interface DevelopmentFinanceModalProps {
  formData: any;
  onFormDataChange: (data: any) => void;
  onAutoRefinance?: (refinanceData: any) => void;
}

export function DevelopmentFinanceModal({ formData, onFormDataChange, onAutoRefinance }: DevelopmentFinanceModalProps) {
  const handleFieldChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    onFormDataChange(newData);
    
    // Auto-create refinance product if exit strategy is refinance
    if (field === 'exitStrategy' && value === 'refinance' && onAutoRefinance) {
      onAutoRefinance({
        type: 'mortgage',
        name: `${formData.dealName || 'Development'} - Refinance`,
        amount: formData.loanAmount || 0,
        purpose: 'refinance',
        linkedToDevelopment: true
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Development Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Development Type</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Development Type</Label>
            <RadioGroup
              value={formData.developmentType || ''}
              onValueChange={(value) => handleFieldChange('developmentType', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new-build" id="new-build" />
                <Label htmlFor="new-build">New Build</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="conversion" id="conversion" />
                <Label htmlFor="conversion">Conversion</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="refurbishment" id="refurbishment" />
                <Label htmlFor="refurbishment">Refurbishment</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="land-purchase" id="land-purchase" />
                <Label htmlFor="land-purchase">Land Purchase</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="developmentStage">Development Stage</Label>
            <Select
              value={formData.developmentStage || ''}
              onValueChange={(value) => handleFieldChange('developmentStage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select development stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning-secured">Planning Secured</SelectItem>
                <SelectItem value="pre-planning">Pre-Planning</SelectItem>
                <SelectItem value="construction-ready">Construction Ready</SelectItem>
                <SelectItem value="part-complete">Part Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Build Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Build Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numberOfUnits">Number of Units</Label>
              <Input
                id="numberOfUnits"
                type="number"
                placeholder="4"
                value={formData.numberOfUnits || ''}
                onChange={(e) => handleFieldChange('numberOfUnits', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitTypes">Unit Types</Label>
              <Input
                id="unitTypes"
                placeholder="2x2bed, 2x3bed"
                value={formData.unitTypes || ''}
                onChange={(e) => handleFieldChange('unitTypes', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="constructionTimeline">Construction Timeline (months)</Label>
              <Input
                id="constructionTimeline"
                type="number"
                placeholder="18"
                value={formData.constructionTimeline || ''}
                onChange={(e) => handleFieldChange('constructionTimeline', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractorDetails">Contractor Details</Label>
            <Textarea
              id="contractorDetails"
              placeholder="Main contractor name, experience, references..."
              className="min-h-[80px]"
              value={formData.contractorDetails || ''}
              onChange={(e) => handleFieldChange('contractorDetails', e.target.value)}
            />
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
              <Label htmlFor="loanAmount">Development Finance Required (£)</Label>
              <Input
                id="loanAmount"
                type="number"
                placeholder="800000"
                value={formData.loanAmount || ''}
                onChange={(e) => handleFieldChange('loanAmount', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">Term (months)</Label>
              <Input
                id="term"
                type="number"
                placeholder="24"
                value={formData.term || ''}
                onChange={(e) => handleFieldChange('term', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalProjectCost">Total Project Cost (£)</Label>
              <Input
                id="totalProjectCost"
                type="number"
                placeholder="1200000"
                value={formData.totalProjectCost || ''}
                onChange={(e) => handleFieldChange('totalProjectCost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gdv">Gross Development Value (£)</Label>
              <Input
                id="gdv"
                type="number"
                placeholder="1500000"
                value={formData.gdv || ''}
                onChange={(e) => handleFieldChange('gdv', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="landCost">Land Cost (£)</Label>
              <Input
                id="landCost"
                type="number"
                placeholder="400000"
                value={formData.landCost || ''}
                onChange={(e) => handleFieldChange('landCost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buildCosts">Build Costs (£)</Label>
              <Input
                id="buildCosts"
                type="number"
                placeholder="600000"
                value={formData.buildCosts || ''}
                onChange={(e) => handleFieldChange('buildCosts', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Sales Strategy</span>
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
                <SelectItem value="sale">Sale on Completion</SelectItem>
                <SelectItem value="refinance">Refinance to BTL Portfolio</SelectItem>
                <SelectItem value="mixed">Mixed (Some Sale, Some Retain)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preSoldUnits">Pre-sold Units</Label>
              <Input
                id="preSoldUnits"
                type="number"
                placeholder="0"
                value={formData.preSoldUnits || ''}
                onChange={(e) => handleFieldChange('preSoldUnits', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="averageSalePrice">Average Sale Price per Unit (£)</Label>
              <Input
                id="averageSalePrice"
                type="number"
                placeholder="375000"
                value={formData.averageSalePrice || ''}
                onChange={(e) => handleFieldChange('averageSalePrice', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="marketingStrategy">Marketing Strategy</Label>
            <Textarea
              id="marketingStrategy"
              placeholder="Estate agent details, marketing approach, target market..."
              className="min-h-[80px]"
              value={formData.marketingStrategy || ''}
              onChange={(e) => handleFieldChange('marketingStrategy', e.target.value)}
            />
          </div>

          {formData.exitStrategy === 'refinance' && (
            <div className="space-y-2">
              <Label htmlFor="expectedRentalYield">Expected Rental Yield (%)</Label>
              <Input
                id="expectedRentalYield"
                type="number"
                step="0.1"
                placeholder="6.5"
                value={formData.expectedRentalYield || ''}
                onChange={(e) => handleFieldChange('expectedRentalYield', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Professional Team</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="architect">Architect</Label>
              <Input
                id="architect"
                placeholder="Architect name & company"
                value={formData.architect || ''}
                onChange={(e) => handleFieldChange('architect', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantitySurveyor">Quantity Surveyor</Label>
              <Input
                id="quantitySurveyor"
                placeholder="QS name & company"
                value={formData.quantitySurveyor || ''}
                onChange={(e) => handleFieldChange('quantitySurveyor', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectManager">Project Manager</Label>
              <Input
                id="projectManager"
                placeholder="PM name & company"
                value={formData.projectManager || ''}
                onChange={(e) => handleFieldChange('projectManager', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalAdvisor">Legal Advisor</Label>
              <Input
                id="legalAdvisor"
                placeholder="Solicitor name & firm"
                value={formData.legalAdvisor || ''}
                onChange={(e) => handleFieldChange('legalAdvisor', e.target.value)}
              />
            </div>
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
                  A BTL mortgage application will be automatically created when you save this development finance application to facilitate your refinance exit strategy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}