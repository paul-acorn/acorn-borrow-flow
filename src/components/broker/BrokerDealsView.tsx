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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export const BrokerDealsView = () => {
  const { user } = useAuth();

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
      const dealsWithClients = dealsData?.map((deal) => {
        const client = clients?.find((c) => c.id === deal.user_id);
        return {
          ...deal,
          client_first_name: client?.first_name,
          client_last_name: client?.last_name,
          client_email: client?.email,
          client_deal_code: client?.deal_code,
        };
      });

      return dealsWithClients || [];
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Deals</CardTitle>
        <CardDescription>
          View and track all deals for your assigned clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        {deals && deals.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Deal Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">{deal.name}</TableCell>
                  <TableCell>
                    {deal.client_first_name} {deal.client_last_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {deal.client_deal_code || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {deal.type.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>
                    {deal.amount
                      ? `£${Number(deal.amount).toLocaleString()}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(deal.status)}>
                      {deal.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(deal.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No deals found for your clients yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
