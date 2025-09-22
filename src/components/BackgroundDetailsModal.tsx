import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Upload, User, MapPin, CreditCard, FileCheck, Shield, Plus, Trash2 } from "lucide-react";

interface BackgroundDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: {
    personal: boolean;
    address: boolean;
    financial: boolean;
    credit: boolean;
  };
  onStepComplete: (step: string) => void;
}

export function BackgroundDetailsModal({ open, onOpenChange, steps, onStepComplete }: BackgroundDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState({
    // Personal
    title: '',
    firstName: '',
    lastName: '',
    dob: '',
    maritalStatus: '',
    dependents: '0',
    dependentAges: '',
    niNumber: '',
    nationality: '',
    residence: '',
    visaType: '',
    visaExpiry: '',
    
    // Address
    currentAddress: {
      propertyNumber: '',
      street: '',
      city: '',
      postcode: '',
      dateMovedIn: ''
    },
    previousAddresses: [] as Array<{
      propertyNumber: string;
      street: string;
      city: string;
      postcode: string;
      dateFrom: string;
      dateTo: string;
    }>,
    
    // Financial - Assets
    bankAccounts: '0',
    propertyValue: '0',
    investments: '0',
    pensionValue: '0',
    otherAssets: '0',
    
    // Financial - Liabilities
    mortgages: [] as Array<{
      type: 'first' | 'second';
      balance: string;
      lender: string;
      interestRate: string;
      rateType: string;
      endOfDeal: string;
      endOfMortgage: string;
      monthlyPayment: string;
    }>,
    personalLoans: [] as Array<{
      balance: string;
      lender: string;
      interestRate: string;
      rateType: string;
      endDate: string;
      monthlyPayment: string;
    }>,
    creditCards: [] as Array<{
      limit: string;
      balance: string;
      monthlyPayment: string;
    }>,
    otherDebts: [] as Array<{
      type: string;
      balance: string;
      lender: string;
      monthlyPayment: string;
    }>,
    carLeases: [] as Array<{
      monthlyPayment: string;
      endDate: string;
      provider: string;
    }>,
    
    // Financial - Income
    incomeStreams: [] as Array<{
      type: 'employed' | 'self-employed' | 'benefits' | 'pension' | 'rental' | 'other';
      monthlyNet?: string;
      averageOvertime?: string;
      bonus?: string;
      extras?: string;
      annualGross?: string;
      employerName?: string;
      employerAddress?: string;
      startDate?: string;
      contractType?: string;
      annualIncome?: string;
      businessName?: string;
      businessType?: string;
      tradingStartDate?: string;
      businessAddress?: string;
      businessUrl?: string;
      benefitType?: string;
      reviewDate?: string;
      rentProperty?: string;
      details?: string;
      endDate?: string;
    }>,
    
    // Financial - Expenditure
    expenditure: {
      mortgage: '0',
      rent: '0',
      creditCards: '0',
      utilities: '0',
      communications: '0',
      travel: '0',
      holidays: '0',
      insurance: '0',
      pension: '0',
      maintenance: '0',
      tax: '0',
      otherDetails: '',
      otherAmount: '0'
    },
    
    // Credit
    creditIssues: {
      defaults: false,
      ccjs: false,
      bankruptcy: false,
      iva: false,
      missedPayments: false
    },
    creditDetails: [] as Array<{
      type: string;
      date: string;
      amount: string;
      cleared: boolean;
      details: string;
    }>
  });
  
  const { toast } = useToast();

  const handleStepComplete = (step: string) => {
    onStepComplete(step);
    toast({
      title: "Section Completed",
      description: "Your information has been saved successfully.",
    });
  };

  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newData;
    });
  };

  const addItem = (arrayPath: string, item: any) => {
    setFormData(prev => {
      const keys = arrayPath.split('.');
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = [...current[keys[keys.length - 1]], item];
      
      return newData;
    });
  };

  const removeItem = (arrayPath: string, index: number) => {
    setFormData(prev => {
      const keys = arrayPath.split('.');
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = current[keys[keys.length - 1]].filter((_: any, i: number) => i !== index);
      
      return newData;
    });
  };

  const showVisaFields = formData.nationality !== 'GB' && formData.residence === 'GB';
  const showDependentAges = parseInt(formData.dependents) > 0;
  const showPreviousAddress = formData.currentAddress.dateMovedIn && 
    new Date(formData.currentAddress.dateMovedIn) > new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000);
  const hasCreditIssues = Object.values(formData.creditIssues).some(Boolean);

  const stepConfig = [
    { key: 'personal', label: 'Personal', icon: User },
    { key: 'address', label: 'Address', icon: MapPin },
    { key: 'financial', label: 'Financial', icon: CreditCard },
    { key: 'credit', label: 'Credit', icon: FileCheck },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-navy">Complete Your Profile</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 bg-secondary">
            {stepConfig.map((step) => {
              const IconComponent = step.icon;
              const isComplete = steps[step.key as keyof typeof steps];
              
              return (
                <TabsTrigger 
                  key={step.key}
                  value={step.key}
                  className="flex items-center space-x-2 data-[state=active]:bg-white"
                >
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <IconComponent className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Select value={formData.title} onValueChange={(value) => updateFormData('title', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mr">Mr</SelectItem>
                        <SelectItem value="mrs">Mrs</SelectItem>
                        <SelectItem value="ms">Ms</SelectItem>
                        <SelectItem value="miss">Miss</SelectItem>
                        <SelectItem value="dr">Dr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      placeholder="Enter first name" 
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input 
                      type="date" 
                      value={formData.dob}
                      onChange={(e) => updateFormData('dob', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select value={formData.maritalStatus} onValueChange={(value) => updateFormData('maritalStatus', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dependents">Number of Dependents</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      min="0" 
                      value={formData.dependents}
                      onChange={(e) => updateFormData('dependents', e.target.value)}
                    />
                  </div>
                  
                  {showDependentAges && (
                    <div className="space-y-2">
                      <Label htmlFor="dependentAges">Ages of Dependents</Label>
                      <Input 
                        placeholder="e.g., 5, 8, 12"
                        value={formData.dependentAges}
                        onChange={(e) => updateFormData('dependentAges', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="niNumber">National Insurance Number</Label>
                    <Input 
                      placeholder="AB 12 34 56 C"
                      value={formData.niNumber}
                      onChange={(e) => updateFormData('niNumber', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Select value={formData.nationality} onValueChange={(value) => updateFormData('nationality', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="IE">Ireland</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="residentCountry">Country of Residence</Label>
                    <Select value={formData.residence} onValueChange={(value) => updateFormData('residence', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="IE">Ireland</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {showVisaFields && (
                    <div className="space-y-2">
                      <Label htmlFor="visaType">Visa Type</Label>
                      <Select value={formData.visaType} onValueChange={(value) => updateFormData('visaType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visa type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tier1">Tier 1</SelectItem>
                          <SelectItem value="tier2">Tier 2</SelectItem>
                          <SelectItem value="student">Student Visa</SelectItem>
                          <SelectItem value="spouse">Spouse Visa</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {showVisaFields && (
                  <div className="space-y-2">
                    <Label htmlFor="visaExpiry">Visa Expiry Date</Label>
                    <Input 
                      type="date"
                      value={formData.visaExpiry}
                      onChange={(e) => updateFormData('visaExpiry', e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-medium">Identity Verification</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 border-dashed">
                      <div className="text-center">
                        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-sm">Upload ID Document</span>
                      </div>
                    </Button>
                    <Button variant="outline" className="h-20 border-dashed">
                      <div className="text-center">
                        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-sm">Upload Selfie</span>
                      </div>
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={() => handleStepComplete('personal')}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  Save Personal Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Address Tab */}
          <TabsContent value="address" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Address History</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Current Address</h4>
                  <div className="space-y-3">
                    <Input 
                      placeholder="Property number/name"
                      value={formData.currentAddress.propertyNumber}
                      onChange={(e) => updateFormData('currentAddress.propertyNumber', e.target.value)}
                    />
                    <Input 
                      placeholder="Street"
                      value={formData.currentAddress.street}
                      onChange={(e) => updateFormData('currentAddress.street', e.target.value)}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input 
                        placeholder="City"
                        value={formData.currentAddress.city}
                        onChange={(e) => updateFormData('currentAddress.city', e.target.value)}
                      />
                      <Input 
                        placeholder="Postcode"
                        value={formData.currentAddress.postcode}
                        onChange={(e) => updateFormData('currentAddress.postcode', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date moved in</Label>
                      <Input 
                        type="date"
                        value={formData.currentAddress.dateMovedIn}
                        onChange={(e) => updateFormData('currentAddress.dateMovedIn', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {showPreviousAddress && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Previous Addresses (Required - less than 3 years at current address)</h4>
                    
                    <div className="space-y-4">
                      <Button 
                        variant="outline" 
                        className="w-full border-dashed"
                        onClick={() => addItem('previousAddresses', {
                          propertyNumber: '',
                          street: '',
                          city: '',
                          postcode: '',
                          dateFrom: '',
                          dateTo: ''
                        })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Previous Address
                      </Button>
                      
                      {formData.previousAddresses.map((address, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="font-medium">Previous Address {index + 1}</h5>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeItem('previousAddresses', index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-3">
                            <Input 
                              placeholder="Property number/name"
                              value={address.propertyNumber}
                              onChange={(e) => updateFormData(`previousAddresses.${index}.propertyNumber`, e.target.value)}
                            />
                            <Input 
                              placeholder="Street"
                              value={address.street}
                              onChange={(e) => updateFormData(`previousAddresses.${index}.street`, e.target.value)}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input 
                                placeholder="City"
                                value={address.city}
                                onChange={(e) => updateFormData(`previousAddresses.${index}.city`, e.target.value)}
                              />
                              <Input 
                                placeholder="Postcode"
                                value={address.postcode}
                                onChange={(e) => updateFormData(`previousAddresses.${index}.postcode`, e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Date from</Label>
                                <Input 
                                  type="date"
                                  value={address.dateFrom}
                                  onChange={(e) => updateFormData(`previousAddresses.${index}.dateFrom`, e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Date to</Label>
                                <Input 
                                  type="date"
                                  value={address.dateTo}
                                  onChange={(e) => updateFormData(`previousAddresses.${index}.dateTo`, e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-medium">Proof of Address</h4>
                  <Button variant="outline" className="w-full h-20 border-dashed">
                    <div className="text-center">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-sm">Upload Proof of Address</span>
                      <div className="text-xs text-muted-foreground">
                        Council tax, utility bill, bank statement (last 3 months)
                      </div>
                    </div>
                  </Button>
                </div>

                <Button 
                  onClick={() => handleStepComplete('address')}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  Save Address Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Financial Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="assets" className="space-y-4">
                  <TabsList className="grid grid-cols-4 bg-secondary">
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                    <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
                    <TabsTrigger value="income">Income</TabsTrigger>
                    <TabsTrigger value="expenditure">Expenditure</TabsTrigger>
                  </TabsList>

                  <TabsContent value="assets" className="space-y-4">
                    <h4 className="font-medium">Assets</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Bank Accounts (Total Savings)</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={formData.bankAccounts}
                            onChange={(e) => updateFormData('bankAccounts', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Property Value (if owned)</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={formData.propertyValue}
                            onChange={(e) => updateFormData('propertyValue', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Investment Portfolio</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={formData.investments}
                            onChange={(e) => updateFormData('investments', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Pension Value</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={formData.pensionValue}
                            onChange={(e) => updateFormData('pensionValue', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Other Assets</Label>
                        <Input 
                          type="number" 
                          placeholder="0"
                          value={formData.otherAssets}
                          onChange={(e) => updateFormData('otherAssets', e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="liabilities" className="space-y-4">
                    <h4 className="font-medium">Liabilities</h4>
                    
                    {/* Mortgages */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium">Mortgages</h5>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addItem('mortgages', {
                            type: 'first',
                            balance: '',
                            lender: '',
                            interestRate: '',
                            rateType: '',
                            endOfDeal: '',
                            endOfMortgage: '',
                            monthlyPayment: ''
                          })}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Mortgage
                        </Button>
                      </div>
                      
                      {formData.mortgages.map((mortgage, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h6 className="font-medium">{mortgage.type === 'first' ? '1st' : '2nd'} Mortgage</h6>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeItem('mortgages', index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label>Mortgage Type</Label>
                              <Select 
                                value={mortgage.type} 
                                onValueChange={(value) => updateFormData(`mortgages.${index}.type`, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="first">1st Mortgage</SelectItem>
                                  <SelectItem value="second">2nd Mortgage</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Outstanding Balance</Label>
                                <Input 
                                  type="number"
                                  placeholder="0"
                                  value={mortgage.balance}
                                  onChange={(e) => updateFormData(`mortgages.${index}.balance`, e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Lender</Label>
                                <Input 
                                  placeholder="Lender name"
                                  value={mortgage.lender}
                                  onChange={(e) => updateFormData(`mortgages.${index}.lender`, e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Interest Rate (%)</Label>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={mortgage.interestRate}
                                  onChange={(e) => updateFormData(`mortgages.${index}.interestRate`, e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Rate Type</Label>
                                <Select 
                                  value={mortgage.rateType} 
                                  onValueChange={(value) => updateFormData(`mortgages.${index}.rateType`, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fixed">Fixed</SelectItem>
                                    <SelectItem value="variable">Variable</SelectItem>
                                    <SelectItem value="tracker">Tracker</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <Label>End of Deal</Label>
                                <Input 
                                  type="date"
                                  value={mortgage.endOfDeal}
                                  onChange={(e) => updateFormData(`mortgages.${index}.endOfDeal`, e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>End of Mortgage</Label>
                                <Input 
                                  type="date"
                                  value={mortgage.endOfMortgage}
                                  onChange={(e) => updateFormData(`mortgages.${index}.endOfMortgage`, e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Monthly Payment</Label>
                                <Input 
                                  type="number"
                                  placeholder="0"
                                  value={mortgage.monthlyPayment}
                                  onChange={(e) => updateFormData(`mortgages.${index}.monthlyPayment`, e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Personal Loans */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium">Personal Loans</h5>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addItem('personalLoans', {
                            balance: '',
                            lender: '',
                            interestRate: '',
                            rateType: '',
                            endDate: '',
                            monthlyPayment: ''
                          })}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Personal Loan
                        </Button>
                      </div>
                      
                      {formData.personalLoans.map((loan, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h6 className="font-medium">Personal Loan {index + 1}</h6>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeItem('personalLoans', index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Outstanding Balance</Label>
                                <Input 
                                  type="number"
                                  placeholder="0"
                                  value={loan.balance}
                                  onChange={(e) => updateFormData(`personalLoans.${index}.balance`, e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Lender</Label>
                                <Input 
                                  placeholder="Lender name"
                                  value={loan.lender}
                                  onChange={(e) => updateFormData(`personalLoans.${index}.lender`, e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <Label>Interest Rate (%)</Label>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={loan.interestRate}
                                  onChange={(e) => updateFormData(`personalLoans.${index}.interestRate`, e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Rate Type</Label>
                                <Select 
                                  value={loan.rateType} 
                                  onValueChange={(value) => updateFormData(`personalLoans.${index}.rateType`, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fixed">Fixed</SelectItem>
                                    <SelectItem value="variable">Variable</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Monthly Payment</Label>
                                <Input 
                                  type="number"
                                  placeholder="0"
                                  value={loan.monthlyPayment}
                                  onChange={(e) => updateFormData(`personalLoans.${index}.monthlyPayment`, e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>End Date</Label>
                              <Input 
                                type="date"
                                value={loan.endDate}
                                onChange={(e) => updateFormData(`personalLoans.${index}.endDate`, e.target.value)}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Credit Cards */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium">Credit Cards</h5>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addItem('creditCards', {
                            limit: '',
                            balance: '',
                            monthlyPayment: ''
                          })}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Credit Card
                        </Button>
                      </div>
                      
                      {formData.creditCards.map((card, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h6 className="font-medium">Credit Card {index + 1}</h6>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeItem('creditCards', index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label>Credit Limit</Label>
                              <Input 
                                type="number"
                                placeholder="0"
                                value={card.limit}
                                onChange={(e) => updateFormData(`creditCards.${index}.limit`, e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Carry Over Balance</Label>
                              <Input 
                                type="number"
                                placeholder="0"
                                value={card.balance}
                                onChange={(e) => updateFormData(`creditCards.${index}.balance`, e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Minimum Monthly Payment</Label>
                              <Input 
                                type="number"
                                placeholder="0"
                                value={card.monthlyPayment}
                                onChange={(e) => updateFormData(`creditCards.${index}.monthlyPayment`, e.target.value)}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Car Leases */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium">Car/Other Leases</h5>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addItem('carLeases', {
                            monthlyPayment: '',
                            endDate: '',
                            provider: ''
                          })}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Lease
                        </Button>
                      </div>
                      
                      {formData.carLeases.map((lease, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h6 className="font-medium">Lease {index + 1}</h6>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeItem('carLeases', index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label>Monthly Payment</Label>
                              <Input 
                                type="number"
                                placeholder="0"
                                value={lease.monthlyPayment}
                                onChange={(e) => updateFormData(`carLeases.${index}.monthlyPayment`, e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>End Date</Label>
                              <Input 
                                type="date"
                                value={lease.endDate}
                                onChange={(e) => updateFormData(`carLeases.${index}.endDate`, e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Provider</Label>
                              <Input 
                                placeholder="Lease provider"
                                value={lease.provider}
                                onChange={(e) => updateFormData(`carLeases.${index}.provider`, e.target.value)}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Other Debts */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium">Other Debts</h5>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addItem('otherDebts', {
                            type: '',
                            balance: '',
                            lender: '',
                            monthlyPayment: ''
                          })}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Other Debt
                        </Button>
                      </div>
                      
                      {formData.otherDebts.map((debt, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h6 className="font-medium">Other Debt {index + 1}</h6>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeItem('otherDebts', index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Debt Type</Label>
                                <Input 
                                  placeholder="e.g., Store card, payday loan"
                                  value={debt.type}
                                  onChange={(e) => updateFormData(`otherDebts.${index}.type`, e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Outstanding Balance</Label>
                                <Input 
                                  type="number"
                                  placeholder="0"
                                  value={debt.balance}
                                  onChange={(e) => updateFormData(`otherDebts.${index}.balance`, e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Lender</Label>
                                <Input 
                                  placeholder="Lender name"
                                  value={debt.lender}
                                  onChange={(e) => updateFormData(`otherDebts.${index}.lender`, e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Monthly Payment</Label>
                                <Input 
                                  type="number"
                                  placeholder="0"
                                  value={debt.monthlyPayment}
                                  onChange={(e) => updateFormData(`otherDebts.${index}.monthlyPayment`, e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="income" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Income Sources</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addItem('incomeStreams', {
                          type: 'employed',
                          monthlyNet: '',
                          averageOvertime: '',
                          bonus: '',
                          extras: '',
                          annualGross: '',
                          employerName: '',
                          employerAddress: '',
                          startDate: '',
                          contractType: '',
                          annualIncome: '',
                          businessName: '',
                          businessType: '',
                          tradingStartDate: '',
                          businessAddress: '',
                          businessUrl: '',
                          benefitType: '',
                          reviewDate: '',
                          rentProperty: '',
                          details: '',
                          endDate: ''
                        })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Other Income
                      </Button>
                    </div>
                    
                    {formData.incomeStreams.map((income, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-medium">Income Source {index + 1}</h5>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeItem('incomeStreams', index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Income Type</Label>
                            <Select 
                              value={income.type} 
                              onValueChange={(value) => updateFormData(`incomeStreams.${index}.type`, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="employed">Employed</SelectItem>
                                <SelectItem value="self-employed">Self Employed</SelectItem>
                                <SelectItem value="benefits">Benefits</SelectItem>
                                <SelectItem value="pension">Pension</SelectItem>
                                <SelectItem value="rental">Rental Income</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {income.type === 'employed' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Monthly Net Income</Label>
                                  <Input 
                                    type="number"
                                    placeholder="0"
                                    value={income.monthlyNet}
                                    onChange={(e) => updateFormData(`incomeStreams.${index}.monthlyNet`, e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Average Overtime (Monthly)</Label>
                                  <Input 
                                    type="number"
                                    placeholder="0"
                                    value={income.averageOvertime}
                                    onChange={(e) => updateFormData(`incomeStreams.${index}.averageOvertime`, e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Annual Bonus</Label>
                                  <Input 
                                    type="number"
                                    placeholder="0"
                                    value={income.bonus}
                                    onChange={(e) => updateFormData(`incomeStreams.${index}.bonus`, e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Other Extras (Annual)</Label>
                                  <Input 
                                    type="number"
                                    placeholder="0"
                                    value={income.extras}
                                    onChange={(e) => updateFormData(`incomeStreams.${index}.extras`, e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Annual Gross (from P60)</Label>
                                <Input 
                                  type="number"
                                  placeholder="0"
                                  value={income.annualGross}
                                  onChange={(e) => updateFormData(`incomeStreams.${index}.annualGross`, e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Employer Name</Label>
                                <Input 
                                  placeholder="Company name"
                                  value={income.employerName}
                                  onChange={(e) => updateFormData(`incomeStreams.${index}.employerName`, e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Employer Address</Label>
                                <Textarea 
                                  placeholder="Full company address"
                                  value={income.employerAddress}
                                  onChange={(e) => updateFormData(`incomeStreams.${index}.employerAddress`, e.target.value)}
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Employment Start Date</Label>
                                  <Input 
                                    type="date"
                                    value={income.startDate}
                                    onChange={(e) => updateFormData(`incomeStreams.${index}.startDate`, e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Contract Type</Label>
                                  <Select 
                                    value={income.contractType} 
                                    onValueChange={(value) => updateFormData(`incomeStreams.${index}.contractType`, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="permanent">Permanent</SelectItem>
                                      <SelectItem value="temporary">Temporary</SelectItem>
                                      <SelectItem value="fixed-term">Fixed Term Contract</SelectItem>
                                      <SelectItem value="contractor">Contractor</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          )}

                          {income.type === 'self-employed' && (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label>Annual Income (Last 3 Years from SA302)</Label>
                                <Input 
                                  placeholder="e.g., Year 1: £50,000, Year 2: £55,000, Year 3: £60,000"
                                  value={income.annualIncome}
                                  onChange={(e) => updateFormData(`incomeStreams.${index}.annualIncome`, e.target.value)}
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Business Name</Label>
                                  <Input 
                                    placeholder="Business name"
                                    value={income.businessName}
                                    onChange={(e) => updateFormData(`incomeStreams.${index}.businessName`, e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Business Type</Label>
                                  <Input 
                                    placeholder="e.g., Sole trader, Partnership, Ltd"
                                    value={income.businessType}
                                    onChange={(e) => updateFormData(`incomeStreams.${index}.businessType`, e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Trading Start Date</Label>
                                <Input 
                                  type="date"
                                  value={income.tradingStartDate}
                                  onChange={(e) => updateFormData(`incomeStreams.${index}.tradingStartDate`, e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Business Address</Label>
                                <Textarea 
                                  placeholder="Business address"
                                  value={income.businessAddress}
                                  onChange={(e) => updateFormData(`incomeStreams.${index}.businessAddress`, e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Business Website (optional)</Label>
                                <Input 
                                  type="url"
                                  placeholder="https://www.example.com"
                                  value={income.businessUrl}
                                  onChange={(e) => updateFormData(`incomeStreams.${index}.businessUrl`, e.target.value)}
                                />
                              </div>
                            </div>
                          )}

                          {income.type === 'benefits' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Benefit Type</Label>
                                  <Input 
                                    placeholder="e.g., Universal Credit, JSA, PIP"
                                    value={income.benefitType}
                                    onChange={(e) => updateFormData(`incomeStreams.${index}.benefitType`, e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Monthly Net Amount</Label>
                                  <Input 
                                    type="number"
                                    placeholder="0"
                                    value={income.monthlyNet}
                                    onChange={(e) => updateFormData(`incomeStreams.${index}.monthlyNet`, e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Review Date</Label>
                                <Input 
                                  type="date"
                                  value={income.reviewDate}
                                  onChange={(e) => updateFormData(`incomeStreams.${index}.reviewDate`, e.target.value)}
                                />
                              </div>
                            </div>
                          )}

                          {income.type === 'pension' && (
                            <div className="space-y-2">
                              <Label>Monthly Net Pension</Label>
                              <Input 
                                type="number"
                                placeholder="0"
                                value={income.monthlyNet}
                                onChange={(e) => updateFormData(`incomeStreams.${index}.monthlyNet`, e.target.value)}
                              />
                            </div>
                          )}

                          {income.type === 'rental' && (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label>Monthly Gross Rent</Label>
                                <Input 
                                  type="number"
                                  placeholder="0"
                                  value={income.monthlyNet}
                                  onChange={(e) => updateFormData(`incomeStreams.${index}.monthlyNet`, e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Property Address</Label>
                                <Input 
                                  placeholder="Rental property address"
                                  value={income.rentProperty}
                                  onChange={(e) => updateFormData(`incomeStreams.${index}.rentProperty`, e.target.value)}
                                />
                              </div>
                            </div>
                          )}

                          {income.type === 'other' && (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label>Details</Label>
                                <Textarea 
                                  placeholder="Describe the income source"
                                  value={income.details}
                                  onChange={(e) => updateFormData(`incomeStreams.${index}.details`, e.target.value)}
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Monthly Amount</Label>
                                  <Input 
                                    type="number"
                                    placeholder="0"
                                    value={income.monthlyNet}
                                    onChange={(e) => updateFormData(`incomeStreams.${index}.monthlyNet`, e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>End Date (if applicable)</Label>
                                  <Input 
                                    type="date"
                                    value={income.endDate}
                                    onChange={(e) => updateFormData(`incomeStreams.${index}.endDate`, e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}

                    {formData.incomeStreams.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <p>No income sources added yet.</p>
                        <p className="text-sm">Click "Add Other Income" to get started.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="expenditure" className="space-y-4">
                    <h4 className="font-medium">Monthly Expenditure</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Mortgage/Rent Payment</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={formData.expenditure.mortgage}
                            onChange={(e) => updateFormData('expenditure.mortgage', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Credit Cards (Total)</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={formData.expenditure.creditCards}
                            onChange={(e) => updateFormData('expenditure.creditCards', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Utilities</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={formData.expenditure.utilities}
                            onChange={(e) => updateFormData('expenditure.utilities', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Communications (Phone, Internet)</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={formData.expenditure.communications}
                            onChange={(e) => updateFormData('expenditure.communications', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Travel</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={formData.expenditure.travel}
                            onChange={(e) => updateFormData('expenditure.travel', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Holidays</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={formData.expenditure.holidays}
                            onChange={(e) => updateFormData('expenditure.holidays', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Insurance</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={formData.expenditure.insurance}
                            onChange={(e) => updateFormData('expenditure.insurance', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Pension Contributions</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={formData.expenditure.pension}
                            onChange={(e) => updateFormData('expenditure.pension', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Maintenance</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={formData.expenditure.maintenance}
                            onChange={(e) => updateFormData('expenditure.maintenance', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tax (Self-employed)</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={formData.expenditure.tax}
                            onChange={(e) => updateFormData('expenditure.tax', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Other Expenditure Details</Label>
                        <Textarea 
                          placeholder="Describe any other regular expenses"
                          value={formData.expenditure.otherDetails}
                          onChange={(e) => updateFormData('expenditure.otherDetails', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Other Expenditure Amount</Label>
                        <Input 
                          type="number" 
                          placeholder="0"
                          value={formData.expenditure.otherAmount}
                          onChange={(e) => updateFormData('expenditure.otherAmount', e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button 
                  onClick={() => handleStepComplete('financial')}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  Save Financial Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credit Tab */}
          <TabsContent value="credit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileCheck className="w-5 h-5" />
                  <span>Credit Assessment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Credit History</h4>
                  <div className="text-sm text-muted-foreground mb-4">
                    Please indicate if you have any of the following credit issues:
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={formData.creditIssues.defaults}
                        onCheckedChange={(checked) => updateFormData('creditIssues.defaults', checked)}
                      />
                      <Label>Defaults</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={formData.creditIssues.ccjs}
                        onCheckedChange={(checked) => updateFormData('creditIssues.ccjs', checked)}
                      />
                      <Label>CCJs (County Court Judgments)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={formData.creditIssues.bankruptcy}
                        onCheckedChange={(checked) => updateFormData('creditIssues.bankruptcy', checked)}
                      />
                      <Label>Bankruptcy</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={formData.creditIssues.iva}
                        onCheckedChange={(checked) => updateFormData('creditIssues.iva', checked)}
                      />
                      <Label>IVA (Individual Voluntary Arrangement)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={formData.creditIssues.missedPayments}
                        onCheckedChange={(checked) => updateFormData('creditIssues.missedPayments', checked)}
                      />
                      <Label>Missed Payments (Last 6 months)</Label>
                    </div>
                  </div>
                </div>

                {hasCreditIssues && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Credit Issue Details</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addItem('creditDetails', {
                          type: '',
                          date: '',
                          amount: '',
                          cleared: false,
                          details: ''
                        })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Credit Issue
                      </Button>
                    </div>
                    
                    {formData.creditDetails.map((detail, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-medium">Credit Issue {index + 1}</h5>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeItem('creditDetails', index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Issue Type</Label>
                              <Select 
                                value={detail.type} 
                                onValueChange={(value) => updateFormData(`creditDetails.${index}.type`, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default">Default</SelectItem>
                                  <SelectItem value="ccj">CCJ</SelectItem>
                                  <SelectItem value="bankruptcy">Bankruptcy</SelectItem>
                                  <SelectItem value="iva">IVA</SelectItem>
                                  <SelectItem value="missed-payment">Missed Payment</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Date</Label>
                              <Input 
                                type="date"
                                value={detail.date}
                                onChange={(e) => updateFormData(`creditDetails.${index}.date`, e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Amount</Label>
                              <Input 
                                type="number"
                                placeholder="0"
                                value={detail.amount}
                                onChange={(e) => updateFormData(`creditDetails.${index}.amount`, e.target.value)}
                              />
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                              <Checkbox 
                                checked={detail.cleared}
                                onCheckedChange={(checked) => updateFormData(`creditDetails.${index}.cleared`, checked)}
                              />
                              <Label>Cleared/Satisfied</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Additional Details</Label>
                            <Textarea 
                              placeholder="Any additional information about this issue"
                              value={detail.details}
                              onChange={(e) => updateFormData(`creditDetails.${index}.details`, e.target.value)}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={() => handleStepComplete('credit')}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  Save Credit Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
