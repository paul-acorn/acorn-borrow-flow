import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFormNavigation } from "@/hooks/useFormNavigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, X, Zap } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type DealStatus = Database["public"]["Enums"]["deal_status"];

interface WorkflowAction {
  type: 'create_task' | 'send_notification' | 'update_field' | 'assign_broker';
  params: Record<string, any>;
}

interface WorkflowFormData {
  name: string;
  description: string;
  trigger_type: string;
  from_status: string;
  to_status: string;
  actions: WorkflowAction[];
}

interface WorkflowCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: {
    name: string;
    description: string;
    fromStatus: string;
    toStatus: string;
    actions: WorkflowAction[];
  };
}

const DEAL_STATUSES: DealStatus[] = [
  "new_case",
  "awaiting_dip",
  "dip_approved",
  "reports_instructed",
  "final_underwriting",
  "offered",
  "with_solicitors",
  "completed"
];

export const WorkflowCreationModal = ({ open, onOpenChange, template }: WorkflowCreationModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<WorkflowFormData>({
    name: template?.name || "",
    description: template?.description || "",
    trigger_type: "status_change",
    from_status: template?.fromStatus || "",
    to_status: template?.toStatus || "",
    actions: template?.actions || [],
  });

  const [currentAction, setCurrentAction] = useState<Partial<WorkflowAction>>({
    type: 'create_task',
    params: {},
  });

  // Fetch brokers for assignment
  const { data: brokers = [] } = useQuery({
    queryKey: ["brokers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "broker");

      if (error) throw error;

      // Fetch profiles for these users
      const userIds = data.map(d => d.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      return profiles || [];
    },
  });

  useFormNavigation(formRef, {
    onSubmit: () => {
      if (formData.name && formData.to_status) {
        createMutation.mutate();
      }
    },
    canSubmit: () => !!(formData.name && formData.to_status) && !createMutation.isPending
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase.from("workflow_rules").insert([{
        name: formData.name,
        description: formData.description,
        trigger_type: formData.trigger_type,
        trigger_conditions: {
          from_status: formData.from_status || null,
          to_status: formData.to_status,
        },
        actions: formData.actions as any,
        created_by: user.id,
        is_active: true,
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-rules"] });
      toast.success("Workflow created successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      trigger_type: "status_change",
      from_status: "",
      to_status: "",
      actions: [],
    });
    setCurrentAction({ type: 'create_task', params: {} });
  };

  const addAction = () => {
    if (!currentAction.type) return;

    const newAction: WorkflowAction = {
      type: currentAction.type,
      params: { ...currentAction.params },
    };

    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction],
    }));

    setCurrentAction({ type: 'create_task', params: {} });
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getActionLabel = (action: WorkflowAction) => {
    switch (action.type) {
      case 'create_task':
        return `Create Task: "${action.params.title}"`;
      case 'send_notification':
        return `Send Notification: "${action.params.title}"`;
      case 'update_field':
        return `Update ${action.params.field}`;
      case 'assign_broker':
        return 'Assign Broker';
      default:
        return action.type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning" />
            {template ? 'Create from Template' : 'Create Workflow'}
          </DialogTitle>
        </DialogHeader>

        <div ref={formRef} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                autoFocus
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Welcome New Clients"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What does this workflow do?"
                rows={2}
              />
            </div>
          </div>

          {/* Trigger Configuration */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold">Trigger Conditions</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="from_status">From Status (Optional)</Label>
                  <Select
                    value={formData.from_status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, from_status: value }))}
                  >
                    <SelectTrigger id="from_status">
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any status</SelectItem>
                      {DEAL_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                          {formatStatus(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="to_status">To Status *</Label>
                  <Select
                    value={formData.to_status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, to_status: value }))}
                  >
                    <SelectTrigger id="to_status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEAL_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                          {formatStatus(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Trigger when deal moves {formData.from_status ? `from ${formatStatus(formData.from_status)}` : 'from any status'} to {formData.to_status ? formatStatus(formData.to_status) : 'selected status'}
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold">Actions</h3>

              {formData.actions.length > 0 && (
                <div className="space-y-2">
                  {formData.actions.map((action, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <span className="flex-1 text-sm">{getActionLabel(action)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAction(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 border-t pt-4">
                <Label htmlFor="action_type">Add Action</Label>
                <Select
                  value={currentAction.type}
                  onValueChange={(value: any) => setCurrentAction({ type: value, params: {} })}
                >
                  <SelectTrigger id="action_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create_task">Create Task</SelectItem>
                    <SelectItem value="send_notification">Send Notification</SelectItem>
                    <SelectItem value="update_field">Update Field</SelectItem>
                    <SelectItem value="assign_broker">Assign Broker</SelectItem>
                  </SelectContent>
                </Select>

                {/* Action-specific parameters */}
                {currentAction.type === 'create_task' && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Task title"
                      value={currentAction.params?.title || ''}
                      onChange={(e) => setCurrentAction(prev => ({
                        ...prev,
                        params: { ...prev.params, title: e.target.value }
                      }))}
                    />
                    <Textarea
                      placeholder="Task description (optional)"
                      value={currentAction.params?.description || ''}
                      onChange={(e) => setCurrentAction(prev => ({
                        ...prev,
                        params: { ...prev.params, description: e.target.value }
                      }))}
                      rows={2}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select
                        value={currentAction.params?.priority || 'medium'}
                        onValueChange={(value) => setCurrentAction(prev => ({
                          ...prev,
                          params: { ...prev.params, priority: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Due in days"
                        value={currentAction.params?.due_date || ''}
                        onChange={(e) => setCurrentAction(prev => ({
                          ...prev,
                          params: { ...prev.params, due_date: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                )}

                {currentAction.type === 'send_notification' && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Notification title"
                      value={currentAction.params?.title || ''}
                      onChange={(e) => setCurrentAction(prev => ({
                        ...prev,
                        params: { ...prev.params, title: e.target.value }
                      }))}
                    />
                    <Textarea
                      placeholder="Notification message"
                      value={currentAction.params?.message || ''}
                      onChange={(e) => setCurrentAction(prev => ({
                        ...prev,
                        params: { ...prev.params, message: e.target.value }
                      }))}
                      rows={2}
                    />
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={currentAction.params?.notify_client || false}
                          onChange={(e) => setCurrentAction(prev => ({
                            ...prev,
                            params: { ...prev.params, notify_client: e.target.checked }
                          }))}
                        />
                        Notify Client
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={currentAction.params?.notify_broker || false}
                          onChange={(e) => setCurrentAction(prev => ({
                            ...prev,
                            params: { ...prev.params, notify_broker: e.target.checked }
                          }))}
                        />
                        Notify Broker
                      </label>
                    </div>
                  </div>
                )}

                {currentAction.type === 'assign_broker' && (
                  <Select
                    value={currentAction.params?.broker_id || ''}
                    onValueChange={(value) => setCurrentAction(prev => ({
                      ...prev,
                      params: { ...prev.params, broker_id: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select broker" />
                    </SelectTrigger>
                    <SelectContent>
                      {brokers.map(broker => (
                        <SelectItem key={broker.id} value={broker.id}>
                          {broker.first_name} {broker.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addAction}
                  disabled={
                    !currentAction.type ||
                    (currentAction.type === 'create_task' && !currentAction.params?.title) ||
                    (currentAction.type === 'send_notification' && !currentAction.params?.title)
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Action
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!formData.name || !formData.to_status || createMutation.isPending}
              className="flex-1 bg-gradient-primary"
            >
              {createMutation.isPending ? "Creating..." : "Create Workflow"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
