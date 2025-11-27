import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface PersonalDetailsEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personalDetails: any;
}

export function PersonalDetailsEditModal({ open, onOpenChange, personalDetails }: PersonalDetailsEditModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [residence, setResidence] = useState(personalDetails?.residence || '');

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Update profile names if changed
    const firstName = formData.get('first_name') as string;
    const lastName = formData.get('last_name') as string;
    if (firstName || lastName) {
      await supabase
        .from('profiles')
        .update({
          first_name: firstName || profile?.first_name,
          last_name: lastName || profile?.last_name,
        })
        .eq('id', user?.id);
    }
    
    const data = {
      title: formData.get('title') as string,
      dob: formData.get('dob') as string || null,
      nationality: formData.get('nationality') as string || null,
      marital_status: formData.get('marital_status') as string || null,
      dependents: parseInt(formData.get('dependents') as string) || 0,
      dependent_ages: formData.get('dependent_ages') as string || null,
      ni_number: formData.get('ni_number') as string || null,
      residence: residence || null,
      visa_type: formData.get('visa_type') as string || null,
      visa_expiry: formData.get('visa_expiry') as string || null,
    };

    try {
      if (personalDetails) {
        await supabase
          .from('client_personal_details')
          .update(data)
          .eq('user_id', user?.id);
      } else {
        await supabase
          .from('client_personal_details')
          .insert({ ...data, user_id: user?.id });
      }
      
      toast.success("Personal details updated successfully");
      queryClient.invalidateQueries({ queryKey: ['client-personal-details'] });
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update personal details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Personal Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                name="first_name"
                defaultValue={profile?.first_name || ""}
                placeholder="First name"
              />
            </div>

            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                name="last_name"
                defaultValue={profile?.last_name || ""}
                placeholder="Last name"
              />
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Select name="title" defaultValue={personalDetails?.title || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mr">Mr</SelectItem>
                  <SelectItem value="Mrs">Mrs</SelectItem>
                  <SelectItem value="Miss">Miss</SelectItem>
                  <SelectItem value="Ms">Ms</SelectItem>
                  <SelectItem value="Dr">Dr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                defaultValue={personalDetails?.dob || ""}
              />
            </div>

            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                name="nationality"
                defaultValue={personalDetails?.nationality || ""}
              />
            </div>

            <div>
              <Label htmlFor="marital_status">Marital Status</Label>
              <Select name="marital_status" defaultValue={personalDetails?.marital_status || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                  <SelectItem value="civil_partnership">Civil Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dependents">Number of Dependents</Label>
              <Input
                id="dependents"
                name="dependents"
                type="number"
                min="0"
                defaultValue={personalDetails?.dependents || 0}
              />
            </div>

            <div>
              <Label htmlFor="dependent_ages">Dependent Ages</Label>
              <Input
                id="dependent_ages"
                name="dependent_ages"
                placeholder="e.g., 5, 8, 12"
                defaultValue={personalDetails?.dependent_ages || ""}
              />
            </div>

            <div>
              <Label htmlFor="ni_number">National Insurance Number</Label>
              <Input
                id="ni_number"
                name="ni_number"
                defaultValue={personalDetails?.ni_number || ""}
              />
            </div>

            <div>
              <Label htmlFor="residence">Residence Status</Label>
              <Select name="residence" value={residence} onValueChange={setResidence}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uk_citizen">UK Citizen</SelectItem>
                  <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                  <SelectItem value="visa_holder">Visa Holder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {residence === 'visa_holder' && (
              <>
                <div>
                  <Label htmlFor="visa_type">Visa Type</Label>
                  <Input
                    id="visa_type"
                    name="visa_type"
                    defaultValue={personalDetails?.visa_type || ""}
                  />
                </div>

                <div>
                  <Label htmlFor="visa_expiry">Visa Expiry</Label>
                  <Input
                    id="visa_expiry"
                    name="visa_expiry"
                    type="date"
                    defaultValue={personalDetails?.visa_expiry || ""}
                  />
                </div>
              </>
            )}
          </div>

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
