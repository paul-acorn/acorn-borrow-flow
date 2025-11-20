import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessagingModal } from "@/components/MessagingModal";
import { RequirementsManager } from "@/components/RequirementsManager";
import { MessageCircle, FileText, CheckCircle, Clock, TrendingUp } from "lucide-react";
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
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
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

  const activeDeal = deals[0]; // Show the most recent deal

  if (!activeDeal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Your Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You don't have any active deals yet. Your broker will create a case for you soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentStageIndex = DEAL_STAGES.findIndex(stage => stage.id === activeDeal.status);
  const currentStage = DEAL_STAGES[currentStageIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">{activeDeal.name}</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">
                  {activeDeal.type.replace(/_/g, ' ')} Finance
                </p>
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="requirements">Required Documents</TabsTrigger>
                <TabsTrigger value="activity">Activity History</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="requirements" className="space-y-4">
                <RequirementsManager dealId={activeDeal.id} />
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

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No activity yet</p>
      ) : (
        activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 p-4 rounded-lg bg-muted/50">
            <div className="flex-1">
              <p className="font-medium capitalize">{activity.action.replace(/_/g, ' ')}</p>
              {activity.details && (
                <p className="text-sm text-muted-foreground mt-1">
                  {JSON.stringify(activity.details)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(activity.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
