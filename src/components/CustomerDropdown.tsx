import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Eye, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const CustomerDropdown = () => {
  const { user, userRoles } = useAuth();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Determine which customers to fetch based on role
  const { data: customers } = useQuery({
    queryKey: ["customers-dropdown", user?.id, userRoles],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*");

      // Brokers only see their assigned clients
      if (userRoles.includes("broker") && !userRoles.includes("admin") && !userRoles.includes("super_admin")) {
        query = query.eq("assigned_broker", user?.id);
      }
      // Admins and super admins see all

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch selected customer details with their deals
  const { data: customerDetails } = useQuery({
    queryKey: ["customer-details", selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return null;

      const [profileResult, dealsResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", selectedCustomerId).single(),
        supabase.from("deals").select("*").eq("user_id", selectedCustomerId),
        supabase.from("user_roles").select("*").eq("user_id", selectedCustomerId),
      ]);

      if (profileResult.error) throw profileResult.error;

      return {
        profile: profileResult.data,
        deals: dealsResult.data || [],
        roles: rolesResult.data || [],
      };
    },
    enabled: !!selectedCustomerId && isDetailsOpen,
  });

  const handleExportToGoogleSheets = () => {
    if (!customerDetails) return;

    const { profile, deals } = customerDetails;

    // Create CSV content
    const csvContent = [
      // Customer Info Section
      ["CUSTOMER INFORMATION"],
      ["Field", "Value"],
      ["Name", `${profile.first_name || ""} ${profile.last_name || ""}`],
      ["Email", profile.email],
      ["Deal Code", profile.deal_code || "N/A"],
      ["Created At", new Date(profile.created_at).toLocaleDateString()],
      [""],
      // Deals Section
      ["DEALS"],
      ["Deal Name", "Type", "Status", "Amount", "Created At"],
      ...deals.map((deal) => [
        deal.name,
        deal.type,
        deal.status,
        deal.amount ? `£${deal.amount.toLocaleString()}` : "N/A",
        new Date(deal.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    // Create downloadable file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `customer_${profile.deal_code || profile.id}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Customer data exported successfully");
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  const handleViewDetails = () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer first");
      return;
    }
    setIsDetailsOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
          <SelectTrigger className="w-[200px] bg-background text-foreground">
            <Users className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Select customer" className="text-foreground" />
          </SelectTrigger>
          <SelectContent className="bg-background text-foreground z-50 border border-border">
            {customers?.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.first_name} {customer.last_name}
                {customer.deal_code && (
                  <span className="ml-2 text-muted-foreground">
                    ({customer.deal_code})
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={handleViewDetails}
          disabled={!selectedCustomerId}
          title="View customer details"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View and export customer information
            </DialogDescription>
          </DialogHeader>

          {customerDetails && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {customerDetails.profile.first_name}{" "}
                      {customerDetails.profile.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{customerDetails.profile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deal Code</p>
                    <Badge variant="outline">
                      {customerDetails.profile.deal_code || "N/A"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="font-medium">
                      {new Date(customerDetails.profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Deals */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Deals ({customerDetails.deals.length})
                </h3>
                {customerDetails.deals.length > 0 ? (
                  <div className="space-y-2">
                    {customerDetails.deals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-4 border rounded-lg bg-card"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{deal.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {deal.type}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge>{deal.status}</Badge>
                            {deal.amount && (
                              <p className="text-sm font-medium mt-1">
                                £{deal.amount.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No deals found</p>
                )}
              </div>

              {/* Export Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleExportToGoogleSheets}>
                  <Download className="mr-2 h-4 w-4" />
                  Export to Google Sheets (CSV)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
