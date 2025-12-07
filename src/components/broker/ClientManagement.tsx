import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFormNavigation } from "@/hooks/useFormNavigation";
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
import { UserPlus, Loader2, Copy, Check, Mail, Phone, Eye, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { CallLoggingModal } from "@/components/CallLoggingModal";
import { CustomerDetailsView } from "./CustomerDetailsView";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const ClientManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [sendViaSms, setSendViaSms] = useState(false);
  const [smsChannel, setSmsChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [callLoggingOpen, setCallLoggingOpen] = useState(false);
  const [selectedClientForCall, setSelectedClientForCall] = useState<{ dealId?: string; phone?: string }>({});
  const [selectedClientDetails, setSelectedClientDetails] = useState<{ id: string; name: string } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  
  useFormNavigation(formRef, {
    onSubmit: () => handleAddClient(),
    canSubmit: () => !!(newClientEmail && newClientFirstName && newClientLastName) && !createClientMutation.isPending
  });

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
      const lastSent = new Date((invitation as any).last_email_sent_at || invitation.created_at);
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
        .update({ last_email_sent_at: now.toISOString() } as any)
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

      // Send SMS/WhatsApp invitation if phone number provided and option selected
      if (sendViaSms && newClientPhone) {
        try {
          await supabase.functions.invoke("send-client-invitation-sms", {
            body: {
              phoneNumber: newClientPhone,
              firstName: newClientFirstName,
              lastName: newClientLastName,
              invitationUrl,
              brokerName: `${brokerProfile.first_name} ${brokerProfile.last_name}`,
              channel: smsChannel,
            },
          });
        } catch (smsError) {
          console.error("Failed to send invitation SMS:", smsError);
          // Don't fail the whole operation if SMS fails
        }
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
      const channels = [];
      if (data.email) channels.push('email');
      if (sendViaSms && newClientPhone) channels.push(smsChannel);
      
      toast.success(
        `Invitation sent to ${data.firstName} ${data.lastName} via ${channels.join(' and ')}!`,
        { duration: 5000 }
      );
      queryClient.invalidateQueries({ queryKey: ["broker-clients"] });
      queryClient.invalidateQueries({ queryKey: ["broker-invitations"] });
      setIsAddDialogOpen(false);
      setNewClientEmail("");
      setNewClientPhone("");
      setNewClientFirstName("");
      setNewClientLastName("");
      setSendViaSms(false);
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

  const canResend = (lastSentAt: string | null | undefined) => {
    if (!lastSentAt) return true;
    const lastSent = new Date(lastSentAt);
    const now = new Date();
    const minutesSinceLastSend = (now.getTime() - lastSent.getTime()) / 1000 / 60;
    return minutesSinceLastSend >= 5;
  };

  const getResendCooldownText = (lastSentAt: string | null | undefined) => {
    if (!lastSentAt) return "Resend";
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
            <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Invite New Client</DialogTitle>
                <DialogDescription>
                  Send an invitation via email, SMS, or WhatsApp
                </DialogDescription>
              </DialogHeader>
              <div ref={formRef} className="space-y-4 overflow-y-auto flex-1 -mx-6 px-6">
                <div>
                  <Label htmlFor="firstName">Client First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={newClientFirstName}
                    onChange={(e) => setNewClientFirstName(e.target.value)}
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Client Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={newClientLastName}
                    onChange={(e) => setNewClientLastName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Client Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="client@example.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Client Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="+44 7XXX XXXXXX"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {newClientPhone && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sendSms"
                        checked={sendViaSms}
                        onCheckedChange={(checked) => setSendViaSms(checked as boolean)}
                      />
                      <Label htmlFor="sendSms" className="cursor-pointer flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Also send invitation via SMS/WhatsApp
                      </Label>
                    </div>
                    {sendViaSms && (
                      <RadioGroup value={smsChannel} onValueChange={(value) => setSmsChannel(value as 'sms' | 'whatsapp')}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sms" id="sms" />
                          <Label htmlFor="sms" className="cursor-pointer">SMS</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="whatsapp" id="whatsapp" />
                          <Label htmlFor="whatsapp" className="cursor-pointer">WhatsApp</Label>
                        </div>
                      </RadioGroup>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter className="flex-shrink-0 border-t pt-4">
                <Button
                  onClick={handleAddClient}
                  disabled={createClientMutation.isPending}
                  className="w-full sm:w-auto"
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
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      {client.phone_number ? (
                        <a
                          href={`tel:${client.phone_number}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {client.phone_number}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedClientDetails({
                              id: client.id,
                              name: `${client.first_name} ${client.last_name}`
                            });
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        {client.phone_number && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedClientForCall({ phone: client.phone_number || undefined });
                              setCallLoggingOpen(true);
                            }}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Log Call
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        )}

        {/* Pending Invitations */}
        {pendingInvitations && pendingInvitations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">Pending Invitations</h3>
            <div className="overflow-x-auto -mx-6 px-6">
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
                        disabled={!canResend((invitation as any).last_email_sent_at) || resendInvitationMutation.isPending}
                        onClick={() => resendInvitationMutation.mutate(invitation)}
                        title={canResend((invitation as any).last_email_sent_at) ? "Resend invitation email" : "Rate limited - wait 5 minutes between resends"}
                      >
                        {resendInvitationMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-1" />
                            {getResendCooldownText((invitation as any).last_email_sent_at)}
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        )}

        {(!clients || clients.length === 0) && (!pendingInvitations || pendingInvitations.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            No clients or pending invitations yet. Add your first client to get started.
          </div>
        )}
      </CardContent>

      <CallLoggingModal
        open={callLoggingOpen}
        onOpenChange={setCallLoggingOpen}
        dealId={selectedClientForCall.dealId}
        phoneNumber={selectedClientForCall.phone}
      />

      <Sheet open={!!selectedClientDetails} onOpenChange={(open) => !open && setSelectedClientDetails(null)}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Customer Details</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {selectedClientDetails && (
              <CustomerDetailsView
                customerId={selectedClientDetails.id}
                customerName={selectedClientDetails.name}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
};
