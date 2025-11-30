import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, Search, Edit2, Shield } from "lucide-react";

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
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRoleToEdit, setSelectedRoleToEdit] = useState<string>("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDealCode, setEditDealCode] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("client");
  const [brokerInitials, setBrokerInitials] = useState("");
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = hasRole('super_admin');
  const isAdmin = hasRole('admin');
  const isBroker = hasRole('broker');
  const canAddUsers = isSuperAdmin || isAdmin || isBroker;

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

  const handleAddUser = async () => {
    if (!user || !newUserEmail || !newUserFirstName || !newUserLastName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate deal code for clients and brokers
      let dealCode = null;
      if (newUserRole === 'client' || newUserRole === 'broker') {
        const initials = brokerInitials || (newUserFirstName[0] + newUserLastName[0]).toUpperCase();
        const { data, error: codeError } = await supabase
          .rpc('generate_deal_code', { broker_initials: initials });

        if (codeError) throw codeError;
        dealCode = data;
      }

      // Create invitation for the user (secure_token is auto-generated)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Generate invitation code for backwards compatibility
      const { data: inviteCode, error: inviteCodeError } = await supabase
        .rpc('generate_invitation_code');

      if (inviteCodeError) throw inviteCodeError;

      const { data: invitation, error: inviteError } = await supabase
        .from('team_invitations')
        .insert({
          created_by: user.id,
          invitation_code: inviteCode,
          client_email: newUserEmail,
          client_first_name: newUserFirstName,
          client_last_name: newUserLastName,
          deal_code: dealCode,
          expires_at: expiresAt.toISOString(),
          role: newUserRole as 'client' | 'broker' | 'admin'
        })
        .select('secure_token')
        .single();

      if (inviteError) throw inviteError;

      // Get broker name for the email
      const { data: brokerProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const brokerName = brokerProfile 
        ? `${brokerProfile.first_name} ${brokerProfile.last_name}`
        : 'Your broker';

      // Send invitation email with secure link
      const { error: emailError } = await supabase.functions.invoke('send-client-invitation', {
        body: {
          email: newUserEmail,
          firstName: newUserFirstName,
          lastName: newUserLastName,
          secureToken: invitation.secure_token,
          brokerName
        }
      });

      if (emailError) {
        console.error('Error sending invitation email:', emailError);
      }

      const roleLabel = newUserRole.replace('_', ' ');
      toast({
        title: `${roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)} Invitation Created`,
        description: `Invitation email sent to ${newUserEmail}${dealCode ? `. Deal code: ${dealCode}` : ''}`,
      });

      // Reset form
      setNewUserEmail("");
      setNewUserFirstName("");
      setNewUserLastName("");
      setNewUserRole("client");
      setBrokerInitials("");
      setShowAddUserDialog(false);

      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
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

  const handleEditUser = (user: Profile) => {
    setSelectedUser(user);
    setEditFirstName(user.first_name || "");
    setEditLastName(user.last_name || "");
    setEditEmail(user.email);
    setEditDealCode(user.deal_code || "");
    setShowEditUserDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editFirstName,
          last_name: editLastName,
          email: editEmail,
          deal_code: editDealCode || null,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: "User Updated",
        description: "User details have been updated successfully",
      });

      setShowEditUserDialog(false);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditRole = (userId: string) => {
    const currentRoles = userRoles[userId];
    setSelectedUserId(userId);
    setSelectedRoleToEdit(currentRoles?.[0] || 'client');
    setShowEditRoleDialog(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUserId || !selectedRoleToEdit) return;

    try {
      // Remove existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUserId);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: selectedUserId,
          role: selectedRoleToEdit as any
        }]);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: "User role has been updated successfully",
      });

      setShowEditRoleDialog(false);
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as any);

      if (error) throw error;

      toast({
        title: "Role Removed",
        description: "User role has been removed successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Failed to remove role. Please try again.",
        variant: "destructive"
      });
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
          {canAddUsers && (
            <Button onClick={() => setShowAddUserDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
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
                  {isSuperAdmin && <TableHead className="w-[150px]">Actions</TableHead>}
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
                    {isSuperAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            title="Edit user details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRole(user.id)}
                            title="Edit user role"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user and send them an invitation code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="role">User Role</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={newUserFirstName}
                onChange={(e) => setNewUserFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={newUserLastName}
                onChange={(e) => setNewUserLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            {(newUserRole === 'client' || newUserRole === 'broker') && (
              <div className="space-y-2">
                <Label htmlFor="initials">Initials for Deal Code (optional)</Label>
                <Input
                  id="initials"
                  value={brokerInitials}
                  onChange={(e) => setBrokerInitials(e.target.value.toUpperCase())}
                  placeholder="JD"
                  maxLength={4}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use user's initials
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editFirstName">First Name</Label>
              <Input
                id="editFirstName"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLastName">Last Name</Label>
              <Input
                id="editLastName"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDealCode">Deal Code</Label>
              <Input
                id="editDealCode"
                value={editDealCode}
                onChange={(e) => setEditDealCode(e.target.value.toUpperCase())}
                placeholder="FL250001"
              />
            </div>
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="assignBroker">Assign Broker</Label>
                <Select 
                  value={selectedUser?.assigned_broker || "unassigned"} 
                  onValueChange={async (value) => {
                    if (!selectedUser) return;
                    const brokerId = value === "unassigned" ? null : value;
                    try {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ assigned_broker: brokerId })
                        .eq('id', selectedUser.id);
                      
                      if (error) throw error;
                      
                      toast({
                        title: "Broker Updated",
                        description: "Client has been assigned to broker successfully",
                      });
                      
                      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                      setSelectedUser({ ...selectedUser, assigned_broker: brokerId });
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: "Failed to assign broker",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select broker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No Broker</SelectItem>
                    {users
                      .filter(u => userRoles[u.id]?.includes('broker'))
                      .map(broker => (
                        <SelectItem key={broker.id} value={broker.id}>
                          {broker.first_name} {broker.last_name} ({broker.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the user's role in the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select value={selectedRoleToEdit} onValueChange={setSelectedRoleToEdit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="broker">Broker</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
