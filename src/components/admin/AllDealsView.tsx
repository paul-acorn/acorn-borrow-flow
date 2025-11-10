import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Search, FileText, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Deal {
  id: string;
  name: string;
  amount: number | null;
  type: string;
  status: string;
  created_at: string;
  user_id: string;
}

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  deal_code: string | null;
  assigned_broker: string | null;
}

export function AllDealsView() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole('super_admin');
  const isAdmin = hasRole('admin');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch all deals
  const { data: deals = [], isLoading: isLoadingDeals } = useQuery({
    queryKey: ['admin-all-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Deal[];
    },
  });

  // Fetch all profiles for user lookup
  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      return data as Profile[];
    },
  });

  const profilesMap = profiles.reduce((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {} as Record<string, Profile>);

  const filteredDeals = deals.filter(deal => {
    const profile = profilesMap[deal.user_id];
    const matchesSearch = 
      deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile?.deal_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || deal.type === filterType;
    const matchesStatus = filterStatus === "all" || deal.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'outline';
      case 'in_progress': return 'secondary';
      case 'submitted': return 'default';
      case 'approved': return 'default';
      case 'declined': return 'destructive';
      default: return 'outline';
    }
  };

  const selectedDeal = deals.find(d => d.id === selectedDealId);
  const selectedProfile = selectedDeal ? profilesMap[selectedDeal.user_id] : null;
  const brokerProfile = selectedProfile?.assigned_broker ? profilesMap[selectedProfile.assigned_broker] : null;

  const handleRowClick = (dealId: string) => {
    setSelectedDealId(dealId);
    setIsDetailsOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          <div>
            <CardTitle>All Deals</CardTitle>
            <CardDescription>View and manage all deals across the platform</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by deal name, email, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="bridging">Bridging</SelectItem>
              <SelectItem value="mortgage">Mortgage</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="equity">Equity Release</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoadingDeals ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>{(isSuperAdmin || isAdmin) ? 'Broker' : 'Deal Code'}</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal) => {
                  const profile = profilesMap[deal.user_id];
                  const broker = profile?.assigned_broker ? profilesMap[profile.assigned_broker] : null;
                  return (
                    <TableRow 
                      key={deal.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(deal.id)}
                    >
                      <TableCell className="font-medium">{deal.name}</TableCell>
                      <TableCell>
                        {profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {(isSuperAdmin || isAdmin) ? (
                          broker ? `${broker.first_name} ${broker.last_name}` : 'No Broker'
                        ) : (
                          profile?.deal_code && <Badge variant="outline">{profile.deal_code}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {deal.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(deal.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(deal.status)}>
                          {deal.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(deal.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredDeals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No deals found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Deal Details</DialogTitle>
            <DialogDescription>
              View detailed information about this deal
            </DialogDescription>
          </DialogHeader>
          
          {selectedDeal && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="deal-info">
                  <FileText className="w-4 h-4 mr-2" />
                  Deal Information
                </TabsTrigger>
                <TabsTrigger value="client-info">
                  <User className="w-4 h-4 mr-2" />
                  Client Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Deal Name</p>
                    <p className="font-medium">{selectedDeal.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">{formatCurrency(selectedDeal.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="secondary">{selectedDeal.type.replace('_', ' ')}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={getStatusVariant(selectedDeal.status)}>
                      {selectedDeal.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(selectedDeal.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deal ID</p>
                    <p className="font-mono text-xs">{selectedDeal.id}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="deal-info" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Deal Form Information</CardTitle>
                    <CardDescription>Details submitted for this {selectedDeal.type} deal</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Deal Type</p>
                        <p className="font-medium capitalize">{selectedDeal.type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Amount Requested</p>
                        <p className="font-medium">{formatCurrency(selectedDeal.amount)}</p>
                      </div>
                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-2">Form Data</p>
                        <p className="text-sm text-muted-foreground italic">
                          Additional deal-specific information will be displayed here
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="client-info" className="space-y-4 mt-4">
                {selectedProfile && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Client Information</CardTitle>
                      <CardDescription>Complete profile details</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Full Name</p>
                          <p className="font-medium">
                            {selectedProfile.first_name} {selectedProfile.last_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedProfile.email}</p>
                        </div>
                        {selectedProfile.deal_code && (
                          <div>
                            <p className="text-sm text-muted-foreground">Deal Code</p>
                            <Badge variant="outline">{selectedProfile.deal_code}</Badge>
                          </div>
                        )}
                        {brokerProfile && (
                          <div>
                            <p className="text-sm text-muted-foreground">Assigned Broker</p>
                            <p className="font-medium">
                              {brokerProfile.first_name} {brokerProfile.last_name}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Client ID</p>
                          <p className="font-mono text-xs">{selectedProfile.id}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
