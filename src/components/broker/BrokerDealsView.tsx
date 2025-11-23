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

interface ClientBackgroundDetails {
  personal: {
    title: string | null;
    dob: string | null;
    marital_status: string | null;
    nationality: string | null;
  } | null;
  addresses: Array<{
    id: string;
    is_current: boolean;
    property_number: string | null;
    street: string | null;
    city: string | null;
    postcode: string | null;
    date_moved_in: string | null;
    date_moved_out: string | null;
  }>;
  financial: {
    assets: {
      bank_accounts: number;
      property_value: number;
      investments: number;
      pension_value: number;
      other_assets: number;
    } | null;
    mortgages: Array<{
      type: string;
      balance: number;
      lender: string;
      monthly_payment: number;
    }>;
    personal_loans: Array<{
      balance: number;
      lender: string;
      monthly_payment: number;
    }>;
    credit_cards: Array<{
      credit_limit: number;
      balance: number;
      monthly_payment: number;
    }>;
    income_streams: Array<{
      income_type: string;
      monthly_net: number | null;
      annual_gross: number | null;
      employer_name: string | null;
      business_name: string | null;
    }>;
  };
  credit: {
    has_ccjs: boolean;
    ccj_count: number;
    ccj_total_value: number;
    has_defaults: boolean;
    default_count: number;
    has_bankruptcy: boolean;
    has_iva: boolean;
    credit_score: number | null;
    credit_report_date: string | null;
  } | null;
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
  backgroundDetails?: ClientBackgroundDetails;
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

      // Fetch background details for all clients
      const backgroundDetailsPromises = clientIds.map(async (clientId) => {
        // Fetch personal details
        const { data: personal } = await supabase
          .from("client_personal_details")
          .select("title, dob, marital_status, nationality")
          .eq("user_id", clientId)
          .maybeSingle();

        // Fetch addresses
        const { data: addresses } = await supabase
          .from("client_addresses")
          .select("*")
          .eq("user_id", clientId)
          .order("date_moved_in", { ascending: false });

        // Fetch financial assets
        const { data: assets } = await supabase
          .from("client_financial_assets")
          .select("*")
          .eq("user_id", clientId)
          .maybeSingle();

        // Fetch mortgages
        const { data: mortgages } = await supabase
          .from("client_mortgages")
          .select("type, balance, lender, monthly_payment")
          .eq("user_id", clientId);

        // Fetch personal loans
        const { data: personal_loans } = await supabase
          .from("client_personal_loans")
          .select("balance, lender, monthly_payment")
          .eq("user_id", clientId);

        // Fetch credit cards
        const { data: credit_cards } = await supabase
          .from("client_credit_cards")
          .select("credit_limit, balance, monthly_payment")
          .eq("user_id", clientId);

        // Fetch income streams
        const { data: income_streams } = await supabase
          .from("client_income_streams")
          .select("income_type, monthly_net, annual_gross, employer_name, business_name")
          .eq("user_id", clientId);

        // Fetch credit history
        const { data: credit } = await supabase
          .from("client_credit_history")
          .select("has_ccjs, ccj_count, ccj_total_value, has_defaults, default_count, has_bankruptcy, has_iva, credit_score, credit_report_date")
          .eq("user_id", clientId)
          .maybeSingle();

        return {
          clientId,
          details: {
            personal,
            addresses: addresses || [],
            financial: {
              assets,
              mortgages: mortgages || [],
              personal_loans: personal_loans || [],
              credit_cards: credit_cards || [],
              income_streams: income_streams || [],
            },
            credit,
          },
        };
      });

      const backgroundDetailsArray = await Promise.all(backgroundDetailsPromises);
      const backgroundDetailsMap = new Map(
        backgroundDetailsArray.map((item) => [item.clientId, item.details])
      );

