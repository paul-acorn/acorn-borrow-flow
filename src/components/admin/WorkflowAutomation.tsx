import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Zap, Trash2, Sparkles } from "lucide-react";
import { WorkflowCreationModal } from "./WorkflowCreationModal";

interface WorkflowAction {
  type: 'create_task' | 'send_notification' | 'update_field' | 'assign_broker';
  params: Record<string, any>;
}

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_conditions: Record<string, any>;
  actions: WorkflowAction[];
  is_active: boolean;
}

export const WorkflowAutomation = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [templateData, setTemplateData] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch workflow rules
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["workflow-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as WorkflowRule[];
    },
  });

  // Toggle workflow active status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("workflow_rules")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-rules"] });
      toast.success("Workflow updated");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Delete workflow
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workflow_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-rules"] });
      toast.success("Workflow deleted");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const getActionDescription = (action: WorkflowAction) => {
    switch (action.type) {
      case 'create_task':
        return `Create task: "${action.params.title}"`;
      case 'send_notification':
        return `Send notification: "${action.params.title}"`;
      case 'update_field':
        return `Update ${action.params.field} to "${action.params.value}"`;
      case 'assign_broker':
        return 'Assign to broker';
      default:
        return action.type;
    }
  };

  const getTriggerDescription = (rule: WorkflowRule) => {
    if (rule.trigger_type === 'status_change') {
      const from = rule.trigger_conditions.from_status || 'any';
      const to = rule.trigger_conditions.to_status || 'any';
      return `When status changes from "${from}" to "${to}"`;
    }
    return rule.trigger_type;
  };

  const openTemplateWorkflow = (template: any) => {
    setTemplateData(template);
    setIsCreateOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setTemplateData(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy">Workflow Automation</h2>
          <p className="text-sm text-muted-foreground">Automate actions based on deal events</p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)} 
          className="bg-gradient-primary w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
      </div>

      <WorkflowCreationModal 
        open={isCreateOpen} 
        onOpenChange={handleModalClose}
        template={templateData}
      />

      {/* Workflow Rules List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">Loading workflows...</CardContent>
          </Card>
        ) : rules.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No workflow rules configured yet. Create your first automation rule to get started.
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id} className={!rule.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Zap className={`w-4 h-4 flex-shrink-0 ${rule.is_active ? 'text-warning' : 'text-muted-foreground'}`} />
                      <CardTitle className="text-lg break-words">{rule.name}</CardTitle>
                      {!rule.is_active && <Badge variant="outline">Inactive</Badge>}
                    </div>
                    {rule.description && (
                      <CardDescription className="text-sm">{rule.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => 
                        toggleMutation.mutate({ id: rule.id, isActive: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(rule.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Trigger:</p>
                  <Badge variant="secondary">{getTriggerDescription(rule)}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Actions:</p>
                  <div className="space-y-1">
                    {rule.actions.map((action, idx) => (
                      <div key={idx} className="text-sm flex items-center gap-2">
                        <span className="text-premium">→</span>
                        {getActionDescription(action)}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pre-configured Workflow Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-premium" />
            Quick Start Templates
          </CardTitle>
          <CardDescription>Click a template to create a pre-configured workflow</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <button
            onClick={() => openTemplateWorkflow({
              name: "Welcome New Clients",
              description: "Automatically welcome new clients and create onboarding tasks",
              fromStatus: "",
              toStatus: "new_case",
              actions: [
                {
                  type: 'send_notification',
                  params: {
                    title: 'Welcome to Acorn Finance',
                    message: 'We\'re excited to help you with your finance needs. Your broker will be in touch soon.',
                    notify_client: true,
                  }
                },
                {
                  type: 'create_task',
                  params: {
                    title: 'Review new client case',
                    description: 'Initial review of client requirements and documentation',
                    priority: 'high',
                    due_date: 1,
                  }
                }
              ]
            })}
            className="border rounded-lg p-3 sm:p-4 text-left hover:border-premium transition-colors"
          >
            <h4 className="font-medium mb-2 text-sm sm:text-base">Welcome New Clients</h4>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
              When a deal moves to "New case", send welcome notification and create onboarding task.
            </p>
            <Badge variant="outline" className="text-xs">Status Change Trigger</Badge>
          </button>

          <button
            onClick={() => openTemplateWorkflow({
              name: "DIP Submission Follow-up",
              description: "Notify broker and create review task when DIP is submitted",
              fromStatus: "",
              toStatus: "awaiting_dip",
              actions: [
                {
                  type: 'send_notification',
                  params: {
                    title: 'DIP Submitted for Review',
                    message: 'Decision in Principle has been submitted and is awaiting review',
                    notify_broker: true,
                  }
                },
                {
                  type: 'create_task',
                  params: {
                    title: 'Review DIP submission',
                    description: 'Review and process the Decision in Principle submission',
                    priority: 'high',
                    due_date: 2,
                  }
                }
              ]
            })}
            className="border rounded-lg p-3 sm:p-4 text-left hover:border-premium transition-colors"
          >
            <h4 className="font-medium mb-2 text-sm sm:text-base">DIP Submission Follow-up</h4>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
              When deal moves to "Awaiting DIP", notify broker and create review task.
            </p>
            <Badge variant="outline" className="text-xs">Status Change Trigger</Badge>
          </button>

          <button
            onClick={() => openTemplateWorkflow({
              name: "DIP Approval Celebration",
              description: "Congratulate client and create next steps task when DIP is approved",
              fromStatus: "awaiting_dip",
              toStatus: "dip_approved",
              actions: [
                {
                  type: 'send_notification',
                  params: {
                    title: 'Congratulations - DIP Approved!',
                    message: 'Great news! Your Decision in Principle has been approved. We\'ll now move forward with the next steps.',
                    notify_client: true,
                    notify_broker: true,
                  }
                },
                {
                  type: 'create_task',
                  params: {
                    title: 'Begin property reports process',
                    description: 'Coordinate property reports and valuation',
                    priority: 'medium',
                    due_date: 3,
                  }
                }
              ]
            })}
            className="border rounded-lg p-3 sm:p-4 text-left hover:border-premium transition-colors"
          >
            <h4 className="font-medium mb-2 text-sm sm:text-base">DIP Approval Celebration</h4>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
              When DIP is approved, send congratulations and create next steps task.
            </p>
            <Badge variant="outline" className="text-xs">Status Change Trigger</Badge>
          </button>

          <button
            onClick={() => openTemplateWorkflow({
              name: "Offer Made Notification",
              description: "Notify all parties when an offer is made",
              fromStatus: "",
              toStatus: "offered",
              actions: [
                {
                  type: 'send_notification',
                  params: {
                    title: 'Offer Made',
                    message: 'An offer has been made on your application. Please review the terms.',
                    notify_client: true,
                    notify_broker: true,
                  }
                },
                {
                  type: 'create_task',
                  params: {
                    title: 'Prepare completion documents',
                    description: 'Begin preparing documentation for completion',
                    priority: 'high',
                    due_date: 5,
                  }
                }
              ]
            })}
            className="border rounded-lg p-3 sm:p-4 text-left hover:border-premium transition-colors"
          >
            <h4 className="font-medium mb-2 text-sm sm:text-base">Offer Made Notification</h4>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
              When deal moves to "Offered", notify all parties and create completion task.
            </p>
            <Badge variant="outline" className="text-xs">Status Change Trigger</Badge>
          </button>
        </CardContent>
      </Card>
    </div>
  );
};
