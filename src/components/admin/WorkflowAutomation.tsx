import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Zap, Trash2, Edit } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-navy">Workflow Automation</h2>
          <p className="text-muted-foreground">Automate actions based on deal events</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Workflow (Coming Soon)</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Advanced workflow builder with visual editor coming soon. For now, workflows can be created via the database.
            </p>
          </DialogContent>
        </Dialog>
      </div>

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
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${rule.is_active ? 'text-warning' : 'text-muted-foreground'}`} />
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      {!rule.is_active && <Badge variant="outline">Inactive</Badge>}
                    </div>
                    {rule.description && (
                      <CardDescription>{rule.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
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
          <CardTitle>Quick Start Templates</CardTitle>
          <CardDescription>Common automation patterns you can set up</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Welcome New Clients</h4>
            <p className="text-sm text-muted-foreground mb-2">
              When a deal is created (draft → in_progress), send welcome notification and create onboarding task.
            </p>
            <Badge variant="outline">Status Change Trigger</Badge>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Submission Reminder</h4>
            <p className="text-sm text-muted-foreground mb-2">
              When deal moves to submitted, notify broker and create review task with 2-day deadline.
            </p>
            <Badge variant="outline">Status Change Trigger</Badge>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Approval Celebration</h4>
            <p className="text-sm text-muted-foreground mb-2">
              When deal is approved, send congratulations notification to client and broker.
            </p>
            <Badge variant="outline">Status Change Trigger</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
