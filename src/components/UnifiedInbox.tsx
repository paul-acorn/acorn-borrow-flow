import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MessageSquare, Clock, User, Reply } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CommunicationLog {
  id: string;
  deal_id: string;
  communication_type: string;
  direction: string;
  subject: string | null;
  content: string | null;
  duration_seconds: number | null;
  phone_number: string | null;
  email_address: string | null;
  status: string;
  created_at: string;
  deals: {
    name: string;
    user_id: string;
  };
}

export function UnifiedInbox({ brokerFilter }: { brokerFilter?: string }) {
  const [communications, setCommunications] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCommunications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("communication_logs_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "communication_logs",
        },
        () => {
          fetchCommunications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [brokerFilter]);

  const fetchCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from("communication_logs")
        .select(`
          *,
          deals (
            name,
            user_id,
            profiles:profiles!deals_user_id_fkey (
              assigned_broker
            )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Filter by broker if brokerFilter is provided
      let filteredData = data || [];
      if (brokerFilter) {
        filteredData = filteredData.filter((comm: any) => 
          comm.deals?.profiles?.assigned_broker === brokerFilter
        );
      }
      
      setCommunications(filteredData);
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

  const getIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "message":
      case "sms":
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "missed":
        return "bg-red-500";
      case "failed":
        return "bg-red-500";
      case "scheduled":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleReply = async (comm: CommunicationLog) => {
    if (!replyText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const channel = comm.communication_type === 'whatsapp' ? 'whatsapp' : 'sms';
      
      const { error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: comm.phone_number,
          message: replyText,
          dealId: comm.deal_id,
          channel: channel,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${channel.toUpperCase()} sent successfully`,
      });

      setReplyText("");
      setReplyingTo(null);
      fetchCommunications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const filteredCommunications = communications.filter((comm) => {
    if (filter === "all") return true;
    return comm.communication_type === filter;
  });

  if (loading) {
    return <div>Loading communications...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Unified Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="call">Calls</TabsTrigger>
            <TabsTrigger value="email">Emails</TabsTrigger>
            <TabsTrigger value="message">Messages</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>

            <TabsContent value={filter} className="mt-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredCommunications.map((comm) => (
                    <Card key={comm.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">{getIcon(comm.communication_type)}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{comm.deals?.name}</h4>
                                <Badge variant={comm.direction === "inbound" ? "default" : "secondary"}>
                                  {comm.direction}
                                </Badge>
                                <Badge className={getStatusColor(comm.status)}>
                                  {comm.status}
                                </Badge>
                              </div>
                              {comm.subject && (
                                <p className="text-sm font-medium mb-1">{comm.subject}</p>
                              )}
                              {comm.content && (
                                <p className="text-sm text-muted-foreground">{comm.content}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                {comm.phone_number && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <a href={`tel:${comm.phone_number}`} className="hover:underline">
                                      {comm.phone_number}
                                    </a>
                                  </span>
                                )}
                                {comm.email_address && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {comm.email_address}
                                  </span>
                                )}
                                {comm.duration_seconds && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {Math.floor(comm.duration_seconds / 60)}m {comm.duration_seconds % 60}s
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(comm.created_at), "MMM d, yyyy h:mm a")}
                                </span>
                              </div>
                            </div>
                          </div>
                          {(comm.communication_type === 'sms' || comm.communication_type === 'whatsapp') && 
                           comm.phone_number && (
                            <div className="mt-3">
                              {replyingTo === comm.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    placeholder="Type your reply..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    rows={3}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleReply(comm)}
                                      disabled={sending}
                                    >
                                      {sending ? "Sending..." : "Send"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyText("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setReplyingTo(comm.id)}
                                >
                                  <Reply className="h-3 w-3 mr-1" />
                                  Reply
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredCommunications.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No communications found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
