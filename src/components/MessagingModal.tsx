import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface MessagingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealName: string;
  onSave: (data: any) => void;
}

interface Message {
  id: string;
  sender: 'client' | 'broker';
  content: string;
  timestamp: string;
  type: 'message' | 'request' | 'update';
}

interface Requirement {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'broker',
    content: 'Welcome to your application for the High Street Property Purchase. I\'m your dedicated broker and will be guiding you through the process.',
    timestamp: '2024-01-15 09:00',
    type: 'message'
  },
  {
    id: '2',
    sender: 'broker',
    content: 'We need your latest bank statements to proceed with the underwriting process.',
    timestamp: '2024-01-15 10:30',
    type: 'request'
  },
  {
    id: '3',
    sender: 'client',
    content: 'Hi, thanks for the update. I\'ve uploaded the bank statements in the documents section. Please let me know if you need anything else.',
    timestamp: '2024-01-15 14:20',
    type: 'message'
  },
  {
    id: '4',
    sender: 'broker',
    content: 'Perfect! Bank statements received and being reviewed. The lender has responded positively to the initial submission.',
    timestamp: '2024-01-16 11:15',
    type: 'update'
  }
];

const mockRequirements: Requirement[] = [
  {
    id: '1',
    title: 'Bank Statements (3 months)',
    description: 'Please provide your personal bank statements for the last 3 months',
    status: 'approved',
    dueDate: '2024-01-20',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Property Valuation Report',
    description: 'Professional valuation report for the subject property',
    status: 'pending',
    dueDate: '2024-01-25',
    priority: 'high'
  },
  {
    id: '3',
    title: 'Tax Returns (2 years)',
    description: 'SA302 forms or tax return summaries for the last 2 years',
    status: 'submitted',
    dueDate: '2024-01-22',
    priority: 'medium'
  },
  {
    id: '4',
    title: 'Building Insurance Quote',
    description: 'Insurance quote for the property covering the loan amount',
    status: 'pending',
    dueDate: '2024-01-28',
    priority: 'low'
  }
];

export function MessagingModal({ open, onOpenChange, dealName, onSave }: MessagingModalProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [requirements, setRequirements] = useState<Requirement[]>(mockRequirements);
  const [newMessage, setNewMessage] = useState('');
  const { toast } = useToast();

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: 'client',
      content: newMessage,
      timestamp: new Date().toLocaleString(),
      type: 'message'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    toast({
      title: "Message Sent",
      description: "Your message has been sent to your broker team.",
    });
  };

  const handleSave = () => {
    onSave({ messages, requirements });
    toast({
      title: "Communication Saved",
      description: "Your communication history has been saved.",
    });
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
                      {messages.map((message) => (
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
                              {message.sender === 'client' ? 'You' : 'Broker'} • {message.timestamp}
                            </div>
                          </div>
                        </div>
                      ))}
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
                    {requirements.map((requirement) => (
                      <div key={requirement.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(requirement.status)}
                            <div>
                              <h4 className="font-medium">{requirement.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Due: {requirement.dueDate}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getPriorityBadge(requirement.priority)}
                            {getStatusBadge(requirement.status)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {requirement.description}
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
                    ))}
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