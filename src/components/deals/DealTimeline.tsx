import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  Send,
  MessageSquare,
  Loader2,
  FileText,
  ArrowRight,
  Phone,
  Mail,
  MessageCircle,
  StickyNote,
} from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "note" | "status_change" | "document" | "call" | "email" | "sms";
  content: string;
  created_at: string;
  user_id: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  metadata?: Record<string, any>;
}

interface DealTimelineProps {
  dealId: string;
}

const DealTimeline = ({ dealId }: DealTimelineProps) => {
  const [newNote, setNewNote] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch timeline events (communication_logs + deal_activity_logs)
  const { data: events, isLoading } = useQuery({
    queryKey: ["deal-timeline", dealId],
    queryFn: async () => {
      // Fetch communication logs
      const { data: commLogs, error: commError } = await supabase
        .from("communication_logs")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });

      if (commError) throw commError;

      // Fetch activity logs (status changes, document uploads)
      const { data: activityLogs, error: activityError } = await supabase
        .from("deal_activity_logs")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });

      if (activityError) throw activityError;

      // Get unique user IDs
      const userIds = [
        ...new Set([
          ...(commLogs || []).map((l) => l.user_id),
          ...(activityLogs || []).map((l) => l.user_id),
        ]),
      ].filter(Boolean);

      // Fetch user profiles
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", userIds);

        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Transform communication logs to timeline events
      const commEvents: TimelineEvent[] = (commLogs || []).map((log) => ({
        id: log.id,
        type: mapCommType(log.communication_type),
        content: log.content || log.subject || `${log.communication_type} communication`,
        created_at: log.created_at,
        user_id: log.user_id,
        user: profilesMap[log.user_id] || null,
        metadata: {
          direction: log.direction,
          status: log.status,
          phone_number: log.phone_number,
          email_address: log.email_address,
        },
      }));

      // Transform activity logs to timeline events
      const activityEvents: TimelineEvent[] = (activityLogs || []).map((log) => ({
        id: log.id,
        type: mapActivityType(log.action),
        content: formatActivityContent(log.action, log.details),
        created_at: log.created_at,
        user_id: log.user_id,
        user: profilesMap[log.user_id] || null,
        metadata: log.details as Record<string, any>,
      }));

      // Combine and sort by date (newest first)
      const allEvents = [...commEvents, ...activityEvents].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return allEvents;
    },
    enabled: !!dealId,
  });

  // Helper to map communication types
  function mapCommType(type: string): TimelineEvent["type"] {
    switch (type.toLowerCase()) {
      case "call":
        return "call";
      case "email":
        return "email";
      case "sms":
      case "whatsapp":
        return "sms";
      case "note":
        return "note";
      default:
        return "note";
    }
  }

  // Helper to map activity types
  function mapActivityType(action: string): TimelineEvent["type"] {
    if (action.includes("status")) return "status_change";
    if (action.includes("document") || action.includes("upload")) return "document";
    if (action.includes("message")) return "note";
    return "note";
  }

  // Helper to format activity content
  function formatActivityContent(action: string, details: any): string {
    const detailsObj = details as Record<string, any> | null;
    
    if (action === "status_changed" && detailsObj) {
      return `Status changed from "${formatStatus(detailsObj.old_status)}" to "${formatStatus(detailsObj.new_status)}"`;
    }
    if (action === "document_uploaded" && detailsObj) {
      return `Uploaded document: ${detailsObj.file_name || "file"}`;
    }
    if (action === "document_approved") {
      return "Document approved";
    }
    if (action === "document_rejected" && detailsObj) {
      return `Document rejected: ${detailsObj.reason || "No reason provided"}`;
    }
    if (action === "message_sent" && detailsObj) {
      return detailsObj.preview || "Posted an update";
    }
    return action.replace(/_/g, " ");
  }

  function formatStatus(status: string): string {
    return status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || status;
  }

  // Real-time subscription
  useEffect(() => {
    if (!dealId) return;

    const commChannel = supabase
      .channel(`deal-comm-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "communication_logs",
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["deal-timeline", dealId] });
        }
      )
      .subscribe();

    const activityChannel = supabase
      .channel(`deal-activity-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deal_activity_logs",
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["deal-timeline", dealId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [dealId, queryClient]);

  const handlePostNote = async () => {
    if (!newNote.trim() || !user) return;

    setIsPosting(true);
    try {
      const { error } = await supabase.from("communication_logs").insert({
        deal_id: dealId,
        user_id: user.id,
        communication_type: "note",
        direction: "internal",
        content: newNote.trim(),
        status: "completed",
      });

      if (error) throw error;

      setNewNote("");
      toast({
        title: "Note Posted",
        description: "Your note has been added to the timeline.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post note",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePostNote();
    }
  };

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <MessageCircle className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "status_change":
        return <ArrowRight className="h-4 w-4" />;
      case "note":
      default:
        return <StickyNote className="h-4 w-4" />;
    }
  };

  const getEventBadge = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "call":
        return <Badge variant="outline" className="text-xs">Call</Badge>;
      case "email":
        return <Badge variant="outline" className="text-xs">Email</Badge>;
      case "sms":
        return <Badge variant="outline" className="text-xs">SMS</Badge>;
      case "document":
        return <Badge variant="secondary" className="text-xs">Document</Badge>;
      case "status_change":
        return <Badge className="text-xs bg-primary/20 text-primary border-primary/30">Status</Badge>;
      case "note":
      default:
        return <Badge variant="secondary" className="text-xs">Note</Badge>;
    }
  };

  const getInitials = (event: TimelineEvent) => {
    if (event.user?.first_name || event.user?.last_name) {
      return `${event.user.first_name?.[0] || ""}${event.user.last_name?.[0] || ""}`.toUpperCase();
    }
    return "??";
  };

  const getUserName = (event: TimelineEvent) => {
    if (event.user?.first_name || event.user?.last_name) {
      return `${event.user.first_name || ""} ${event.user.last_name || ""}`.trim();
    }
    return "Unknown User";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Post Note Input (at the top for quick access) */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          <Textarea
            placeholder="Add a note... (Cmd/Ctrl + Enter to post)"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] resize-none"
            disabled={isPosting}
          />
          <Button
            onClick={handlePostNote}
            disabled={!newNote.trim() || isPosting}
            className="w-full"
            size="sm"
          >
            {isPosting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post Note
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Timeline Events */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : events && events.length > 0 ? (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="relative flex gap-4 pl-2">
                  {/* Icon dot on the timeline */}
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border shrink-0">
                    {getEventIcon(event.type)}
                  </div>

                  {/* Event content */}
                  <Card className="flex-1">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={event.user?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(event)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-medium">{getUserName(event)}</span>
                            {getEventBadge(event.type)}
                          </div>

                          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                            {event.content}
                          </p>

                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(event.created_at), "MMM d, yyyy 'at' h:mm a")}
                            {" • "}
                            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a note to start the conversation
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default DealTimeline;
