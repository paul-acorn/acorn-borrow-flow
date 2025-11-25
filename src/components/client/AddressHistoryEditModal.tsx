import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface AddressHistoryEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addresses: any[];
}

export function AddressHistoryEditModal({ open, onOpenChange, addresses }: AddressHistoryEditModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  
  const [addressList, setAddressList] = useState<Array<{
    id?: string;
    propertyNumber: string;
    street: string;
    city: string;
    postcode: string;
    dateMovedIn: string;
    dateMovedOut: string;
    isCurrent: boolean;
  }>>(
    addresses.length > 0
      ? addresses.map(a => ({
          id: a.id,
          propertyNumber: a.property_number || '',
          street: a.street || '',
          city: a.city || '',
          postcode: a.postcode || '',
          dateMovedIn: a.date_moved_in || '',
          dateMovedOut: a.date_moved_out || '',
          isCurrent: a.is_current || false,
        }))
      : [{ propertyNumber: '', street: '', city: '', postcode: '', dateMovedIn: '', dateMovedOut: '', isCurrent: true }]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate date ranges
    for (let i = 0; i < addressList.length; i++) {
      const address = addressList[i];
      if (address.dateMovedIn && address.dateMovedOut && !address.isCurrent) {
        const movedIn = new Date(address.dateMovedIn);
        const movedOut = new Date(address.dateMovedOut);
        if (movedOut <= movedIn) {
          toast.error(`Address ${i + 1}: Move out date must be after move in date`);
          return;
        }
      }
    }
    
    setLoading(true);

    try {
      // Delete existing addresses
      await supabase
        .from('client_addresses')
        .delete()
        .eq('user_id', user?.id);

      // Insert new addresses
      const addressData = addressList
        .filter(a => a.street)
        .map(a => ({
          user_id: user?.id,
          property_number: a.propertyNumber || null,
          street: a.street,
          city: a.city || null,
          postcode: a.postcode || null,
          date_moved_in: a.dateMovedIn || null,
          date_moved_out: a.dateMovedOut || null,
          is_current: a.isCurrent,
        }));

      if (addressData.length > 0) {
        await supabase.from('client_addresses').insert(addressData);
      }

      toast.success("Address history updated successfully");
      queryClient.invalidateQueries({ queryKey: ['client-addresses'] });
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update address history");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addAddress = () => {
    setAddressList([
      ...addressList,
      { propertyNumber: '', street: '', city: '', postcode: '', dateMovedIn: '', dateMovedOut: '', isCurrent: false }
    ]);
  };

  const removeAddress = (index: number) => {
    setAddressList(addressList.filter((_, i) => i !== index));
  };

  const updateAddress = (index: number, field: string, value: any) => {
    const updated = [...addressList];
    (updated[index] as any)[field] = value;
    setAddressList(updated);
  };

  // Calculate total years of address history from earliest address to now
  const calculateTotalYears = () => {
    const validAddresses = addressList.filter(a => a.dateMovedIn && a.street);
    if (validAddresses.length === 0) return 0;
    
    const now = new Date();
    
    // Find the earliest move-in date
    const earliestDate = validAddresses.reduce((earliest, address) => {
      const movedIn = new Date(address.dateMovedIn);
      return movedIn < earliest ? movedIn : earliest;
    }, new Date(validAddresses[0].dateMovedIn));
    
    // Calculate years from earliest address to now
    const diffMs = now.getTime() - earliestDate.getTime();
    const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    
    return diffYears;
  };

  const needsPreviousAddress = calculateTotalYears() < 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Address History</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {addressList.map((address, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Address {index + 1}</Label>
                  <Switch
                    checked={address.isCurrent}
                    onCheckedChange={(checked) => updateAddress(index, 'isCurrent', checked)}
                  />
                  <span className="text-sm text-muted-foreground">Current Address</span>
                </div>
                {addressList.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAddress(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`property_${index}`}>Property Number</Label>
                  <Input
                    id={`property_${index}`}
                    value={address.propertyNumber}
                    onChange={(e) => updateAddress(index, 'propertyNumber', e.target.value)}
                    placeholder="e.g., 123"
                  />
                </div>
                <div>
                  <Label htmlFor={`street_${index}`}>Street *</Label>
                  <Input
                    id={`street_${index}`}
                    value={address.street}
                    onChange={(e) => updateAddress(index, 'street', e.target.value)}
                    placeholder="Street name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`city_${index}`}>City</Label>
                  <Input
                    id={`city_${index}`}
                    value={address.city}
                    onChange={(e) => updateAddress(index, 'city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor={`postcode_${index}`}>Postcode</Label>
                  <Input
                    id={`postcode_${index}`}
                    value={address.postcode}
                    onChange={(e) => updateAddress(index, 'postcode', e.target.value)}
                    placeholder="Postcode"
                  />
                </div>
                <div>
                  <Label htmlFor={`moved_in_${index}`}>Date Moved In</Label>
                  <Input
                    id={`moved_in_${index}`}
                    type="date"
                    value={address.dateMovedIn}
                    onChange={(e) => updateAddress(index, 'dateMovedIn', e.target.value)}
                  />
                </div>
                {!address.isCurrent && (
                  <div>
                    <Label htmlFor={`moved_out_${index}`}>Date Moved Out</Label>
                    <Input
                      id={`moved_out_${index}`}
                      type="date"
                      value={address.dateMovedOut}
                      onChange={(e) => updateAddress(index, 'dateMovedOut', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {needsPreviousAddress && (
            <Button type="button" variant="outline" onClick={addAddress} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Previous Address
            </Button>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
