import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { MessagingModal } from "@/components/MessagingModal";
import { RequirementsManager } from "@/components/RequirementsManager";
import { ScheduledCallbacksView } from "@/components/ScheduledCallbacksView";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { MessageCircle, FileText, CheckCircle, Clock, TrendingUp, Calendar, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Deal {
  id: string;
  name: string;
  amount: number | null;
  type: string;
  status: 'new_case' | 'awaiting_dip' | 'dip_approved' | 'reports_instructed' | 'final_underwriting' | 'offered' | 'with_solicitors' | 'completed';
  created_at: string;
}

const DEAL_STAGES = [
  { id: 'new_case', label: 'New Case', icon: FileText, description: 'Your case has been created' },
  { id: 'awaiting_dip', label: 'Awaiting DIP', icon: Clock, description: 'Decision in Principle pending' },
  { id: 'dip_approved', label: 'DIP Approved', icon: CheckCircle, description: 'Initial approval received' },
  { id: 'reports_instructed', label: 'Reports Instructed', icon: FileText, description: 'Property reports ordered' },
  { id: 'final_underwriting', label: 'Final Underwriting', icon: TrendingUp, description: 'Final checks in progress' },
  { id: 'offered', label: 'Offered', icon: CheckCircle, description: 'Loan offer issued' },
  { id: 'with_solicitors', label: 'With Solicitors', icon: FileText, description: 'Legal process underway' },
  { id: 'completed', label: 'Completed', icon: CheckCircle, description: 'Deal successfully completed' },
];

export function ClientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDealIndex, setCurrentDealIndex] = useState(0);
  const [showMessaging, setShowMessaging] = useState(false);

  // Fetch user's deals
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['client-deals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Deal[];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('client-deals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['client-deals', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const getProgressPercentage = (status: string) => {
    const index = DEAL_STAGES.findIndex(stage => stage.id === status);
    return ((index + 1) / DEAL_STAGES.length) * 100;
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '£0';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        {/* Header */}
        <header className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold">
                Your Dashboard
              </h1>
              <UserProfileMenu />
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Welcome Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to Acorn Finance! 🎉</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg text-muted-foreground">
                Thank you for choosing us for your finance needs. Your dedicated broker will create your case shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                In the meantime, here are some things you should know about working with us.
              </p>
            </CardContent>
          </Card>

          {/* Quick Tips Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Document Preparation</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start gathering important documents like ID, proof of address, and bank statements. You will be able to upload these directly through your dashboard.
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <MessageCircle className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Direct Communication</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Once your case is created, you can message your broker directly through the dashboard. No need for emails or phone tags!
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Track Your Progress</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      View real-time updates on your application status. From initial review to completion, you will always know where things stand.
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Calendar className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Schedule Callbacks</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Need to speak with your broker? Schedule a callback at a time that works for you, and receive reminders before the call.
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Next Steps Card */}
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  1
                </div>
                <p className="text-sm">Your broker will review your information and create your case</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  2
                </div>
                <p className="text-sm">You will receive a notification when your case is ready</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  3
                </div>
                <p className="text-sm">Complete any required documents and communicate directly with your broker</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  4
                </div>
                <p className="text-sm">Track your application progress through each stage until completion</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const activeDeal = deals[currentDealIndex];
  const currentStageIndex = DEAL_STAGES.findIndex(stage => stage.id === activeDeal.status);
  const currentStage = DEAL_STAGES[currentStageIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">
              Your Dashboard
            </h1>
            <UserProfileMenu />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Deal Selector Carousel */}
        {deals.length > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Carousel className="w-full max-w-md" opts={{ loop: true }}>
              <CarouselContent>
                {deals.map((deal, index) => (
                  <CarouselItem key={deal.id}>
                    <Button
                      variant={index === currentDealIndex ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setCurrentDealIndex(index)}
                    >
                      {deal.name}
                    </Button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious onClick={() => setCurrentDealIndex((prev) => (prev - 1 + deals.length) % deals.length)} />
              <CarouselNext onClick={() => setCurrentDealIndex((prev) => (prev + 1) % deals.length)} />
            </Carousel>
          </div>
        )}

        {/* Header Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">{activeDeal.name}</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">
                  {activeDeal.type.replace(/_/g, ' ')} Finance
                </p>
                {deals.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Deal {currentDealIndex + 1} of {deals.length}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{formatCurrency(activeDeal.amount)}</div>
                <Badge className="mt-2">{currentStage.label}</Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Progress Tracker */}
        <Card>
          <CardHeader>
            <CardTitle>Application Progress</CardTitle>
            <Progress value={getProgressPercentage(activeDeal.status)} className="h-2 mt-4" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DEAL_STAGES.map((stage, index) => {
                const Icon = stage.icon;
                const isCompleted = index <= currentStageIndex;
                const isCurrent = index === currentStageIndex;
                
                return (
                  <div
                    key={stage.id}
                    className={`flex flex-col items-center text-center p-4 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-primary/10 border border-primary'
                        : isCompleted
                        ? 'bg-muted'
                        : 'opacity-40'
                    }`}
                  >
                    <Icon className={`h-6 w-6 mb-2 ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium">{stage.label}</span>
                    {isCurrent && (
                      <span className="text-[10px] text-muted-foreground mt-1">{stage.description}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowMessaging(true)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Message Your Broker</CardTitle>
                  <p className="text-sm text-muted-foreground">Get instant support</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">Documents</CardTitle>
                  <p className="text-sm text-muted-foreground">View below</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card>
          <Tabs defaultValue="requirements" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="requirements" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Documents</span>
                </TabsTrigger>
                <TabsTrigger value="callbacks" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Callbacks</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">Activity</span>
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="requirements" className="space-y-4">
                <RequirementsManager dealId={activeDeal.id} />
              </TabsContent>

              <TabsContent value="callbacks" className="space-y-4">
                <ScheduledCallbacksView />
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <ActivityLog dealId={activeDeal.id} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Messaging Modal */}
        {showMessaging && (
          <MessagingModal
            open={showMessaging}
            onOpenChange={setShowMessaging}
            dealId={activeDeal.id}
            dealName={activeDeal.name}
            onSave={() => {
              toast({ title: "Message sent successfully" });
              setShowMessaging(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Activity Log Component
function ActivityLog({ dealId }: { dealId: string }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['deal-activity', dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_activity_logs')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  const formatActivityDetails = (action: string, details: any) => {
    if (!details) return null;
    
    switch (action) {
      case 'message_sent':
        return details.message_preview || 'Message sent';
      case 'broker_assigned':
        return 'Broker assigned to your case';
      case 'status_changed':
        return `Status updated to ${details.new_status?.replace(/_/g, ' ') || 'new status'}`;
      case 'document_uploaded':
        return `Document uploaded: ${details.document_name || 'File'}`;
      case 'note_added':
        return details.note || 'Note added';
      default:
        return typeof details === 'object' ? null : details;
    }
  };

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No activity yet</p>
      ) : (
        activities.map((activity) => {
          const formattedDetails = formatActivityDetails(activity.action, activity.details);
          return (
            <div key={activity.id} className="flex gap-3 p-4 rounded-lg bg-muted/50">
              <div className="flex-1">
                <p className="font-medium capitalize">{activity.action.replace(/_/g, ' ')}</p>
                {formattedDetails && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formattedDetails}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
