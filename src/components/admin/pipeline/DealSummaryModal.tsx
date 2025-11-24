import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, DollarSign, User, FileText, ExternalLink, MessageSquare, Phone } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useDealStatusChange } from "@/hooks/useDealStatusChange";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type DealStatus = Database["public"]["Enums"]["deal_status"];

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

interface DealSummaryModalProps {
  deal: Deal | null;
  profile?: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewFullDetails: () => void;
}

const LOAN_TYPE_LABELS: Record<string, string> = {
  bridging: "Bridging Finance",
  mortgage: "Mortgage",
  development: "Development Finance",
  business: "Business Loan",
  factoring: "Factoring",
  asset: "Asset Finance",
  mca: "MCA",
  equity: "Equity Release",
};

const STATUS_LABELS: Record<string, string> = {
  new_case: "New Case",
  awaiting_dip: "Awaiting DIP",
  dip_approved: "DIP Approved",
  reports_instructed: "Reports Instructed",
  final_underwriting: "Final Underwriting",
  offered: "Offered",
  with_solicitors: "With Solicitors",
  completed: "Completed",
};

export function DealSummaryModal({ deal, profile, open, onOpenChange, onViewFullDetails }: DealSummaryModalProps) {
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const updateStatusMutation = useDealStatusChange();
  
  if (!deal) return null;

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Not specified";
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleStatusChange = async (newStatus: DealStatus) => {
    await updateStatusMutation.mutateAsync({
      dealId: deal.id,
      oldStatus: deal.status as DealStatus,
      newStatus,
    });
  };

  const handleAddNote = async () => {
    if (!note.trim()) {
      toast.error("Please enter a note");
      return;
    }

    setIsAddingNote(true);
    try {
      await supabase.from("deal_activity_logs").insert({
        deal_id: deal.id,
        user_id: user?.id,
        action: "note_added",
        details: { note: note.trim() },
      });

      toast.success("Note added successfully");
      setNote("");
    } catch (error) {
      toast.error("Failed to add note");
      console.error(error);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleLogCall = async () => {
    if (!note.trim()) {
      toast.error("Please enter call details");
      return;
    }

    setIsAddingNote(true);
    try {
      await supabase.from("deal_activity_logs").insert({
        deal_id: deal.id,
        user_id: user?.id,
        action: "call_logged",
        details: { notes: note.trim() },
      });

      toast.success("Call logged successfully");
      setNote("");
    } catch (error) {
      toast.error("Failed to log call");
      console.error(error);
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deal Summary</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Deal Name and Status */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{deal.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{LOAN_TYPE_LABELS[deal.type] || deal.type}</Badge>
              <Badge>{STATUS_LABELS[deal.status] || deal.status}</Badge>
            </div>
          </div>

          <Separator />

          {/* Client Information */}
          {profile && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium">Client</span>
              </div>
              <div className="ml-6 space-y-1">
                <div className="font-medium">
                  {profile.first_name} {profile.last_name}
                </div>
                <div className="text-sm text-muted-foreground">{profile.email}</div>
                {profile.deal_code && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Deal Code: </span>
                    <span className="font-mono">{profile.deal_code}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deal Amount */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">Amount</span>
            </div>
            <div className="ml-6 text-2xl font-bold text-primary">
              {formatCurrency(deal.amount)}
            </div>
          </div>

          {/* Created Date */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Created</span>
            </div>
            <div className="ml-6 text-sm">
              {format(new Date(deal.created_at), "PPP")}
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Quick Actions</h4>
            
            {/* Status Change */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Change Status</label>
              <Select
                value={deal.status}
                onValueChange={handleStatusChange}
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_case">New Case</SelectItem>
                  <SelectItem value="awaiting_dip">Awaiting DIP</SelectItem>
                  <SelectItem value="dip_approved">DIP Approved</SelectItem>
                  <SelectItem value="reports_instructed">Reports Instructed</SelectItem>
                  <SelectItem value="final_underwriting">Final Underwriting</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="with_solicitors">With Solicitors</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Add Note/Call */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Add Note or Log Call</label>
              <Textarea
                placeholder="Enter note or call details..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleAddNote}
                  disabled={isAddingNote || !note.trim()}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Add Note
                </Button>
                <Button
                  onClick={handleLogCall}
                  disabled={isAddingNote || !note.trim()}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Log Call
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* View Full Details Button */}
          <Button
            onClick={onViewFullDetails}
            className="w-full"
            size="lg"
          >
            <FileText className="h-4 w-4 mr-2" />
            View Full Details
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
