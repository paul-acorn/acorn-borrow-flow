import { useState, useEffect } from "react";
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
import { CheckCircle, Upload, User, MapPin, CreditCard, FileCheck, Shield, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BackgroundDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: {
    personal: boolean;
    address: boolean;
    financial: boolean;
    credit: boolean;
    documents: boolean;
  };
  onStepComplete: (step: string) => void;
  initialStep?: string;
}

interface UploadedDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  verified: boolean;
}

export function BackgroundDetailsModal({ open, onOpenChange, steps, onStepComplete, initialStep }: BackgroundDetailsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    identity: UploadedDocument[];
    proof_of_address: UploadedDocument[];
    bank_statement: UploadedDocument[];
  }>({
    identity: [],
    proof_of_address: [],
    bank_statement: []
  });
  const [uploading, setUploading] = useState(false);

  // Load existing data when modal opens
  useEffect(() => {
    if (open && user?.id) {
      loadExistingData();
      loadDocuments();
    }
  }, [open, user?.id]);

  // Navigate to initial step when modal opens
  useEffect(() => {
    if (open && initialStep) {
      setActiveTab(initialStep);
    }
  }, [open, initialStep]);

  const loadExistingData = async () => {
    setIsLoading(true);
    try {
      // Load personal details
      const { data: personal } = await supabase
        .from('client_personal_details')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (personal) {
        setFormData(prev => ({
          ...prev,
          title: personal.title || '',
          dob: personal.dob || '',
          maritalStatus: personal.marital_status || '',
          dependents: String(personal.dependents || 0),
          dependentAges: personal.dependent_ages || '',
          niNumber: personal.ni_number || '',
          nationality: personal.nationality || '',
          residence: personal.residence || '',
          visaType: personal.visa_type || '',
          visaExpiry: personal.visa_expiry || '',
        }));
      }

      // Load addresses
      const { data: addresses } = await supabase
        .from('client_addresses')
        .select('*')
        .eq('user_id', user!.id)
        .order('date_moved_in', { ascending: false });

      if (addresses && addresses.length > 0) {
        const current = addresses.find(a => a.is_current);
        const previous = addresses.filter(a => !a.is_current);

        setFormData(prev => ({
          ...prev,
          currentAddress: current ? {
            propertyNumber: current.property_number || '',
            street: current.street || '',
            city: current.city || '',
            postcode: current.postcode || '',
            dateMovedIn: current.date_moved_in || '',
          } : prev.currentAddress,
          previousAddresses: previous.map(addr => ({
            propertyNumber: addr.property_number || '',
            street: addr.street || '',
            city: addr.city || '',
            postcode: addr.postcode || '',
            dateFrom: addr.date_moved_in || '',
            dateTo: addr.date_moved_out || '',
          })),
        }));
      }

      // Load financial assets
      const { data: assets } = await supabase
        .from('client_financial_assets')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (assets) {
        setFormData(prev => ({
          ...prev,
          bankAccounts: String(assets.bank_accounts || 0),
          propertyValue: String(assets.property_value || 0),
          investments: String(assets.investments || 0),
          pensionValue: String(assets.pension_value || 0),
          otherAssets: String(assets.other_assets || 0),
        }));
      }

      // Load credit history
      const { data: credit } = await supabase
        .from('client_credit_history')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (credit) {
        setFormData(prev => ({
          ...prev,
          creditIssues: {
            defaults: credit.has_defaults || false,
            ccjs: credit.has_ccjs || false,
            bankruptcy: credit.has_bankruptcy || false,
            iva: credit.has_iva || false,
            missedPayments: credit.has_mortgage_arrears || false,
          },
        }));
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    } finally {
      setIsLoading(false);
    }
  };
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

  const handleStepComplete = async (step: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to save your information.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      switch (step) {
        case 'personal':
          await savePersonalDetails();
          break;
        case 'address':
          await saveAddressDetails();
          break;
        case 'financial':
          await saveFinancialDetails();
          break;
        case 'credit':
          await saveCreditHistory();
          break;
      }

      onStepComplete(step);
      toast({
        title: "Section Completed",
        description: "Your information has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Error",
        description: "Failed to save your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const savePersonalDetails = async () => {
    const { error } = await supabase
      .from('client_personal_details')
      .upsert({
        user_id: user!.id,
        title: formData.title || null,
        dob: formData.dob || null,
        marital_status: formData.maritalStatus || null,
        dependents: parseInt(formData.dependents) || 0,
        dependent_ages: formData.dependentAges || null,
        ni_number: formData.niNumber || null,
        nationality: formData.nationality || null,
        residence: formData.residence || null,
        visa_type: formData.visaType || null,
        visa_expiry: formData.visaExpiry || null,
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  };

  const saveAddressDetails = async () => {
    // Delete existing addresses for this user
    await supabase
      .from('client_addresses')
      .delete()
      .eq('user_id', user!.id);

    // Insert current address
    if (formData.currentAddress.street) {
      const { error: currentError } = await supabase
        .from('client_addresses')
        .insert({
          user_id: user!.id,
          is_current: true,
          property_number: formData.currentAddress.propertyNumber || null,
          street: formData.currentAddress.street,
          city: formData.currentAddress.city || null,
          postcode: formData.currentAddress.postcode || null,
          date_moved_in: formData.currentAddress.dateMovedIn || null,
        });

      if (currentError) throw currentError;
    }

    // Insert previous addresses
    if (formData.previousAddresses.length > 0) {
      const previousAddressData = formData.previousAddresses
        .filter(addr => addr.street)
        .map(addr => ({
          user_id: user!.id,
          is_current: false,
          property_number: addr.propertyNumber || null,
          street: addr.street,
          city: addr.city || null,
          postcode: addr.postcode || null,
          date_moved_in: addr.dateFrom || null,
          date_moved_out: addr.dateTo || null,
        }));

      if (previousAddressData.length > 0) {
        const { error: prevError } = await supabase
          .from('client_addresses')
          .insert(previousAddressData);

        if (prevError) throw prevError;
      }
    }
  };

  const saveFinancialDetails = async () => {
    // Save financial assets
    const { error: assetsError } = await supabase
      .from('client_financial_assets')
      .upsert({
        user_id: user!.id,
        bank_accounts: parseFloat(formData.bankAccounts) || 0,
        property_value: parseFloat(formData.propertyValue) || 0,
        investments: parseFloat(formData.investments) || 0,
        pension_value: parseFloat(formData.pensionValue) || 0,
        other_assets: parseFloat(formData.otherAssets) || 0,
      }, {
        onConflict: 'user_id'
      });

    if (assetsError) throw assetsError;

    // Delete existing liabilities for this user
    await Promise.all([
      supabase.from('client_mortgages').delete().eq('user_id', user!.id),
      supabase.from('client_personal_loans').delete().eq('user_id', user!.id),
      supabase.from('client_credit_cards').delete().eq('user_id', user!.id),
      supabase.from('client_other_debts').delete().eq('user_id', user!.id),
      supabase.from('client_car_leases').delete().eq('user_id', user!.id),
      supabase.from('client_income_streams').delete().eq('user_id', user!.id),
    ]);

    // Insert mortgages
    if (formData.mortgages.length > 0) {
      const mortgageData = formData.mortgages
        .filter(m => m.lender)
        .map(m => ({
          user_id: user!.id,
          type: m.type,
          balance: parseFloat(m.balance) || null,
          lender: m.lender,
          interest_rate: parseFloat(m.interestRate) || null,
          rate_type: m.rateType || null,
          end_of_deal: m.endOfDeal || null,
          end_of_mortgage: m.endOfMortgage || null,
          monthly_payment: parseFloat(m.monthlyPayment) || null,
        }));

      if (mortgageData.length > 0) {
        const { error } = await supabase.from('client_mortgages').insert(mortgageData);
        if (error) throw error;
      }
    }

    // Insert personal loans
    if (formData.personalLoans.length > 0) {
      const loanData = formData.personalLoans
        .filter(l => l.lender)
        .map(l => ({
          user_id: user!.id,
          balance: parseFloat(l.balance) || null,
          lender: l.lender,
          interest_rate: parseFloat(l.interestRate) || null,
          rate_type: l.rateType || null,
          end_date: l.endDate || null,
          monthly_payment: parseFloat(l.monthlyPayment) || null,
        }));

      if (loanData.length > 0) {
        const { error } = await supabase.from('client_personal_loans').insert(loanData);
        if (error) throw error;
      }
    }

    // Insert credit cards
    if (formData.creditCards.length > 0) {
      const cardData = formData.creditCards
        .filter(c => parseFloat(c.limit) > 0)
        .map(c => ({
          user_id: user!.id,
          credit_limit: parseFloat(c.limit) || null,
          balance: parseFloat(c.balance) || null,
          monthly_payment: parseFloat(c.monthlyPayment) || null,
        }));

      if (cardData.length > 0) {
        const { error } = await supabase.from('client_credit_cards').insert(cardData);
        if (error) throw error;
      }
    }

    // Insert other debts
    if (formData.otherDebts.length > 0) {
      const debtData = formData.otherDebts
        .filter(d => d.type)
        .map(d => ({
          user_id: user!.id,
          debt_type: d.type,
          balance: parseFloat(d.balance) || null,
          lender: d.lender || null,
          monthly_payment: parseFloat(d.monthlyPayment) || null,
        }));

      if (debtData.length > 0) {
        const { error } = await supabase.from('client_other_debts').insert(debtData);
        if (error) throw error;
      }
    }

    // Insert car leases
    if (formData.carLeases.length > 0) {
      const leaseData = formData.carLeases
        .filter(l => l.provider)
        .map(l => ({
          user_id: user!.id,
          monthly_payment: parseFloat(l.monthlyPayment) || null,
          end_date: l.endDate || null,
          provider: l.provider,
        }));

      if (leaseData.length > 0) {
        const { error } = await supabase.from('client_car_leases').insert(leaseData);
        if (error) throw error;
      }
    }

    // Insert income streams
    if (formData.incomeStreams.length > 0) {
      const incomeData = formData.incomeStreams.map(stream => ({
        user_id: user!.id,
        income_type: stream.type,
        monthly_net: stream.monthlyNet ? parseFloat(stream.monthlyNet) : null,
        average_overtime: stream.averageOvertime ? parseFloat(stream.averageOvertime) : null,
        bonus: stream.bonus ? parseFloat(stream.bonus) : null,
        extras: stream.extras ? parseFloat(stream.extras) : null,
        annual_gross: stream.annualGross ? parseFloat(stream.annualGross) : null,
        employer_name: stream.employerName || null,
        employer_address: stream.employerAddress || null,
        start_date: stream.startDate || null,
        contract_type: stream.contractType || null,
        annual_income: stream.annualIncome ? parseFloat(stream.annualIncome) : null,
        business_name: stream.businessName || null,
        business_type: stream.businessType || null,
        trading_start_date: stream.tradingStartDate || null,
        business_address: stream.businessAddress || null,
        business_url: stream.businessUrl || null,
        benefit_type: stream.benefitType || null,
        benefit_amount: (stream as any).benefitAmount ? parseFloat((stream as any).benefitAmount) : null,
        pension_provider: (stream as any).pensionProvider || null,
        pension_amount: (stream as any).pensionAmount ? parseFloat((stream as any).pensionAmount) : null,
        rental_properties: (stream as any).rentProperty ? parseInt((stream as any).rentProperty) : null,
        rental_income: (stream as any).rentIncome ? parseFloat((stream as any).rentIncome) : null,
        other_description: (stream as any).otherDescription || null,
        other_amount: (stream as any).otherAmount ? parseFloat((stream as any).otherAmount) : null,
      }));

      if (incomeData.length > 0) {
        const { error } = await supabase.from('client_income_streams').insert(incomeData);
        if (error) throw error;
      }
    }
  };

  const saveCreditHistory = async () => {
    // Count CCJs and defaults from creditDetails
    const ccjDetails = formData.creditDetails.filter(d => d.type === 'CCJ');
    const defaultDetails = formData.creditDetails.filter(d => d.type === 'Default');
    
    const ccjTotalValue = ccjDetails.reduce((sum, ccj) => {
      return sum + (parseFloat(ccj.amount) || 0);
    }, 0);

    const { error } = await supabase
      .from('client_credit_history')
      .upsert({
        user_id: user!.id,
        has_ccjs: formData.creditIssues.ccjs || false,
        ccj_count: ccjDetails.length,
        ccj_total_value: ccjTotalValue,
        ccj_details: ccjDetails.length > 0 ? JSON.stringify(ccjDetails) : null,
        has_defaults: formData.creditIssues.defaults || false,
        default_count: defaultDetails.length,
        default_details: defaultDetails.length > 0 ? JSON.stringify(defaultDetails) : null,
        has_bankruptcy: formData.creditIssues.bankruptcy || false,
        has_iva: formData.creditIssues.iva || false,
        has_mortgage_arrears: formData.creditIssues.missedPayments || false,
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  };

  const loadDocuments = async () => {
    const { data } = await supabase
      .from('client_documents')
      .select('*')
      .eq('user_id', user!.id);

    if (data) {
      const grouped = {
        identity: data.filter(d => d.document_type === 'identity'),
        proof_of_address: data.filter(d => d.document_type === 'proof_of_address'),
        bank_statement: data.filter(d => d.document_type === 'bank_statement')
      };
      setUploadedDocuments(grouped);
    }
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!user?.id) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('client_documents')
        .insert({
          user_id: user.id,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type
        });

      if (dbError) throw dbError;

      await loadDocuments();
      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string, filePath: string) => {
    try {
      await supabase.storage
        .from('client-documents')
        .remove([filePath]);

      await supabase
        .from('client_documents')
        .delete()
        .eq('id', documentId);

      await loadDocuments();
      toast({
        title: "Document Deleted",
        description: "The document has been removed.",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
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
    { key: 'documents', label: 'Documents', icon: Upload },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-navy">Complete Your Profile</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 bg-secondary">
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
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Personal Information"
                  )}
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
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Address Information"
                  )}
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
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Financial Information"
                  )}
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
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Credit Information"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Identity & Supporting Documents</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Identity Documents */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Identity Documents</h4>
                      <p className="text-sm text-muted-foreground">Passport, Driver's License, or National ID</p>
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'identity')}
                        disabled={uploading}
                      />
                      <Button variant="outline" size="sm" disabled={uploading} asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </span>
                      </Button>
                    </label>
                  </div>
                  {uploadedDocuments.identity.length > 0 && (
                    <div className="space-y-2">
                      {uploadedDocuments.identity.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center space-x-3">
                            <FileCheck className={`w-5 h-5 ${doc.verified ? 'text-success' : 'text-muted-foreground'}`} />
                            <div>
                              <p className="text-sm font-medium">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(doc.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {doc.verified && (
                              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">Verified</span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Proof of Address */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Proof of Address</h4>
                      <p className="text-sm text-muted-foreground">Utility bill, Council Tax, or Bank Statement (within 3 months)</p>
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'proof_of_address')}
                        disabled={uploading}
                      />
                      <Button variant="outline" size="sm" disabled={uploading} asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </span>
                      </Button>
                    </label>
                  </div>
                  {uploadedDocuments.proof_of_address.length > 0 && (
                    <div className="space-y-2">
                      {uploadedDocuments.proof_of_address.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center space-x-3">
                            <FileCheck className={`w-5 h-5 ${doc.verified ? 'text-success' : 'text-muted-foreground'}`} />
                            <div>
                              <p className="text-sm font-medium">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(doc.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {doc.verified && (
                              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">Verified</span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bank Statements */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Bank Statements</h4>
                      <p className="text-sm text-muted-foreground">Last 3-6 months of bank statements</p>
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'bank_statement')}
                        disabled={uploading}
                      />
                      <Button variant="outline" size="sm" disabled={uploading} asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </span>
                      </Button>
                    </label>
                  </div>
                  {uploadedDocuments.bank_statement.length > 0 && (
                    <div className="space-y-2">
                      {uploadedDocuments.bank_statement.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center space-x-3">
                            <FileCheck className={`w-5 h-5 ${doc.verified ? 'text-success' : 'text-muted-foreground'}`} />
                            <div>
                              <p className="text-sm font-medium">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(doc.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {doc.verified && (
                              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">Verified</span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => handleStepComplete('documents')}
                  className="w-full bg-gradient-primary hover:opacity-90"
                  disabled={uploadedDocuments.identity.length === 0 || uploadedDocuments.proof_of_address.length === 0}
                >
                  Complete Document Upload
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
