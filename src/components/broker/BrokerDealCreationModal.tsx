import { useState, useRef } from "react";
import { useFormNavigation } from "@/hooks/useFormNavigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  TrendingUp, 
  Home, 
  Building, 
  Banknote, 
  Calculator, 
  Truck, 
  CreditCard, 
  PiggyBank,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface BrokerDealCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type LoanType = 'bridging' | 'mortgage' | 'development' | 'business' | 'factoring' | 'asset' | 'mca' | 'equity';

const loanTypes = [
  {
    type: 'bridging' as LoanType,
    label: 'Bridging Finance',
    description: 'Short-term property financing',
    icon: TrendingUp,
  },
  {
    type: 'mortgage' as LoanType,
    label: 'Mortgage',
    description: 'Residential & BTL mortgages',
    icon: Home,
  },
  {
    type: 'development' as LoanType,
    label: 'Development Finance',
    description: 'Property development funding',
    icon: Building,
  },
  {
    type: 'business' as LoanType,
    label: 'Business Loans',
    description: 'Commercial lending solutions',
    icon: Banknote,
  },
  {
    type: 'factoring' as LoanType,
    label: 'Factoring',
    description: 'Invoice financing solutions',
    icon: Calculator,
  },
  {
    type: 'asset' as LoanType,
    label: 'Asset Finance',
    description: 'Equipment & vehicle finance',
    icon: Truck,
  },
  {
    type: 'mca' as LoanType,
    label: 'Merchant Cash Advance',
    description: 'Business cash flow solutions',
    icon: CreditCard,
  },
  {
    type: 'equity' as LoanType,
    label: 'Equity Release',
    description: 'Later life lending',
    icon: PiggyBank,
  },
];

export function BrokerDealCreationModal({ open, onOpenChange }: BrokerDealCreationModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientEmail, setClientEmail] = useState("");
  const [selectedType, setSelectedType] = useState<LoanType | null>(null);
  const [dealName, setDealName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const formRef = useRef<HTMLDivElement>(null);
  
  useFormNavigation(formRef);

  // Fetch broker's clients
  const { data: clients } = useQuery({
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
    enabled: !!user?.id && open,
  });

  // Create deal mutation
  const createDealMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClientId || !selectedType || !dealName) {
        throw new Error("Please fill all required fields");
      }

      console.log('Creating deal with:', {
        selectedClientId,
        selectedType,
        dealName,
        amount,
        brokerId: user?.id
      });

      // Verify broker-client relationship
      const { data: clientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('assigned_broker, deal_code')
        .eq('id', selectedClientId)
        .single();

      console.log('Client profile:', clientProfile, 'Error:', profileError);

      if (profileError) {
        throw new Error(`Failed to verify client: ${profileError.message}`);
      }

      if (clientProfile.assigned_broker !== user?.id) {
        throw new Error('You are not assigned to this client');
      }

      // Verify broker has broker role
      const { data: brokerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      console.log('Broker roles:', brokerRoles, 'Error:', rolesError);

      if (rolesError) {
        throw new Error(`Failed to verify broker role: ${rolesError.message}`);
      }

      const hasBrokerRole = brokerRoles?.some(r => r.role === 'broker' || r.role === 'super_admin');
      if (!hasBrokerRole) {
        throw new Error('You do not have broker permissions');
      }

      // Create the deal
      const { data: dealData, error: dealError } = await supabase
        .from("deals")
        .insert({
          user_id: selectedClientId,
          created_by_user_id: user?.id,
          name: dealName,
          type: selectedType,
          amount: amount ? parseFloat(amount) : null,
          status: "new_case",
        })
        .select()
        .single();

      console.log('Deal creation result:', dealData, 'Error:', dealError);

      if (dealError) {
        throw new Error(`Failed to create deal: ${dealError.message}`);
      }

      // Add broker as participant
      const { error: participantError } = await supabase
        .from("deal_participants")
        .insert({
          deal_id: dealData.id,
          user_id: user?.id,
          assigned_by: user?.id,
          role: "broker",
        });

      console.log('Broker participant error:', participantError);

      if (participantError) {
        throw new Error(`Failed to add broker as participant: ${participantError.message}`);
      }

      // Add client as participant
      const { error: clientParticipantError } = await supabase
        .from("deal_participants")
        .insert({
          deal_id: dealData.id,
          user_id: selectedClientId,
          assigned_by: user?.id,
          role: "client",
        });

      console.log('Client participant error:', clientParticipantError);

      if (clientParticipantError) {
        throw new Error(`Failed to add client as participant: ${clientParticipantError.message}`);
      }

      console.log('Deal created successfully:', dealData);
      return dealData;
    },
    onSuccess: () => {
      toast.success("Deal created successfully");
      queryClient.invalidateQueries({ queryKey: ["broker-deals"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create deal");
    },
  });

  const resetForm = () => {
    setSelectedClientId("");
    setClientEmail("");
    setSelectedType(null);
    setDealName("");
    setAmount("");
    setDescription("");
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients?.find((c) => c.id === clientId);
    if (client) {
      setClientEmail(client.email);
    }
  };

  const handleSubmit = () => {
    createDealMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl">Create Deal for Client</DialogTitle>
        </DialogHeader>

        <div ref={formRef} className="space-y-6 overflow-y-auto flex-1 -mx-6 px-6">
          {/* Client Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select Client</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select value={selectedClientId} onValueChange={handleClientChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name} ({client.deal_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Client Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Loan Type Selection */}
          {selectedClientId && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select Finance Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loanTypes.map((loanType) => {
                  const IconComponent = loanType.icon;
                  const isSelected = selectedType === loanType.type;
                  
                  return (
                    <Card
                      key={loanType.type}
                      className={`cursor-pointer transition-all border-2 ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedType(loanType.type)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <IconComponent className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{loanType.label}</h4>
                            <p className="text-sm text-muted-foreground">{loanType.description}</p>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-background rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deal Details */}
          {selectedType && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Deal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dealName">Deal Name *</Label>
                  <Input
                    id="dealName"
                    placeholder="e.g., High Street Property Purchase"
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Funding Amount (£)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="500000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Additional Details (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any additional details to help the client understand the deal..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
        </div>
        
        <div className="flex space-x-3 pt-4 border-t flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedClientId || !selectedType || !dealName || createDealMutation.isPending}
            className="flex-1"
          >
            {createDealMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Deal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
