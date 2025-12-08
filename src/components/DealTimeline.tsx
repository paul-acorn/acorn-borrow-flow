import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Send, MessageSquare, Loader2 } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: string;
  type: string;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

interface DealTimelineProps {
  dealId: string;
  maxHeight?: string;
}

export function DealTimeline({ dealId, maxHeight = "400px" }: DealTimelineProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch messages for this deal
  const { data: messages, isLoading } = useQuery({
    queryKey: ["deal-messages", dealId],
    queryFn: async () => {
      // First get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      // Get unique sender IDs that look like UUIDs
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const senderIds = [...new Set(
        (messagesData || [])
          .map(m => m.sender)
          .filter(s => uuidPattern.test(s))
      )];

      // Fetch profiles for those senders
      let profilesMap: Record<string, any> = {};
      if (senderIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", senderIds);

        if (profilesData) {
          profilesMap = profilesData.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Attach profiles to messages
      return (messagesData || []).map(msg => ({
        ...msg,
        profiles: profilesMap[msg.sender] || null,
      }));
    },
    enabled: !!dealId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!dealId) return;

    const channel = supabase
      .channel(`deal-messages-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["deal-messages", dealId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, queryClient]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handlePostMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setIsPosting(true);
    try {
      const { error } = await supabase.from("messages").insert({
        deal_id: dealId,
        content: newMessage.trim(),
        sender: user.id,
        type: "message",
      });

      if (error) throw error;

      // Log activity
      await supabase.from("deal_activity_logs").insert({
        deal_id: dealId,
        user_id: user.id,
        action: "message_sent",
        details: { preview: newMessage.trim().substring(0, 50) },
      });

      setNewMessage("");
      toast({
        title: "Message Posted",
        description: "Your update has been posted to the timeline.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post message",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePostMessage();
    }
  };

  const getInitials = (message: Message) => {
    if (message.profiles?.first_name || message.profiles?.last_name) {
      return `${message.profiles.first_name?.[0] || ""}${message.profiles.last_name?.[0] || ""}`.toUpperCase();
    }
    return message.sender.substring(0, 2).toUpperCase();
  };

  const getSenderName = (message: Message) => {
    if (message.profiles?.first_name || message.profiles?.last_name) {
      return `${message.profiles.first_name || ""} ${message.profiles.last_name || ""}`.trim();
    }
    return message.sender;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Communication Feed</h4>
      </div>

      {/* Messages Area */}
      <ScrollArea 
        className="flex-1 pr-4" 
        style={{ maxHeight }}
        ref={scrollRef}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender === user?.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(message)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex-1 min-w-0 ${isOwnMessage ? "text-right" : ""}`}>
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      <span className={`text-sm font-medium ${isOwnMessage ? "order-2" : ""}`}>
                        {getSenderName(message)}
                      </span>
                      <span className={`text-xs text-muted-foreground ${isOwnMessage ? "order-1" : ""}`}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div
                      className={`inline-block p-3 rounded-lg max-w-[85%] ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start the conversation by posting an update
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="mt-4 pt-4 border-t space-y-2">
        <Textarea
          placeholder="Type your message... (Press Enter to send)"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[80px] resize-none"
          disabled={isPosting}
        />
        <Button
          onClick={handlePostMessage}
          disabled={!newMessage.trim() || isPosting}
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
              Post Update
            </>
          )}
        </Button>
      </div>
    </div>
  );
}