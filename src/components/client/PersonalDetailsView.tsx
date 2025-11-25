import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { User, Home, Calendar, Edit } from "lucide-react";
import { PersonalDetailsEditModal } from "./PersonalDetailsEditModal";

export function PersonalDetailsView() {
  const { user } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: personalDetails, isLoading: loadingPersonal } = useQuery({
    queryKey: ['client-personal-details', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_personal_details')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: addresses, isLoading: loadingAddresses } = useQuery({
    queryKey: ['client-addresses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_current', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (loadingPersonal || loadingAddresses) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Personal Information</CardTitle>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditModalOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardHeader>
        <CardContent className="space-y-4">
          {personalDetails ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{personalDetails.title || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{personalDetails.dob ? new Date(personalDetails.dob).toLocaleDateString() : 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nationality</p>
                <p className="font-medium">{personalDetails.nationality || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marital Status</p>
                <p className="font-medium capitalize">{personalDetails.marital_status?.replace(/_/g, ' ') || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dependents</p>
                <p className="font-medium">{personalDetails.dependents || 0}</p>
              </div>
              {personalDetails.dependent_ages && (
                <div>
                  <p className="text-sm text-muted-foreground">Dependent Ages</p>
                  <p className="font-medium">{personalDetails.dependent_ages}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">National Insurance Number</p>
                <p className="font-medium">{personalDetails.ni_number || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Residence Status</p>
                <p className="font-medium capitalize">{personalDetails.residence?.replace(/_/g, ' ') || 'Not provided'}</p>
              </div>
              {personalDetails.residence === 'visa_holder' && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Visa Type</p>
                    <p className="font-medium">{personalDetails.visa_type || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Visa Expiry</p>
                    <p className="font-medium">{personalDetails.visa_expiry ? new Date(personalDetails.visa_expiry).toLocaleDateString() : 'Not provided'}</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No personal details recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Address History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <CardTitle>Address History</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditModalOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {addresses && addresses.length > 0 ? (
            addresses.map((address) => (
              <div key={address.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {address.property_number} {address.street}
                  </p>
                  {address.is_current && (
                    <Badge variant="default">Current</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {address.city}, {address.postcode}
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {address.date_moved_in && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Moved in: {new Date(address.date_moved_in).toLocaleDateString()}
                    </div>
                  )}
                  {address.date_moved_out && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Moved out: {new Date(address.date_moved_out).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No address history recorded yet.</p>
          )}
        </CardContent>
      </Card>
      </div>

      <PersonalDetailsEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        personalDetails={personalDetails}
      />
    </>
  );
}
