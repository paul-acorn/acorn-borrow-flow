import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface AutomatedTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string;
  created_at: string;
  deals: { name: string };
}

export const AutomatedTasksView = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["automated-tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automated_tasks")
        .select("*, deals(name)")
        .eq("assigned_to", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as AutomatedTask[];
    },
    enabled: !!user?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const updates: any = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("automated_tasks")
        .update(updates)
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automated-tasks"] });
      toast.success("Task updated");
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Pending Tasks ({pendingTasks.length})</h3>
        <div className="grid gap-4">
          {pendingTasks.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No pending automated tasks
              </CardContent>
            </Card>
          ) : (
            pendingTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <CardTitle className="text-base">{task.title}</CardTitle>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Deal:</span> {task.deals?.name || 'N/A'}
                      </p>
                      {task.due_date && (
                        <p className="text-sm">
                          <span className="font-medium">Due:</span>{' '}
                          {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({
                            taskId: task.id,
                            status: 'in_progress'
                          })}
                        >
                          Start
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({
                          taskId: task.id,
                          status: 'completed'
                        })}
                      >
                        Complete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Completed Tasks ({completedTasks.length})</h3>
          <div className="grid gap-4">
            {completedTasks.slice(0, 5).map((task) => (
              <Card key={task.id} className="opacity-70">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <CardTitle className="text-base line-through">{task.title}</CardTitle>
                    <Badge variant="outline">{task.deals?.name}</Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
