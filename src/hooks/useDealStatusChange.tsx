import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type DealStatus = Database["public"]["Enums"]["deal_status"];

export const useDealStatusChange = () => {
  const { user } = useAuth();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      dealId, 
      oldStatus, 
      newStatus 
    }: { 
      dealId: string; 
      oldStatus: DealStatus; 
      newStatus: DealStatus;
    }) => {
      // Update the deal status
      const { error: updateError } = await supabase
        .from("deals")
        .update({ status: newStatus })
        .eq("id", dealId);

      if (updateError) throw updateError;

      // Log activity
      await supabase.from("deal_activity_logs").insert({
        deal_id: dealId,
        user_id: user?.id,
        action: "status_change",
        details: { from: oldStatus, to: newStatus },
      });

      // Trigger workflow automation
      try {
        const { error: workflowError } = await supabase.functions.invoke('process-workflow', {
          body: {
            dealId,
            oldStatus,
            newStatus,
            userId: user?.id,
          },
        });

        if (workflowError) {
          console.error("Workflow processing error:", workflowError);
        }
      } catch (error) {
        console.error("Error triggering workflow:", error);
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success("Deal status updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return updateStatusMutation;
};
