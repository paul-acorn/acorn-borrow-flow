import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Calendar, Clock, Phone, CheckCircle, XCircle, Plus } from "lucide-react";
import { format } from "date-fns";
import { CallSchedulingModal } from "./CallSchedulingModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScheduledCallback {
  id: string;
  title: string;
  notes: string;
  scheduled_at: string;
  status: string;
  deal_id: string;
  scheduled_by: string;
  scheduled_with: string;
  deals: { name: string } | null;
  scheduled_by_profile: { first_name: string; last_name: string };
  scheduled_with_profile: { first_name: string; last_name: string };
}

export const ScheduledCallbacksView = () => {
  const { user, hasRole } = useAuth();
  const [callbacks, setCallbacks] = useState<ScheduledCallback[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [callbackToDelete, setCallbackToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadCallbacks();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("scheduled_callbacks_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scheduled_callbacks",
        },
        () => {
          loadCallbacks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadCallbacks = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("scheduled_callbacks")
        .select(`
          *,
          deals (name)
        `)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;

      // Fetch profile data separately
      if (data && data.length > 0) {
        const userIds = [...new Set([
          ...data.map(cb => cb.scheduled_by),
          ...data.map(cb => cb.scheduled_with)
        ])];

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const enrichedCallbacks = data.map(cb => ({
          ...cb,
          scheduled_by_profile: profileMap.get(cb.scheduled_by) || { first_name: "", last_name: "" },
          scheduled_with_profile: profileMap.get(cb.scheduled_with) || { first_name: "", last_name: "" }
        }));

        setCallbacks(enrichedCallbacks as any);
      } else {
        setCallbacks([]);
      }
    } catch (error: any) {
      console.error("Error loading callbacks:", error);
      toast.error("Failed to load scheduled callbacks");
    } finally {
      setLoading(false);
    }
  };

  const updateCallbackStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_callbacks")
        .update({ 
          status, 
          completed_at: status === "completed" ? new Date().toISOString() : null 
        })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Callback ${status}`);
      loadCallbacks();
    } catch (error: any) {
      console.error("Error updating callback:", error);
      toast.error("Failed to update callback");
    }
  };

  const deleteCallback = async () => {
    if (!callbackToDelete) return;

    try {
      const { error } = await supabase
        .from("scheduled_callbacks")
        .delete()
        .eq("id", callbackToDelete);

      if (error) throw error;
      toast.success("Callback deleted");
      loadCallbacks();
    } catch (error: any) {
      console.error("Error deleting callback:", error);
      toast.error("Failed to delete callback");
    } finally {
      setCallbackToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const upcomingCallbacks = callbacks.filter(cb => cb.status === "pending" && new Date(cb.scheduled_at) >= new Date());
  const pastCallbacks = callbacks.filter(cb => cb.status !== "pending" || new Date(cb.scheduled_at) < new Date());

  if (loading) {
    return <div className="flex justify-center p-8">Loading scheduled callbacks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Scheduled Callbacks</h2>
        <Button onClick={() => setIsSchedulingModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Callback
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Upcoming ({upcomingCallbacks.length})</h3>
          {upcomingCallbacks.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No upcoming callbacks scheduled
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingCallbacks.map((callback) => (
                <Card key={callback.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{callback.title}</h4>
                        {getStatusBadge(callback.status)}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(callback.scheduled_at), "PPP")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(callback.scheduled_at), "p")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {callback.scheduled_by === user?.id
                            ? `With ${callback.scheduled_with_profile.first_name} ${callback.scheduled_with_profile.last_name}`
                            : `By ${callback.scheduled_by_profile.first_name} ${callback.scheduled_by_profile.last_name}`}
                        </div>
                      </div>

                      {callback.deals && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Deal:</span> {callback.deals.name}
                        </div>
                      )}

                      {callback.notes && (
                        <p className="text-sm text-muted-foreground">{callback.notes}</p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCallbackStatus(callback.id, "completed")}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCallbackStatus(callback.id, "cancelled")}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      {callback.scheduled_by === user?.id && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setCallbackToDelete(callback.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Past & Completed ({pastCallbacks.length})</h3>
          {pastCallbacks.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No past callbacks
            </Card>
          ) : (
            <div className="space-y-3">
              {pastCallbacks.map((callback) => (
                <Card key={callback.id} className="p-4 opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{callback.title}</h4>
                        {getStatusBadge(callback.status)}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(callback.scheduled_at), "PPP")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(callback.scheduled_at), "p")}
                        </div>
                      </div>

                      {callback.deals && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Deal:</span> {callback.deals.name}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <CallSchedulingModal
        isOpen={isSchedulingModalOpen}
        onClose={() => setIsSchedulingModalOpen(false)}
        onScheduled={loadCallbacks}
      />

      <AlertDialog open={!!callbackToDelete} onOpenChange={() => setCallbackToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scheduled Callback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scheduled callback? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCallback}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
