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
import { UserPlus, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export const ClientManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [brokerInitials, setBrokerInitials] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch broker's registered clients
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

  // Fetch pending invitations created by broker
  const { data: pendingInvitations } = useQuery({
    queryKey: ["broker-invitations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("created_by", user?.id)
        .eq("role", "client")
        .is("used_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Create client invitation mutation
  const createClientMutation = useMutation({
    mutationFn: async () => {
      if (!brokerInitials.trim()) {
        throw new Error("Broker initials are required");
      }

      // Generate invitation code
      const { data: invitationCode, error: invitationError } = await supabase.rpc(
        "generate_invitation_code"
      );

      if (invitationError) throw invitationError;

      // Generate deal code
      const { data: dealCodeData, error: dealCodeError } = await supabase.rpc(
        "generate_deal_code",
        { broker_initials: brokerInitials.toUpperCase() }
      );

      if (dealCodeError) throw dealCodeError;

      // Create invitation with client role
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

      const { error: insertError } = await supabase
        .from("team_invitations")
        .insert({
          invitation_code: invitationCode,
          role: "client",
          created_by: user?.id,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) throw insertError;

      // Send invitation email (for now, just return the code)
      return {
        invitationCode,
        dealCode: dealCodeData,
        email: newClientEmail,
        firstName: newClientFirstName,
        lastName: newClientLastName,
      };
    },
    onSuccess: (data) => {
      toast.success(
        `Client invitation created! Share this code with ${data.firstName}: ${data.invitationCode}`,
        { duration: 10000 }
      );
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

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
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
      <CardContent className="space-y-6">
        {/* Registered Clients */}
        {clients && clients.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">Registered Clients</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{client.deal_code || "N/A"}</Badge>
                        {client.deal_code && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(client.deal_code!, "Deal code")}
                          >
                            {copiedCode === client.deal_code ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
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
          </div>
        )}

        {/* Pending Invitations */}
        {pendingInvitations && pendingInvitations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">Pending Invitations</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invitation Code</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className="font-mono">{invitation.invitation_code}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(invitation.invitation_code, "Invitation code")}
                        >
                          {copiedCode === invitation.invitation_code ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {(!clients || clients.length === 0) && (!pendingInvitations || pendingInvitations.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            No clients or pending invitations yet. Add your first client to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
