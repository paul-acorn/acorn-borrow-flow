import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [backgroundSteps, setBackgroundSteps] = useState({
    personal: false,
    address: false,
    financial: false,
    credit: false,
  });
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  // Fetch deals from database
  const { data: deals = [], isLoading: isLoadingDeals } = useQuery({
    queryKey: ['deals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Deal[];
    },
    enabled: !!user,
  });

  // Set up real-time subscription for deal updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('deals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals'
        },
        (payload) => {
          console.log('Deal change received:', payload);
          // Invalidate the deals query to refetch
          queryClient.invalidateQueries({ queryKey: ['deals', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Filter deals based on selected filters
  const filteredDeals = deals.filter(deal => {
    const typeMatch = filterType === "all" || deal.type === filterType;
    const statusMatch = filterStatus === "all" || deal.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const backgroundStepConfig = [
    { key: 'personal', label: 'Personal Info', icon: User, description: 'Identity & personal details' },
    { key: 'address', label: 'Address History', icon: MapPin, description: '3-year address verification' },
    { key: 'financial', label: 'Financial Details', icon: CreditCard, description: 'Assets, income & expenditure' },
    { key: 'credit', label: 'Credit History', icon: FileCheck, description: 'Credit assessment questions' },
  ];

  const isBackgroundComplete = Object.values(backgroundSteps).every(Boolean);

  const handleCreateDeal = async (dealData: { name: string; amount: number; type: Deal['type'] }) => {
    if (!user) return;

    try {
      // Insert deal into database
      const { data: newDeal, error: dealError } = await supabase
        .from('deals')
        .insert({
          user_id: user.id,
          created_by_user_id: user.id,
          name: dealData.name,
          amount: dealData.amount,
          type: dealData.type,
          status: 'draft'
        })
        .select()
        .single();

      if (dealError) throw dealError;

      // Add current user as deal participant
      const { error: participantError } = await supabase
        .from('deal_participants')
        .insert({
          deal_id: newDeal.id,
          user_id: user.id,
          role: 'client'
        });

      if (participantError) throw participantError;

      // Refresh deals list
      queryClient.invalidateQueries({ queryKey: ['deals', user.id] });

      // Sync to HubSpot (non-blocking)
      supabase.functions.invoke('hubspot', {
        body: {
          action: 'createDeal',
          properties: {
            dealname: dealData.name,
            amount: dealData.amount.toString(),
            dealstage: 'appointmentscheduled',
            pipeline: 'default'
          }
        }
      }).then(({ error }) => {
        if (error) {
          console.error('HubSpot sync error:', error);
        }
      });

      toast({
        title: "Application Created",
        description: `${dealData.name} has been created successfully.`,
      });
      
      setShowDealModal(false);
    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        title: "Error",
        description: "Failed to create application. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCreateRefinance = async (refinanceData: any) => {
    if (!user) return;

    try {
      // Insert refinance deal into database
      const { data: newDeal, error: dealError } = await supabase
        .from('deals')
        .insert({
          user_id: user.id,
          created_by_user_id: user.id,
          name: refinanceData.name,
          amount: refinanceData.amount,
          type: 'mortgage',
          status: 'draft'
        })
        .select()
        .single();

      if (dealError) throw dealError;

      // Add current user as deal participant
      await supabase
        .from('deal_participants')
        .insert({
          deal_id: newDeal.id,
          user_id: user.id,
          role: 'client'
        });

      // Refresh deals list
      queryClient.invalidateQueries({ queryKey: ['deals', user.id] });

      toast({
        title: "Refinance Application Created",
        description: "A mortgage application has been created for your bridging exit strategy.",
      });
    } catch (error) {
      console.error('Error creating refinance deal:', error);
      toast({
        title: "Error",
        description: "Failed to create refinance application.",
        variant: "destructive"
      });
    }
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground"
              onClick={() => signOut()}
            >
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-navy">Your Applications</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bridging">Bridging</SelectItem>
                  <SelectItem value="mortgage">Mortgage</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="factoring">Factoring</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="mca">MCA</SelectItem>
                  <SelectItem value="equity">Equity Release</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={() => setShowDealModal(true)}
                className="bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Application
              </Button>
            </div>
          </div>

          {isLoadingDeals ? (
            <Card className="text-center p-12">
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading applications...</p>
              </div>
            </Card>
          ) : filteredDeals.length === 0 ? (
            deals.length === 0 ? (
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
              <Card className="text-center p-12 border-dashed border-2 border-border">
                <div className="space-y-4">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium text-navy mb-2">No Matching Applications</h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your filters to see more applications
                    </p>
                    <Button 
                      onClick={() => {
                        setFilterType("all");
                        setFilterStatus("all");
                      }}
                      variant="outline"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </Card>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDeals.map((deal) => {
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
            dealId={selectedDeal.id}
            dealName={selectedDeal.name}
            onSave={handleModalSave}
          />
        </>
      )}
    </div>
  );
}