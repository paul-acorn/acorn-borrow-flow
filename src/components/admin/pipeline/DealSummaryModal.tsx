import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, User, FileText, ExternalLink, MessageSquare, Phone, Clock, Upload, ArrowRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDealStatusChange } from "@/hooks/useDealStatusChange";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { DealTimeline } from "@/components/DealTimeline";
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
  const { user, hasRole } = useAuth();
  const [note, setNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const updateStatusMutation = useDealStatusChange();
  
  // Check if user can change status (brokers, admins, super_admins - not clients)
  const canChangeStatus = hasRole('broker') || hasRole('admin') || hasRole('super_admin') || hasRole('team_member');
  
  // Fetch recent activity logs
  const { data: activityLogs } = useQuery({
    queryKey: ["deal-activity-logs", deal?.id],
    queryFn: async () => {
      if (!deal?.id) return [];
      
      const { data, error } = await supabase
        .from("deal_activity_logs")
        .select("*, profiles:user_id(first_name, last_name)")
        .eq("deal_id", deal.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!deal?.id,
  });
  
  if (!deal) return null;

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "status_change":
        return <ArrowRight className="h-3 w-3" />;
      case "note_added":
        return <MessageSquare className="h-3 w-3" />;
      case "call_logged":
        return <Phone className="h-3 w-3" />;
      case "document_uploaded":
        return <Upload className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getActivityDescription = (log: any) => {
    const userName = log.profiles ? `${log.profiles.first_name} ${log.profiles.last_name}` : "Someone";
    
    switch (log.action) {
      case "status_change":
        return `${userName} changed status from ${STATUS_LABELS[log.details?.from] || log.details?.from} to ${STATUS_LABELS[log.details?.to] || log.details?.to}`;
      case "note_added":
        return `${userName} added a note: "${log.details?.note?.substring(0, 50)}${log.details?.note?.length > 50 ? '...' : ''}"`;
      case "call_logged":
        return `${userName} logged a call`;
      case "document_uploaded":
        return `${userName} uploaded a document`;
      default:
        return `${userName} performed ${log.action}`;
    }
  };

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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Deal Summary</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
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

          {/* Recent Activity Timeline */}
          {activityLogs && activityLogs.length > 0 && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Recent Activity</h4>
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {getActivityIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {getActivityDescription(log)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{canChangeStatus ? "Quick Actions" : "Deal Status"}</h4>
            
            {/* Status Change */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                {canChangeStatus ? "Change Status" : "Current Status"}
              </label>
              <Select
                value={deal.status}
                onValueChange={handleStatusChange}
                disabled={!canChangeStatus || updateStatusMutation.isPending}
              >
                <SelectTrigger className={!canChangeStatus ? "cursor-default opacity-70" : ""}>
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

            {/* Add Note/Call - Only show for staff */}
            {canChangeStatus && (
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
            )}
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
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <div className="h-[500px]">
              <DealTimeline dealId={deal.id} maxHeight="450px" />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
