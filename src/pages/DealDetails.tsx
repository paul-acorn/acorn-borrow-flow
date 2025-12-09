import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DealDocumentAudit from "@/components/deals/DealDocumentAudit";
import DealTimeline from "@/components/deals/DealTimeline";
import type { Database } from "@/integrations/supabase/types";

type DealStatus = Database["public"]["Enums"]["deal_status"];

// --- STATUS OPTIONS (matching deal_status enum) ---
const DEAL_STATUSES: { value: DealStatus; label: string }[] = [
  { value: "new_case", label: "New Case" },
  { value: "awaiting_dip", label: "Awaiting DIP" },
  { value: "dip_approved", label: "DIP Approved" },
  { value: "reports_instructed", label: "Reports Instructed" },
  { value: "final_underwriting", label: "Final Underwriting" },
  { value: "offered", label: "Offered" },
  { value: "with_solicitors", label: "With Solicitors" },
  { value: "completed", label: "Completed" },
];

// --- SUB-COMPONENT: Status Controller ---
const DealStatusController = ({ dealId, currentStatus }: { dealId: string; currentStatus: DealStatus }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<DealStatus>(currentStatus);

  const updateStatus = useMutation({
    mutationFn: async (newStatus: DealStatus) => {
      const { error } = await supabase
        .from("deals")
        .update({ status: newStatus })
        .eq("id", dealId);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      setStatus(newStatus);
      queryClient.invalidateQueries({ queryKey: ["deal-full", dealId] });
      toast({
        title: "Status Updated",
        description: `Deal moved to ${newStatus.replace(/_/g, " ")}`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <Select 
        value={status} 
        onValueChange={(val) => updateStatus.mutate(val as DealStatus)}
        disabled={updateStatus.isPending}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {DEAL_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {updateStatus.isPending && <p className="text-xs text-muted-foreground animate-pulse">Updating...</p>}
    </div>
  );
};

// --- SUB-COMPONENT: Deal Overview Tab ---
const DealOverview = ({ deal }: { deal: any }) => (
  <div className="space-y-6">
    {/* Key Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Loan Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">£{deal.amount?.toLocaleString() ?? "0"}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 👇 THIS IS THE NEW INTERACTIVE CONTROLLER 👇 */}
          <DealStatusController dealId={deal.id} currentStatus={deal.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Client Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium">{deal.profiles?.email}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {deal.profiles?.phone_number || "No phone recorded"}
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Application Details Card */}
    <Card>
        <CardHeader>
            <CardTitle>Application Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="text-muted-foreground">Deal Type:</span>
                    <span className="ml-2 font-medium capitalize">{deal.type?.replace(/_/g, " ")}</span>
                </div>
                <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2 font-medium">{new Date(deal.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </CardContent>
    </Card>
  </div>
);

// --- MAIN PAGE COMPONENT ---
const DealDetails = () => {
  const { dealId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // 1. Fetch Deal Data
  const { data: deal, isLoading, error } = useQuery({
    queryKey: ["deal-full", dealId],
    queryFn: async () => {
      if (!dealId) throw new Error("No deal ID");
      
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          profiles:user_id (
            email, first_name, last_name, assigned_broker, phone_number
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
      
      if (!isOwner && !isAssignedBroker) {
        navigate("/dashboard"); 
      }
    }
  }, [deal, user, navigate]);

  if (isLoading) return <div className="flex justify-center p-8 h-screen items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error || !deal) return <div className="p-8 text-center text-destructive">Error loading deal details.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{deal.name || "Untitled Deal"}</h1>
          <p className="text-muted-foreground">
            Client: {deal.profiles?.first_name} {deal.profiles?.last_name}
          </p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">
            Documents
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">
            Activity & Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <DealOverview deal={deal} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DealDocumentAudit dealId={dealId!} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <DealTimeline dealId={dealId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DealDetails;
