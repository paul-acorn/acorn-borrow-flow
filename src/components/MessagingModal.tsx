import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MessagingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  dealName: string;
  onSave?: (data: any) => void;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  created_at: string;
  type: string;
}

interface Requirement {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  priority: string;
}

export function MessagingModal({ open, onOpenChange, dealId, dealName, onSave }: MessagingModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  
  // Determine sender type based on user role
  const getSenderType = () => {
    if (hasRole('broker') || hasRole('admin') || hasRole('super_admin')) {
      return 'broker';
    }
    return 'client';
  };

  // Fetch messages and requirements
  useEffect(() => {
    if (!open || !dealId) return;

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        toast({
          title: "Error",
          description: "Failed to load messages.",
          variant: "destructive",
        });
      } else {
        setMessages(messagesData || []);
      }

      // Fetch requirements
      const { data: requirementsData, error: requirementsError } = await supabase
        .from('requirements')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: true });

      if (requirementsError) {
        console.error('Error fetching requirements:', requirementsError);
        toast({
          title: "Error",
          description: "Failed to load requirements.",
          variant: "destructive",
        });
      } else {
        setRequirements(requirementsData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [open, dealId, toast]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!open || !dealId) return;

    const channel = supabase
      .channel('deal-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `deal_id=eq.${dealId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requirements',
          filter: `deal_id=eq.${dealId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRequirements((prev) => [...prev, payload.new as Requirement]);
          } else if (payload.eventType === 'UPDATE') {
            setRequirements((prev) =>
              prev.map((req) => (req.id === payload.new.id ? (payload.new as Requirement) : req))
            );
          } else if (payload.eventType === 'DELETE') {
            setRequirements((prev) => prev.filter((req) => req.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, dealId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const senderType = getSenderType();
    
    const { error } = await supabase
      .from('messages')
      .insert({
        deal_id: dealId,
        sender: senderType,
        content: newMessage,
        type: 'message',
      });

    if (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Log activity
    await supabase
      .from('deal_activity_logs')
      .insert({
        deal_id: dealId,
        user_id: user.id,
        action: 'message_sent',
        details: {
          message_preview: newMessage.substring(0, 100),
          sender_type: senderType
        }
      });

    setNewMessage('');
    toast({
      title: "Message Sent",
      description: senderType === 'broker' 
        ? "Your message has been sent to the client." 
        : "Your message has been sent to your broker team.",
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ messages, requirements });
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'submitted':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Approved</Badge>;
      case 'submitted':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Under Review</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-700">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Pending</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">Medium</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Low</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-navy">
            Communication Centre - {dealName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="messages" className="space-y-4">
            <TabsList className="grid grid-cols-2 bg-secondary">
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5" />
                    <span>Messages with Your Broker Team</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 mb-4">
                    <div className="space-y-4">
                      {loading ? (
                        <div className="text-center text-muted-foreground">Loading messages...</div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-muted-foreground">No messages yet. Start the conversation!</div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                message.sender === 'client'
                                  ? 'bg-primary text-white'
                                  : message.type === 'request'
                                  ? 'bg-yellow-100 border border-yellow-300'
                                  : message.type === 'update'
                                  ? 'bg-green-100 border border-green-300'
                                  : 'bg-gray-100'
                              }`}
                            >
                              <div className="text-sm">{message.content}</div>
                              <div
                                className={`text-xs mt-2 ${
                                  message.sender === 'client' ? 'text-white/70' : 'text-gray-500'
                                }`}
                              >
                                {message.sender === 'client' ? 'You' : 'Broker'} • {new Date(message.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 min-h-[60px]"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Outstanding Requirements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center text-muted-foreground">Loading requirements...</div>
                    ) : requirements.length === 0 ? (
                      <div className="text-center text-muted-foreground">No requirements yet.</div>
                    ) : (
                      requirements.map((requirement) => (
                        <div key={requirement.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(requirement.status)}
                              <div>
                                <h4 className="font-medium">{requirement.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Due: {requirement.due_date ? new Date(requirement.due_date).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getPriorityBadge(requirement.priority)}
                              {getStatusBadge(requirement.status)}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {requirement.description || 'No description provided'}
                          </p>
                          {requirement.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Redirecting",
                                  description: "Opening document upload section...",
                                });
                              }}
                            >
                              Upload Document
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              Save Communication
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}