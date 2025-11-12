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
import { UserPlus, Loader2, Copy, Check, Mail } from "lucide-react";
import { toast } from "sonner";

export const ClientManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch broker's profile to get initials
  const { data: brokerProfile } = useQuery({
    queryKey: ["broker-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

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

  // Resend invitation email mutation
  const resendInvitationMutation = useMutation({
    mutationFn: async (invitation: any) => {
      // Check rate limit (5 minutes)
      const lastSent = new Date(invitation.last_email_sent_at);
      const now = new Date();
      const minutesSinceLastSend = (now.getTime() - lastSent.getTime()) / 1000 / 60;

      if (minutesSinceLastSend < 5) {
        const minutesRemaining = Math.ceil(5 - minutesSinceLastSend);
        throw new Error(`Please wait ${minutesRemaining} minute(s) before resending`);
      }

      // Send invitation email via edge function
      const invitationUrl = `${window.location.origin}/welcome?code=${invitation.invitation_code}`;
      
      const { error: emailError } = await supabase.functions.invoke("send-client-invitation", {
        body: {
          email: invitation.client_email,
          firstName: invitation.client_first_name,
          lastName: invitation.client_last_name,
          invitationCode: invitation.invitation_code,
          invitationUrl,
          brokerName: `${brokerProfile?.first_name} ${brokerProfile?.last_name}`,
        },
      });

      if (emailError) throw emailError;

      // Update last_email_sent_at
      const { error: updateError } = await supabase
        .from("team_invitations")
        .update({ last_email_sent_at: now.toISOString() })
        .eq("id", invitation.id);

      if (updateError) throw updateError;

      return invitation;
    },
    onSuccess: (invitation) => {
      toast.success(
        `Invitation resent to ${invitation.client_first_name} ${invitation.client_last_name}!`
      );
      queryClient.invalidateQueries({ queryKey: ["broker-invitations"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to resend invitation");
    },
  });

  // Create client invitation mutation
  const createClientMutation = useMutation({
    mutationFn: async () => {
      // Auto-generate broker initials from profile
      if (!brokerProfile?.first_name || !brokerProfile?.last_name) {
        throw new Error("Broker profile incomplete. Please update your profile with first and last name.");
      }

      const brokerInitials = (
        brokerProfile.first_name.charAt(0) + 
        brokerProfile.last_name.charAt(0)
      ).toUpperCase();

      // Generate invitation code
      const { data: invitationCode, error: invitationError } = await supabase.rpc(
        "generate_invitation_code"
      );

      if (invitationError) throw invitationError;

      // Generate deal code with new format (e.g., FL250001)
      const { data: dealCodeData, error: dealCodeError } = await supabase.rpc(
        "generate_deal_code",
        { broker_initials: brokerInitials }
      );

      if (dealCodeError) throw dealCodeError;

      // Create invitation with client details for pre-population
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

      const { error: insertError } = await supabase
        .from("team_invitations")
        .insert({
          invitation_code: invitationCode,
          role: "client",
          created_by: user?.id,
          expires_at: expiresAt.toISOString(),
          client_first_name: newClientFirstName,
          client_last_name: newClientLastName,
          client_email: newClientEmail,
          deal_code: dealCodeData,
        });

      if (insertError) throw insertError;

      // Send invitation email via edge function
      const invitationUrl = `${window.location.origin}/welcome?code=${invitationCode}`;
      
      try {
        await supabase.functions.invoke("send-client-invitation", {
          body: {
            email: newClientEmail,
            firstName: newClientFirstName,
            lastName: newClientLastName,
            invitationCode,
            invitationUrl,
            brokerName: `${brokerProfile.first_name} ${brokerProfile.last_name}`,
          },
        });
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail the whole operation if email fails
      }

      return {
        invitationCode,
        dealCode: dealCodeData,
        email: newClientEmail,
        firstName: newClientFirstName,
        lastName: newClientLastName,
        invitationUrl,
      };
    },
    onSuccess: (data) => {
      toast.success(
        `Invitation sent to ${data.firstName} ${data.lastName}!`,
        { duration: 5000 }
      );
      queryClient.invalidateQueries({ queryKey: ["broker-clients"] });
      queryClient.invalidateQueries({ queryKey: ["broker-invitations"] });
      setIsAddDialogOpen(false);
      setNewClientEmail("");
      setNewClientFirstName("");
      setNewClientLastName("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add client");
    },
  });

  const handleAddClient = () => {
    if (!newClientEmail || !newClientFirstName || !newClientLastName) {
      toast.error("All fields are required");
      return;
    }
    createClientMutation.mutate();
  };

  const canResend = (lastSentAt: string) => {
    const lastSent = new Date(lastSentAt);
    const now = new Date();
    const minutesSinceLastSend = (now.getTime() - lastSent.getTime()) / 1000 / 60;
    return minutesSinceLastSend >= 5;
  };

  const getResendCooldownText = (lastSentAt: string) => {
    const lastSent = new Date(lastSentAt);
    const now = new Date();
    const minutesSinceLastSend = (now.getTime() - lastSent.getTime()) / 1000 / 60;
    const minutesRemaining = Math.ceil(5 - minutesSinceLastSend);
    return minutesRemaining > 0 ? `Wait ${minutesRemaining}m` : "Resend";
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
                <DialogTitle>Invite New Client</DialogTitle>
                <DialogDescription>
                  Send an invitation email with a unique registration link
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName">Client First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={newClientFirstName}
                    onChange={(e) => setNewClientFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Client Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={newClientLastName}
                    onChange={(e) => setNewClientLastName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Client Email</Label>
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
                  Send Invitation
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
                  <TableHead>Client Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Deal Code</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      {invitation.client_first_name} {invitation.client_last_name}
                    </TableCell>
                    <TableCell>{invitation.client_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invitation.deal_code}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canResend(invitation.last_email_sent_at) || resendInvitationMutation.isPending}
                        onClick={() => resendInvitationMutation.mutate(invitation)}
                        title={canResend(invitation.last_email_sent_at) ? "Resend invitation email" : "Rate limited - wait 5 minutes between resends"}
                      >
                        {resendInvitationMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-1" />
                            {getResendCooldownText(invitation.last_email_sent_at)}
                          </>
                        )}
                      </Button>
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
