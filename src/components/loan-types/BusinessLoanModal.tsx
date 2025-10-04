import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpModal, HelpButton } from "@/components/HelpModal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Banknote, Target, Building, Shield } from "lucide-react";

interface BusinessLoanModalProps {
  formData: any;
  onFormDataChange: (data: any) => void;
}

export function BusinessLoanModal({ formData, onFormDataChange }: BusinessLoanModalProps) {
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
      {/* Loan Purpose */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Loan Purpose</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loanPurpose">Purpose of Loan</Label>
            <Select
              value={formData.loanPurpose || ''}
              onValueChange={(value) => handleFieldChange('loanPurpose', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select loan purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="working-capital">Working Capital</SelectItem>
                <SelectItem value="equipment-purchase">Equipment Purchase</SelectItem>
                <SelectItem value="business-acquisition">Business Acquisition</SelectItem>
                <SelectItem value="expansion">Business Expansion</SelectItem>
                <SelectItem value="debt-consolidation">Debt Consolidation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="useOfFunds">Detailed Use of Funds</Label>
            <Textarea
              id="useOfFunds"
              placeholder="Please provide a detailed breakdown of how the loan will be used..."
              className="min-h-[100px]"
              value={formData.useOfFunds || ''}
              onChange={(e) => handleFieldChange('useOfFunds', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Business Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Business Type</Label>
            <RadioGroup
              value={formData.businessType || ''}
              onValueChange={(value) => handleFieldChange('businessType', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sole-trader" id="sole-trader" />
                <Label htmlFor="sole-trader">Sole Trader</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partnership" id="partnership" />
                <Label htmlFor="partnership">Partnership</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ltd-company" id="ltd-company" />
                <Label htmlFor="ltd-company">Ltd Company</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="llp" id="llp" />
                <Label htmlFor="llp">LLP</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industrySector">Industry Sector</Label>
            <Select
              value={formData.industrySector || ''}
              onValueChange={(value) => handleFieldChange('industrySector', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industry sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="hospitality">Hospitality</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="professional-services">Professional Services</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="ABC Limited"
                value={formData.businessName || ''}
                onChange={(e) => handleFieldChange('businessName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tradingYears">Years Trading</Label>
              <Input
                id="tradingYears"
                type="number"
                placeholder="5"
                value={formData.tradingYears || ''}
                onChange={(e) => handleFieldChange('tradingYears', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Banknote className="w-5 h-5" />
            <span>Financial Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Loan Amount Required (£)</Label>
              <Input
                id="loanAmount"
                type="number"
                placeholder="100000"
                value={formData.loanAmount || ''}
                onChange={(e) => handleFieldChange('loanAmount', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">Loan Term (years)</Label>
              <Input
                id="term"
                type="number"
                placeholder="5"
                value={formData.term || ''}
                onChange={(e) => handleFieldChange('term', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="turnoverYear1">Last Year Turnover (£)</Label>
              <Input
                id="turnoverYear1"
                type="number"
                placeholder="500000"
                value={formData.turnoverYear1 || ''}
                onChange={(e) => handleFieldChange('turnoverYear1', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="turnoverYear2">Previous Year Turnover (£)</Label>
              <Input
                id="turnoverYear2"
                type="number"
                placeholder="450000"
                value={formData.turnoverYear2 || ''}
                onChange={(e) => handleFieldChange('turnoverYear2', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="turnoverYear3">3 Years Ago Turnover (£)</Label>
              <Input
                id="turnoverYear3"
                type="number"
                placeholder="400000"
                value={formData.turnoverYear3 || ''}
                onChange={(e) => handleFieldChange('turnoverYear3', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profitYear1">Last Year Net Profit (£)</Label>
              <Input
                id="profitYear1"
                type="number"
                placeholder="75000"
                value={formData.profitYear1 || ''}
                onChange={(e) => handleFieldChange('profitYear1', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profitYear2">Previous Year Net Profit (£)</Label>
              <Input
                id="profitYear2"
                type="number"
                placeholder="70000"
                value={formData.profitYear2 || ''}
                onChange={(e) => handleFieldChange('profitYear2', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profitYear3">3 Years Ago Net Profit (£)</Label>
              <Input
                id="profitYear3"
                type="number"
                placeholder="65000"
                value={formData.profitYear3 || ''}
                onChange={(e) => handleFieldChange('profitYear3', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cashFlow">Current Monthly Cash Flow (£)</Label>
            <Input
              id="cashFlow"
              type="number"
              placeholder="15000"
              value={formData.cashFlow || ''}
              onChange={(e) => handleFieldChange('cashFlow', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security & Guarantees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security & Guarantees</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Loan Security</Label>
            <RadioGroup
              value={formData.loanSecurity || ''}
              onValueChange={(value) => handleFieldChange('loanSecurity', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="secured" id="secured" />
                <Label htmlFor="secured">Secured</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unsecured" id="unsecured" />
                <Label htmlFor="unsecured">Unsecured</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.loanSecurity === 'secured' && (
            <div className="space-y-2">
              <Label htmlFor="securityDetails">Security Details</Label>
              <Textarea
                id="securityDetails"
                placeholder="Please describe the security being offered (property, assets, etc.)..."
                className="min-h-[80px]"
                value={formData.securityDetails || ''}
                onChange={(e) => handleFieldChange('securityDetails', e.target.value)}
              />
            </div>
          )}

          <div className="space-y-3">
            <Label>Personal Guarantees Required?</Label>
            <RadioGroup
              value={formData.personalGuarantees || ''}
              onValueChange={(value) => handleFieldChange('personalGuarantees', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="guarantees-yes" />
                <Label htmlFor="guarantees-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="guarantees-no" />
                <Label htmlFor="guarantees-no">No</Label>
              </div>
          </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <HelpModal
        open={showHelp}
        onOpenChange={setShowHelp}
        title={helpContent.title}
        content={helpContent.content}
      />
    </div>
  );
}