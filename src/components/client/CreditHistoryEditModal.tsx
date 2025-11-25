import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface CreditHistoryEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditHistory: any;
}

export function CreditHistoryEditModal({ open, onOpenChange, creditHistory }: CreditHistoryEditModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      credit_score: parseInt(formData.get('credit_score') as string) || null,
      credit_report_date: formData.get('credit_report_date') as string || null,
      has_ccjs: formData.get('has_ccjs') === 'on',
      ccj_count: parseInt(formData.get('ccj_count') as string) || 0,
      ccj_total_value: parseFloat(formData.get('ccj_total_value') as string) || 0,
      ccj_details: formData.get('ccj_details') as string || null,
      has_defaults: formData.get('has_defaults') === 'on',
      default_count: parseInt(formData.get('default_count') as string) || 0,
      default_details: formData.get('default_details') as string || null,
      has_mortgage_arrears: formData.get('has_mortgage_arrears') === 'on',
      arrears_details: formData.get('arrears_details') as string || null,
      has_bankruptcy: formData.get('has_bankruptcy') === 'on',
      bankruptcy_date: formData.get('bankruptcy_date') as string || null,
      bankruptcy_discharged: formData.get('bankruptcy_discharged') === 'on',
      bankruptcy_discharge_date: formData.get('bankruptcy_discharge_date') as string || null,
      has_iva: formData.get('has_iva') === 'on',
      iva_date: formData.get('iva_date') as string || null,
      iva_completed: formData.get('iva_completed') === 'on',
      iva_completion_date: formData.get('iva_completion_date') as string || null,
      has_repossession: formData.get('has_repossession') === 'on',
      repossession_date: formData.get('repossession_date') as string || null,
      additional_notes: formData.get('additional_notes') as string || null,
    };

    try {
      if (creditHistory) {
        await supabase
          .from('client_credit_history')
          .update(data)
          .eq('user_id', user?.id);
      } else {
        await supabase
          .from('client_credit_history')
          .insert({ ...data, user_id: user?.id });
      }
      
      toast.success("Credit history updated successfully");
      queryClient.invalidateQueries({ queryKey: ['client-credit-history'] });
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update credit history");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Credit History</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Credit Score */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="credit_score">Credit Score</Label>
              <Input
                id="credit_score"
                name="credit_score"
                type="number"
                min="0"
                max="999"
                defaultValue={creditHistory?.credit_score || ""}
              />
            </div>
            <div>
              <Label htmlFor="credit_report_date">Credit Report Date</Label>
              <Input
                id="credit_report_date"
                name="credit_report_date"
                type="date"
                defaultValue={creditHistory?.credit_report_date || ""}
              />
            </div>
          </div>

          {/* CCJs */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label htmlFor="has_ccjs">County Court Judgements (CCJs)</Label>
              <Switch id="has_ccjs" name="has_ccjs" defaultChecked={creditHistory?.has_ccjs} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ccj_count">CCJ Count</Label>
                <Input id="ccj_count" name="ccj_count" type="number" min="0" defaultValue={creditHistory?.ccj_count || 0} />
              </div>
              <div>
                <Label htmlFor="ccj_total_value">Total Value (£)</Label>
                <Input id="ccj_total_value" name="ccj_total_value" type="number" step="0.01" defaultValue={creditHistory?.ccj_total_value || 0} />
              </div>
            </div>
            <div>
              <Label htmlFor="ccj_details">Details</Label>
              <Textarea id="ccj_details" name="ccj_details" defaultValue={creditHistory?.ccj_details || ""} />
            </div>
          </div>

          {/* Defaults */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label htmlFor="has_defaults">Defaults</Label>
              <Switch id="has_defaults" name="has_defaults" defaultChecked={creditHistory?.has_defaults} />
            </div>
            <div>
              <Label htmlFor="default_count">Default Count</Label>
              <Input id="default_count" name="default_count" type="number" min="0" defaultValue={creditHistory?.default_count || 0} />
            </div>
            <div>
              <Label htmlFor="default_details">Details</Label>
              <Textarea id="default_details" name="default_details" defaultValue={creditHistory?.default_details || ""} />
            </div>
          </div>

          {/* Mortgage Arrears */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label htmlFor="has_mortgage_arrears">Mortgage Arrears</Label>
              <Switch id="has_mortgage_arrears" name="has_mortgage_arrears" defaultChecked={creditHistory?.has_mortgage_arrears} />
            </div>
            <div>
              <Label htmlFor="arrears_details">Details</Label>
              <Textarea id="arrears_details" name="arrears_details" defaultValue={creditHistory?.arrears_details || ""} />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="additional_notes">Additional Notes</Label>
            <Textarea id="additional_notes" name="additional_notes" rows={4} defaultValue={creditHistory?.additional_notes || ""} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
