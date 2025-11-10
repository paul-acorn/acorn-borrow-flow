import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const ClientManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [brokerInitials, setBrokerInitials] = useState("");

  // Fetch broker's clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ["broker-clients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("assigned_broker", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async () => {
      if (!brokerInitials.trim()) {
        throw new Error("Broker initials are required");
      }

      // Call the generate_deal_code function
      const { data: dealCodeData, error: dealCodeError } = await supabase.rpc(
        "generate_deal_code",
        { broker_initials: brokerInitials.toUpperCase() }
      );

      if (dealCodeError) throw dealCodeError;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newClientEmail,
        email_confirm: true,
        user_metadata: {
          first_name: newClientFirstName,
          last_name: newClientLastName,
        },
      });

      if (authError) throw authError;

      // Update profile with broker assignment and deal code
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          assigned_broker: user?.id,
          deal_code: dealCodeData,
          first_name: newClientFirstName,
          last_name: newClientLastName,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      return authData.user;
    },
    onSuccess: () => {
      toast.success("Client added successfully");
      queryClient.invalidateQueries({ queryKey: ["broker-clients"] });
      setIsAddDialogOpen(false);
      setNewClientEmail("");
      setNewClientFirstName("");
      setNewClientLastName("");
      setBrokerInitials("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add client");
    },
  });

  const handleAddClient = () => {
    if (!newClientEmail || !newClientFirstName || !newClientLastName || !brokerInitials) {
      toast.error("All fields are required");
      return;
    }
    createClientMutation.mutate();
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Clients</CardTitle>
            <CardDescription>
              Manage your assigned clients and their deal codes
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>
                  Create a new client account with a unique deal code
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="brokerInitials">Your Initials</Label>
                  <Input
                    id="brokerInitials"
                    placeholder="e.g., JD"
                    value={brokerInitials}
                    onChange={(e) => setBrokerInitials(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={newClientFirstName}
                    onChange={(e) => setNewClientFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={newClientLastName}
                    onChange={(e) => setNewClientLastName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="client@example.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddClient}
                  disabled={createClientMutation.isPending}
                >
                  {createClientMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Client
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {clients && clients.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Badge variant="outline">{client.deal_code || "N/A"}</Badge>
                  </TableCell>
                  <TableCell>
                    {client.first_name} {client.last_name}
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>
                    {new Date(client.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No clients assigned yet. Add your first client to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
