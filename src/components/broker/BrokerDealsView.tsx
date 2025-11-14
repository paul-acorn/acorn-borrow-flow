import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  User,
  MapPin,
  CreditCard,
  FileCheck,
  Mail,
  Phone
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ClientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone_number: string | null;
  deal_code: string | null;
}

interface DealWithClient {
  id: string;
  name: string;
  type: string;
  amount: number | null;
  status: string;
  created_at: string;
  user_id: string;
  client: ClientProfile;
}

export const BrokerDealsView = () => {
  const { user } = useAuth();
  const [expandedDeals, setExpandedDeals] = useState<Set<string>>(new Set());

  // Fetch deals for broker's clients
  const { data: deals, isLoading } = useQuery({
    queryKey: ["broker-deals", user?.id],
    queryFn: async () => {
      // First get the broker's clients
      const { data: clients, error: clientsError } = await supabase
        .from("profiles")
        .select("*")
        .eq("assigned_broker", user?.id);

      if (clientsError) throw clientsError;

      const clientIds = clients?.map((c) => c.id) || [];

      if (clientIds.length === 0) {
        return [];
      }

      // Then get deals for those clients
      const { data: dealsData, error: dealsError } = await supabase
        .from("deals")
        .select("*")
        .in("user_id", clientIds)
        .order("created_at", { ascending: false });

      if (dealsError) throw dealsError;

      // Merge client data with deals
      const dealsWithClients: DealWithClient[] = dealsData?.map((deal) => {
        const client = clients?.find((c) => c.id === deal.user_id);
        return {
          ...deal,
          client: {
            id: client?.id || "",
            first_name: client?.first_name || null,
            last_name: client?.last_name || null,
            email: client?.email || "",
            phone_number: client?.phone_number || null,
            deal_code: client?.deal_code || null,
          },
        };
      }) || [];

      return dealsWithClients;
    },
    enabled: !!user?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "pending":
        return "default";
      case "in_progress":
        return "default";
      case "approved":
        return "default";
      case "completed":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const toggleDeal = (dealId: string) => {
    setExpandedDeals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Client Deals</CardTitle>
          <CardDescription>
            View and track all deals for your assigned clients. Click on a deal to view client details.
          </CardDescription>
        </CardHeader>
      </Card>

      {deals && deals.length > 0 ? (
        <div className="space-y-4">
          {deals.map((deal) => (
            <Collapsible
              key={deal.id}
              open={expandedDeals.has(deal.id)}
              onOpenChange={() => toggleDeal(deal.id)}
            >
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full p-0 h-auto hover:bg-muted/50"
                  >
                    <CardHeader className="w-full">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4 text-left">
                          <div>
                            <CardTitle className="text-lg">{deal.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {deal.client.first_name} {deal.client.last_name} • {deal.client.email}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            {deal.client.deal_code || "No Code"}
                          </Badge>
                          <Badge variant={getStatusColor(deal.status)}>
                            {deal.status.replace(/_/g, " ")}
                          </Badge>
                          <div className="text-lg font-semibold text-foreground">
                            {formatCurrency(deal.amount)}
                          </div>
                          {expandedDeals.has(deal.id) ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 border-t border-border">
                    <div className="space-y-6 mt-6">
                      {/* Deal Information */}
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">
                          Deal Information
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Type</p>
                            <p className="text-sm font-medium capitalize">
                              {deal.type.replace(/_/g, " ")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Amount</p>
                            <p className="text-sm font-medium">
                              {formatCurrency(deal.amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant={getStatusColor(deal.status)}>
                              {deal.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="text-sm font-medium">
                              {new Date(deal.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Client Background Details */}
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">
                          Client Background Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Personal Info */}
                          <Card className="border-2">
                            <CardHeader className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-sm">Personal Info</CardTitle>
                                  <CardDescription className="text-xs truncate">
                                    Identity & details
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Name</p>
                                <p className="text-sm font-medium">
                                  {deal.client.first_name || "—"} {deal.client.last_name || "—"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3 text-muted-foreground" />
                                <p className="text-xs truncate">{deal.client.email}</p>
                              </div>
                              {deal.client.phone_number && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3 h-3 text-muted-foreground" />
                                  <p className="text-xs">{deal.client.phone_number}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Address History */}
                          <Card className="border-2">
                            <CardHeader className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                  <MapPin className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-sm">Address History</CardTitle>
                                  <CardDescription className="text-xs truncate">
                                    3-year verification
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <p className="text-xs text-muted-foreground">
                                View full address history in client profile
                              </p>
                            </CardContent>
                          </Card>

                          {/* Financial Details */}
                          <Card className="border-2">
                            <CardHeader className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                  <CreditCard className="w-5 h-5 text-green-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-sm">Financial Details</CardTitle>
                                  <CardDescription className="text-xs truncate">
                                    Assets & income
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <p className="text-xs text-muted-foreground">
                                View financial information in client profile
                              </p>
                            </CardContent>
                          </Card>

                          {/* Credit History */}
                          <Card className="border-2">
                            <CardHeader className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                  <FileCheck className="w-5 h-5 text-purple-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-sm">Credit History</CardTitle>
                                  <CardDescription className="text-xs truncate">
                                    Credit assessment
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <p className="text-xs text-muted-foreground">
                                View credit information in client profile
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            No deals found for your clients yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