      // Merge client data with deals and background details
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
          backgroundDetails: backgroundDetailsMap.get(deal.user_id),
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                        <div className="flex-1 min-w-0 text-left">
                          <CardTitle className="text-lg truncate">{deal.name}</CardTitle>
                          <CardDescription className="mt-1 text-xs sm:text-sm truncate">
                            {deal.client.first_name} {deal.client.last_name} • {deal.client.email}
                          </CardDescription>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-shrink-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {deal.client.deal_code || "No Code"}
                            </Badge>
                            <Badge variant={getStatusColor(deal.status)} className="text-xs">
                              {deal.status.replace(/_/g, " ")}
                            </Badge>
                            <div className="text-sm sm:text-lg font-semibold text-foreground whitespace-nowrap">
                              {formatCurrency(deal.amount)}
                            </div>
                          </div>
                          {expandedDeals.has(deal.id) ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
                                    {deal.backgroundDetails?.addresses?.length || 0} addresses recorded
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-2">
                              {deal.backgroundDetails?.addresses && deal.backgroundDetails.addresses.length > 0 ? (
                                deal.backgroundDetails.addresses.slice(0, 2).map((addr, idx) => (
                                  <div key={idx} className="text-xs">
                                    <p className="font-medium">
                                      {addr.is_current && <Badge variant="outline" className="mr-1 text-[10px] px-1 py-0">Current</Badge>}
                                      {addr.property_number} {addr.street}
                                    </p>
                                    <p className="text-muted-foreground">
                                      {addr.city}, {addr.postcode}
                                    </p>
                                    {addr.date_moved_in && (
                                      <p className="text-muted-foreground text-[10px]">
                                        From: {new Date(addr.date_moved_in).toLocaleDateString()}
                                        {addr.date_moved_out && ` - ${new Date(addr.date_moved_out).toLocaleDateString()}`}
                                      </p>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-muted-foreground">No address history recorded</p>
                              )}
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
                                    Assets & liabilities
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-2">
                              {deal.backgroundDetails?.financial?.assets ? (
                                <>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Total Assets</p>
                                    <p className="text-sm font-medium">
                                      {formatCurrency(
                                        Number(deal.backgroundDetails.financial.assets.bank_accounts || 0) +
                                        Number(deal.backgroundDetails.financial.assets.property_value || 0) +
                                        Number(deal.backgroundDetails.financial.assets.investments || 0) +
                                        Number(deal.backgroundDetails.financial.assets.pension_value || 0) +
                                        Number(deal.backgroundDetails.financial.assets.other_assets || 0)
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Liabilities</p>
                                    <p className="text-[10px]">
                                      {deal.backgroundDetails.financial.mortgages.length} mortgages, {" "}
                                      {deal.backgroundDetails.financial.personal_loans.length} loans, {" "}
                                      {deal.backgroundDetails.financial.credit_cards.length} credit cards
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Income Streams</p>
                                    <p className="text-[10px]">
                                      {deal.backgroundDetails.financial.income_streams.length} income sources
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <p className="text-xs text-muted-foreground">No financial details recorded</p>
                              )}
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
                            <CardContent className="p-4 pt-0 space-y-2">
                              {deal.backgroundDetails?.credit ? (
                                <>
                                  {deal.backgroundDetails.credit.credit_score && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Credit Score</p>
                                      <p className="text-sm font-medium">{deal.backgroundDetails.credit.credit_score}</p>
                                      {deal.backgroundDetails.credit.credit_report_date && (
                                        <p className="text-[10px] text-muted-foreground">
                                          As of {new Date(deal.backgroundDetails.credit.credit_report_date).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  <div className="space-y-1">
                                    {deal.backgroundDetails.credit.has_ccjs && (
                                      <p className="text-[10px] text-destructive">
                                        {deal.backgroundDetails.credit.ccj_count} CCJ(s) - {formatCurrency(deal.backgroundDetails.credit.ccj_total_value)}
                                      </p>
                                    )}
                                    {deal.backgroundDetails.credit.has_defaults && (
                                      <p className="text-[10px] text-destructive">
                                        {deal.backgroundDetails.credit.default_count} Default(s)
                                      </p>
                                    )}
                                    {deal.backgroundDetails.credit.has_bankruptcy && (
                                      <p className="text-[10px] text-destructive">Bankruptcy recorded</p>
                                    )}
                                    {deal.backgroundDetails.credit.has_iva && (
                                      <p className="text-[10px] text-destructive">IVA recorded</p>
                                    )}
                                    {!deal.backgroundDetails.credit.has_ccjs && 
                                     !deal.backgroundDetails.credit.has_defaults && 
                                     !deal.backgroundDetails.credit.has_bankruptcy && 
                                     !deal.backgroundDetails.credit.has_iva && (
                                      <p className="text-[10px] text-green-600">No adverse credit recorded</p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <p className="text-xs text-muted-foreground">No credit history recorded</p>
                              )}
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
