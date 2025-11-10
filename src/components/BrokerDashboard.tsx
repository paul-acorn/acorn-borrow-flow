import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, Plus } from "lucide-react";
import { ClientManagement } from "@/components/broker/ClientManagement";
import { BrokerDealsView } from "@/components/broker/BrokerDealsView";
import { BrokerDealCreationModal } from "@/components/broker/BrokerDealCreationModal";
import { CustomerDropdown } from "@/components/CustomerDropdown";
import { UserProfileMenu } from "@/components/UserProfileMenu";

export const BrokerDashboard = () => {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState("clients");
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
              <CustomerDropdown />
              <UserProfileMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-6">
          <Button onClick={() => setIsDealCreationOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Deal
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Clients
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Client Deals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-6">
            <ClientManagement />
          </TabsContent>

          <TabsContent value="deals" className="mt-6">
            <BrokerDealsView />
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
