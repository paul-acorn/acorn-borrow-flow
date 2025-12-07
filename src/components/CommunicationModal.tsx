import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CommunicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId?: string;
  defaultType?: 'call' | 'email' | 'message' | 'sms' | 'whatsapp';
  phoneNumber?: string;
}

export function CommunicationModal({ 
  open, 
  onOpenChange, 
  dealId, 
  defaultType = 'call',
  phoneNumber 
}: CommunicationModalProps) {
  const [formData, setFormData] = useState({
    type: defaultType,
    phone_number: phoneNumber || "",
    email_address: "",
    direction: "outbound",
    status: "completed",
    duration_minutes: 0,
    duration_seconds: 0,
    subject: "",
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealId) {
      toast({
        title: "Error",
        description: "Deal ID is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const totalSeconds = (formData.duration_minutes * 60) + formData.duration_seconds;

      // For SMS/WhatsApp, send via edge function
      if ((formData.type === 'sms' || formData.type === 'whatsapp') && formData.phone_number && formData.content) {
        const { error: sendError } = await supabase.functions.invoke('send-sms', {
          body: {
            to: formData.phone_number,
            message: formData.content,
            dealId,
            channel: formData.type,
          },
        });

        if (sendError) throw sendError;
      } else {
        // Log other communication types normally
        const { error } = await supabase.from("communication_logs").insert({
          deal_id: dealId,
          user_id: user.id,
          communication_type: formData.type,
          direction: formData.direction,
          phone_number: formData.phone_number || null,
          email_address: formData.email_address || null,
          status: formData.status,
          duration_seconds: formData.type === 'call' ? totalSeconds : null,
          subject: formData.subject || null,
          content: formData.content || null,
        });

        if (error) throw error;
      }

      // Log activity
      await supabase.from("deal_activity_logs").insert({
        deal_id: dealId,
        user_id: user.id,
        action: `${formData.type}_logged`,
        details: {
          type: formData.type,
          direction: formData.direction,
          phone_number: formData.phone_number,
          email_address: formData.email_address,
          status: formData.status,
        },
      });

      toast({
        title: "Success",
        description: `${formData.type.toUpperCase()} logged successfully`,
      });

      onOpenChange(false);
      setFormData({
        type: defaultType,
        phone_number: "",
        email_address: "",
        direction: "outbound",
        status: "completed",
        duration_minutes: 0,
        duration_seconds: 0,
        subject: "",
        content: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Communication</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.type === 'call' || formData.type === 'sms' || formData.type === 'whatsapp') && (
              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  inputMode="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  required
                  placeholder="+44..."
                />
              </div>
            )}

            {formData.type === 'email' && (
              <div>
                <Label htmlFor="email_address">Email Address</Label>
                <Input
                  id="email_address"
                  type="email"
                  value={formData.email_address}
                  onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="direction">Direction</Label>
              <Select
                value={formData.direction}
                onValueChange={(value) => setFormData({ ...formData, direction: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'call' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    min="0"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="duration_seconds">Seconds</Label>
                  <Input
                    id="duration_seconds"
                    type="number"
                    min="0"
                    max="59"
                    value={formData.duration_seconds}
                    onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}

            {(formData.type === 'email' || formData.type === 'message') && (
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
            )}

            <div>
              <Label htmlFor="content">
                {formData.type === 'call' ? 'Notes' : 
                 formData.type === 'sms' || formData.type === 'whatsapp' ? 'Message' : 
                 'Content'}
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={
                  formData.type === 'call' ? 'Call notes and key points discussed' :
                  formData.type === 'sms' || formData.type === 'whatsapp' ? 'Message to send' :
                  'Message content'
                }
                rows={4}
                required={formData.type === 'sms' || formData.type === 'whatsapp'}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : 
               formData.type === 'sms' || formData.type === 'whatsapp' ? 'Send & Log' : 
               'Log Communication'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
