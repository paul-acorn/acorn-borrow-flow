import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Workflow, 
  Users, 
  FileText, 
  FileCheck, 
  MessageSquare,
  Plus,
  Calendar,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { WorkflowAutomation } from "@/components/admin/WorkflowAutomation";
import { ClientManagement } from "@/components/broker/ClientManagement";
import { BrokerDealsView } from "@/components/broker/BrokerDealsView";
import { DocumentReviewDashboard } from "@/components/admin/DocumentReviewDashboard";
import { UnifiedInbox } from "@/components/UnifiedInbox";
import { CampaignSequences } from "@/components/admin/CampaignSequences";
import { BrokerDealCreationModal } from "@/components/broker/BrokerDealCreationModal";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { ScheduledCallbacksView } from "@/components/ScheduledCallbacksView";

export const BrokerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("deals");
  const [isDealCreationOpen, setIsDealCreationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Broker Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setIsDealCreationOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Deal
              </Button>
              <UserProfileMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 max-w-6xl overflow-x-auto">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              <span className="hidden sm:inline">Workflows</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Clients</span>
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Deals</span>
            </TabsTrigger>
            <TabsTrigger value="callbacks" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Callbacks</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Inbox</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Campaigns</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard brokerFilter={user?.id} />
          </TabsContent>

          <TabsContent value="workflows" className="mt-6">
            <WorkflowAutomation />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <ClientManagement />
          </TabsContent>

          <TabsContent value="deals" className="mt-6">
            <BrokerDealsView />
          </TabsContent>

          <TabsContent value="callbacks" className="mt-6">
            <ScheduledCallbacksView />
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <DocumentReviewDashboard brokerFilter={user?.id} />
          </TabsContent>

          <TabsContent value="inbox" className="mt-6">
            <UnifiedInbox brokerFilter={user?.id} />
          </TabsContent>

          <TabsContent value="campaigns" className="mt-6">
            <CampaignSequences />
          </TabsContent>
        </Tabs>

        <BrokerDealCreationModal 
          open={isDealCreationOpen} 
          onOpenChange={setIsDealCreationOpen} 
        />
      </main>
    </div>
  );
};
