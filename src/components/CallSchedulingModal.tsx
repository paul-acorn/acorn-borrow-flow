import { useState, useEffect, useRef } from "react";
import { useFormNavigation } from "@/hooks/useFormNavigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface CallSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId?: string;
  clientId?: string;
  onScheduled?: () => void;
}

export const CallSchedulingModal = ({ isOpen, onClose, dealId, clientId, onScheduled }: CallSchedulingModalProps) => {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const formRef = useRef<HTMLDivElement>(null);
  
  useFormNavigation(formRef, {
    onSubmit: () => {
      if (formData.scheduled_with && formData.title && formData.scheduled_time) {
        const form = formRef.current?.closest('form');
        if (form) {
          form.requestSubmit();
        }
      }
    },
    canSubmit: () => !!(formData.scheduled_with && formData.title && formData.scheduled_time) && !loading
  });
  
  const [formData, setFormData] = useState({
    scheduled_with: clientId || "",
    deal_id: dealId || "",
    title: "",
    notes: "",
    scheduled_date: new Date(),
    scheduled_time: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadClientsAndDeals();
    }
  }, [isOpen]);

  const loadClientsAndDeals = async () => {
    try {
      if (hasRole('broker')) {
        // Load broker's clients
        const { data: clientsData, error: clientError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("assigned_broker", user?.id);
        
        if (clientError) throw clientError;
        setClients(clientsData || []);

        // Load broker's deals
        const { data: dealsData, error: dealError } = await supabase
          .from("deals")
          .select(`
            id,
            name,
            profiles:profiles!deals_user_id_fkey (
              first_name,
              last_name
            )
          `)
          .eq("profiles.assigned_broker", user?.id);
        
        if (dealError) throw dealError;
        setDeals(dealsData || []);
      } else if (hasRole('client')) {
        // Load client's broker
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("assigned_broker")
          .eq("id", user?.id)
          .single();
        
        if (profileError) throw profileError;

        if (profile?.assigned_broker) {
          // Fetch the broker details separately
          const { data: brokerData, error: brokerError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, email")
            .eq("id", profile.assigned_broker)
            .single();
          
          if (brokerError) throw brokerError;
          if (brokerData) {
            setClients([brokerData]);
          }
        }

        // Load client's deals
        const { data: dealsData, error: dealError } = await supabase
          .from("deals")
          .select("id, name")
          .eq("user_id", user?.id);
        
        if (dealError) throw dealError;
        setDeals(dealsData || []);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(error.message || "Failed to load data");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const scheduledDateTime = new Date(formData.scheduled_date);
      const [hours, minutes] = formData.scheduled_time.split(":");
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

      const { error } = await supabase
        .from("scheduled_callbacks")
        .insert({
          scheduled_by: user?.id,
          scheduled_with: formData.scheduled_with,
          deal_id: formData.deal_id || null,
          title: formData.title,
          notes: formData.notes,
          scheduled_at: scheduledDateTime.toISOString(),
          status: "pending"
        });

      if (error) throw error;

      toast.success("Callback scheduled successfully");
      onScheduled?.();
      onClose();
      
      // Reset form
      setFormData({
        scheduled_with: clientId || "",
        deal_id: dealId || "",
        title: "",
        notes: "",
        scheduled_date: new Date(),
        scheduled_time: "",
      });
    } catch (error: any) {
      console.error("Error scheduling callback:", error);
      toast.error(error.message || "Failed to schedule callback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Callback</DialogTitle>
          <DialogDescription>
            Schedule a callback appointment with a {hasRole('client') ? 'broker' : 'client'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div ref={formRef} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scheduled_with">
              {hasRole('client') ? 'Broker' : 'Client'} *
            </Label>
            {clients.length === 0 ? (
              <div className="p-4 rounded-md bg-muted text-sm text-muted-foreground">
                {hasRole('client') 
                  ? 'No broker assigned yet. Please contact support.'
                  : 'No clients available. Add clients first.'}
              </div>
            ) : (
              <Select
                value={formData.scheduled_with}
                onValueChange={(value) => setFormData({ ...formData, scheduled_with: value })}
                disabled={!!clientId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${hasRole('client') ? 'broker' : 'client'}`} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal_id">Deal (Optional)</Label>
            <Select
              value={formData.deal_id}
              onValueChange={(value) => setFormData({ ...formData, deal_id: value })}
              disabled={!!dealId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select deal (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No deal</SelectItem>
                {deals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Follow-up call, Document review"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.scheduled_date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.scheduled_date}
                  onSelect={(date) => date && setFormData({ ...formData, scheduled_date: date })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_time">Time *</Label>
            <Input
              id="scheduled_time"
              type="time"
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Scheduling..." : "Schedule Callback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
