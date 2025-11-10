import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, Search } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  deal_code: string | null;
  assigned_broker: string | null;
}

interface UserRole {
  role: string;
}

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [brokerInitials, setBrokerInitials] = useState("");
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const isBroker = hasRole('broker');

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch user roles
  const { data: userRoles = {} } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (error) throw error;
      
      // Group roles by user_id
      const rolesByUser: Record<string, string[]> = {};
      data.forEach((ur: any) => {
        if (!rolesByUser[ur.user_id]) {
          rolesByUser[ur.user_id] = [];
        }
        rolesByUser[ur.user_id].push(ur.role);
      });
      
      return rolesByUser;
    },
  });

  const handleAddClient = async () => {
    if (!user || !newClientEmail || !newClientFirstName || !newClientLastName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate deal code
      const initials = brokerInitials || (newClientFirstName[0] + newClientLastName[0]).toUpperCase();
      const { data: dealCode, error: codeError } = await supabase
        .rpc('generate_deal_code', { broker_initials: initials });

      if (codeError) throw codeError;

      // Create invitation for the client
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data: inviteCode, error: inviteCodeError } = await supabase
        .rpc('generate_invitation_code');

      if (inviteCodeError) throw inviteCodeError;

      const { error: inviteError } = await supabase
        .from('team_invitations')
        .insert({
          created_by: user.id,
          invitation_code: inviteCode,
          expires_at: expiresAt.toISOString()
        });

      if (inviteError) throw inviteError;

      toast({
        title: "Client Invitation Created",
        description: `Deal code: ${dealCode}. Invitation code: ${inviteCode}`,
      });

      // Reset form
      setNewClientEmail("");
      setNewClientFirstName("");
      setNewClientLastName("");
      setBrokerInitials("");
      setShowAddClientDialog(false);

      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.deal_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'broker': return 'secondary';
      case 'client': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage all users in the system</CardDescription>
          </div>
          {isBroker && (
            <Button onClick={() => setShowAddClientDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search users by name, email, or deal code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Deal Code</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.deal_code && (
                        <Badge variant="outline">{user.deal_code}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {userRoles[user.id]?.map((role: string) => (
                          <Badge key={role} variant={getRoleBadgeVariant(role)}>
                            {role.replace('_', ' ')}
                          </Badge>
                        )) || <Badge variant="outline">No roles</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={showAddClientDialog} onOpenChange={setShowAddClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client with a unique deal code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={newClientFirstName}
                onChange={(e) => setNewClientFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={newClientLastName}
                onChange={(e) => setNewClientLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initials">Broker Initials (optional)</Label>
              <Input
                id="initials"
                value={brokerInitials}
                onChange={(e) => setBrokerInitials(e.target.value.toUpperCase())}
                placeholder="JD"
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use client initials
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddClientDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClient}>
              Create Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
