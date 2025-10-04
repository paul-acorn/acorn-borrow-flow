import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackgroundDetailsModal } from "@/components/BackgroundDetailsModal";
import { DealCreationModal } from "@/components/DealCreationModal";
import { LoanDetailsModal } from "@/components/LoanDetailsModal";
import { PropertyDetailsModal } from "@/components/PropertyDetailsModal";
import { DocumentUploadModal } from "@/components/DocumentUploadModal";
import { MessagingModal } from "@/components/MessagingModal";
import { 
  User, 
  MapPin, 
  CreditCard, 
  FileCheck, 
  Shield, 
  Plus,
  Home,
  Building,
  TrendingUp,
  Banknote,
  Truck,
  Calculator,
  PiggyBank,
  LogOut,
  MessageCircle,
  Upload,
  Settings,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Deal {
  id: string;
  name: string;
  amount: number;
  type: 'bridging' | 'mortgage' | 'development' | 'business' | 'factoring' | 'asset' | 'mca' | 'equity';
  status: 'draft' | 'submitted' | 'approved' | 'declined';
}

const loanTypeIcons = {
  bridging: TrendingUp,
  mortgage: Home,
  development: Building,
  business: Banknote,
  factoring: Calculator,
  asset: Truck,
  mca: CreditCard,
  equity: PiggyBank,
};

export function Dashboard() {
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [backgroundInitialStep, setBackgroundInitialStep] = useState<string | undefined>(undefined);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showLoanDetailsModal, setShowLoanDetailsModal] = useState(false);
  const [showPropertyDetailsModal, setShowPropertyDetailsModal] = useState(false);
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [backgroundSteps, setBackgroundSteps] = useState({
    personal: false,
    address: false,
    financial: false,
    credit: false,
  });
  const [deals, setDeals] = useState<Deal[]>([]);
  const { toast } = useToast();

  const backgroundStepConfig = [
    { key: 'personal', label: 'Personal Info', icon: User, description: 'Identity & personal details' },
    { key: 'address', label: 'Address History', icon: MapPin, description: '3-year address verification' },
    { key: 'financial', label: 'Financial Details', icon: CreditCard, description: 'Assets, income & expenditure' },
    { key: 'credit', label: 'Credit History', icon: FileCheck, description: 'Credit assessment questions' },
  ];

  const isBackgroundComplete = Object.values(backgroundSteps).every(Boolean);

  const handleCreateDeal = (dealData: { name: string; amount: number; type: Deal['type'] }) => {
    const newDeal: Deal = {
      id: Date.now().toString(),
      ...dealData,
      status: 'draft'
    };
    setDeals([...deals, newDeal]);
    setShowDealModal(false);
    toast({
      title: "Application Created",
      description: `${dealData.name} has been created successfully.`,
    });
  };

  const handleCreateRefinance = (refinanceData: any) => {
    const refinanceDeal: Deal = {
      id: Date.now().toString() + '_refinance',
      name: refinanceData.name,
      amount: refinanceData.amount,
      type: 'mortgage',
      status: 'draft'
    };
    setDeals(prev => [...prev, refinanceDeal]);
    toast({
      title: "Refinance Application Created",
      description: "A mortgage application has been created for your bridging exit strategy.",
    });
  };

  const openDealModal = (deal: Deal, modalType: string) => {
    setSelectedDeal(deal);
    switch (modalType) {
      case 'loan':
        setShowLoanDetailsModal(true);
        break;
      case 'property':
        setShowPropertyDetailsModal(true);
        break;
      case 'documents':
        setShowDocumentUploadModal(true);
        break;
      case 'messages':
        setShowMessagingModal(true);
        break;
      default:
        break;
    }
  };

  const handleModalSave = (data: any) => {
    console.log('Modal data saved:', data);
    // Here you would typically save the data to your backend
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-navy">
              Finance Dashboard
            </h1>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Background Details Section */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-navy">Background Details</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Complete your profile to access all features
                </p>
              </div>
              {isBackgroundComplete && (
                <Badge variant="default" className="bg-success text-white">
                  Complete
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {backgroundStepConfig.map((step) => {
                const IconComponent = step.icon;
                const isComplete = backgroundSteps[step.key as keyof typeof backgroundSteps];
                
                return (
                  <Button
                    key={step.key}
                    variant="outline"
                    className={`h-auto p-4 flex flex-col items-center text-center space-y-2 border-2 transition-all ${
                      isComplete 
                        ? 'border-success bg-success/5 text-success hover:bg-success/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setBackgroundInitialStep(step.key);
                      setShowBackgroundModal(true);
                    }}
                  >
                    <IconComponent className={`w-6 h-6 ${isComplete ? 'text-success' : 'text-muted-foreground'}`} />
                    <div>
                      <div className="font-medium text-sm">{step.label}</div>
                      <div className="text-xs text-muted-foreground">{step.description}</div>
                    </div>
                    {isComplete && (
                      <FileCheck className="w-4 h-4 text-success" />
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Deals Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-navy">Your Applications</h2>
            <Button 
              onClick={() => setShowDealModal(true)}
              className="bg-gradient-primary hover:opacity-90"
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Application
            </Button>
          </div>

          {deals.length === 0 ? (
            <Card className="text-center p-12 border-dashed border-2 border-border">
              <div className="space-y-4">
                <Plus className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">No Applications Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first loan application to get started
                  </p>
                  <Button 
                    onClick={() => setShowDealModal(true)}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Application
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal) => {
                const IconComponent = loanTypeIcons[deal.type];
                return (
                  <Card key={deal.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <IconComponent className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-navy">{deal.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {deal.type} finance
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={deal.status === 'draft' ? 'secondary' : 'default'}
                          className="text-xs"
                        >
                          {deal.status}
                        </Badge>
                      </div>
                      
                      <div className="text-2xl font-bold text-navy mb-4">
                        {formatCurrency(deal.amount)}
                      </div>
                      
                      <div className="flex justify-between items-center text-sm mb-4">
                        <span className="text-muted-foreground">Status</span>
                        <span className="capitalize font-medium">{deal.status}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDealModal(deal, 'loan')}
                          className="text-xs"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Loan Details
                        </Button>
                        
                        {!['factoring', 'asset', 'mca'].includes(deal.type) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDealModal(deal, 'property')}
                            className="text-xs"
                          >
                            <Home className="w-3 h-3 mr-1" />
                            Property
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDealModal(deal, 'documents')}
                          className="text-xs"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Documents
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDealModal(deal, 'messages')}
                          className="text-xs"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Messages
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <BackgroundDetailsModal 
        open={showBackgroundModal}
        onOpenChange={(open) => {
          setShowBackgroundModal(open);
          if (!open) setBackgroundInitialStep(undefined);
        }}
        steps={backgroundSteps}
        onStepComplete={(step) => {
          setBackgroundSteps(prev => ({ ...prev, [step]: true }));
        }}
        initialStep={backgroundInitialStep}
      />
      
      <DealCreationModal
        open={showDealModal}
        onOpenChange={setShowDealModal}
        onSubmit={handleCreateDeal}
      />

      {selectedDeal && (
        <>
          <LoanDetailsModal
            open={showLoanDetailsModal}
            onOpenChange={setShowLoanDetailsModal}
            dealType={selectedDeal.type}
            dealName={selectedDeal.name}
            dealAmount={selectedDeal.amount}
            onSave={handleModalSave}
            onCreateRefinance={handleCreateRefinance}
          />

          <PropertyDetailsModal
            open={showPropertyDetailsModal}
            onOpenChange={setShowPropertyDetailsModal}
            dealName={selectedDeal.name}
            onSave={handleModalSave}
          />

          <DocumentUploadModal
            open={showDocumentUploadModal}
            onOpenChange={setShowDocumentUploadModal}
            dealName={selectedDeal.name}
            onSave={handleModalSave}
          />

          <MessagingModal
            open={showMessagingModal}
            onOpenChange={setShowMessagingModal}
            dealName={selectedDeal.name}
            onSave={handleModalSave}
          />
        </>
      )}
    </div>
  );
}