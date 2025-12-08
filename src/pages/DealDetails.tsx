import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder components (we will build these interactively next)
// For now, we just want the page to load without crashing.
const DealOverview = ({ deal }: { deal: any }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Loan Amount</CardTitle></CardHeader>
        <CardContent className="text-2xl font-bold">£{deal.amount?.toLocaleString()}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Status</CardTitle></CardHeader>
        <CardContent className="capitalize">{deal.status?.replace(/_/g, " ")}</CardContent>
      </Card>
    </div>
  </div>
);

const DealDetails = () => {
  const { dealId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // 1. Fetch Deal Data (inc. Broker ID to check permissions)
  const { data: deal, isLoading, error } = useQuery({
    queryKey: ["deal-full", dealId],
    queryFn: async () => {
      if (!dealId) throw new Error("No deal ID");
      
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          profiles:user_id (
            email, first_name, last_name, assigned_broker
          )
        `)
        .eq("id", dealId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!dealId,
  });

  // 2. Permission Gate
  useEffect(() => {
    if (deal && user) {
      const isOwner = user.id === deal.user_id;
      const isAssignedBroker = user.id === deal.profiles?.assigned_broker;
      
      // If you are NOT the owner AND NOT the broker, kick you out
      // (You can add isAdmin check here too if needed)
      if (!isOwner && !isAssignedBroker) {
        // toast.error("Access Denied");
        navigate("/dashboard"); 
      }
    }
  }, [deal, user, navigate]);

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  if (error || !deal) return <div className="p-8 text-center text-red-500">Error loading deal</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{deal.name || "Untitled Deal"}</h1>
          <p className="text-muted-foreground">
            Client: {deal.profiles?.first_name} {deal.profiles?.last_name}
          </p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity & Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <DealOverview deal={deal} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="p-4 border rounded-lg bg-muted/20">
            Document Audit Component coming here...
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="p-4 border rounded-lg bg-muted/20">
            Chat/Timeline coming here...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DealDetails;
