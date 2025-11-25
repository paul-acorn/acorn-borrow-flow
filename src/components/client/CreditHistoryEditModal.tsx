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
  const [hasCCJs, setHasCCJs] = useState(creditHistory?.has_ccjs || false);
  const [hasDefaults, setHasDefaults] = useState(creditHistory?.has_defaults || false);
  const [hasBankruptcy, setHasBankruptcy] = useState(creditHistory?.has_bankruptcy || false);
  const [hasIVA, setHasIVA] = useState(creditHistory?.has_iva || false);
  const [hasMortgageArrears, setHasMortgageArrears] = useState(creditHistory?.has_mortgage_arrears || false);
  const [hasRepossession, setHasRepossession] = useState(creditHistory?.has_repossession || false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      credit_score: parseInt(formData.get('credit_score') as string) || null,
      credit_report_date: formData.get('credit_report_date') as string || null,
      has_ccjs: hasCCJs,
      ccj_count: parseInt(formData.get('ccj_count') as string) || 0,
      ccj_total_value: parseFloat(formData.get('ccj_total_value') as string) || 0,
      ccj_details: formData.get('ccj_details') as string || null,
      has_defaults: hasDefaults,
      default_count: parseInt(formData.get('default_count') as string) || 0,
      default_details: formData.get('default_details') as string || null,
      has_mortgage_arrears: hasMortgageArrears,
      arrears_details: formData.get('arrears_details') as string || null,
      has_bankruptcy: hasBankruptcy,
      bankruptcy_date: formData.get('bankruptcy_date') as string || null,
      bankruptcy_discharged: formData.get('bankruptcy_discharged') === 'on',
      bankruptcy_discharge_date: formData.get('bankruptcy_discharge_date') as string || null,
      has_iva: hasIVA,
      iva_date: formData.get('iva_date') as string || null,
      iva_completed: formData.get('iva_completed') === 'on',
      iva_completion_date: formData.get('iva_completion_date') as string || null,
      has_repossession: hasRepossession,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Credit History</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Credit Score */}
          <div className="space-y-4">
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
                <p className="text-xs text-muted-foreground mt-1">Usually between 300-850</p>
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
          </div>

          {/* CCJs */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="has_ccjs">County Court Judgements (CCJs)</Label>
                <p className="text-xs text-muted-foreground">Have you had any CCJs registered against you?</p>
              </div>
              <Switch id="has_ccjs" checked={hasCCJs} onCheckedChange={setHasCCJs} />
            </div>
            {hasCCJs && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ccj_count">Number of CCJs</Label>
                    <Input id="ccj_count" name="ccj_count" type="number" min="0" defaultValue={creditHistory?.ccj_count || 0} />
                  </div>
                  <div>
                    <Label htmlFor="ccj_total_value">Total Value (£)</Label>
                    <Input id="ccj_total_value" name="ccj_total_value" type="number" step="0.01" defaultValue={creditHistory?.ccj_total_value || 0} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ccj_details">CCJ Details</Label>
                  <Textarea id="ccj_details" name="ccj_details" placeholder="Provide details (dates, amounts, status)" defaultValue={creditHistory?.ccj_details || ""} />
                </div>
              </>
            )}
          </div>

          {/* Defaults */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="has_defaults">Defaults</Label>
                <p className="text-xs text-muted-foreground">Have you had any defaults on credit accounts?</p>
              </div>
              <Switch id="has_defaults" checked={hasDefaults} onCheckedChange={setHasDefaults} />
            </div>
            {hasDefaults && (
              <>
                <div>
                  <Label htmlFor="default_count">Number of Defaults</Label>
                  <Input id="default_count" name="default_count" type="number" min="0" defaultValue={creditHistory?.default_count || 0} />
                </div>
                <div>
                  <Label htmlFor="default_details">Default Details</Label>
                  <Textarea id="default_details" name="default_details" placeholder="Provide details (dates, accounts, amounts)" defaultValue={creditHistory?.default_details || ""} />
                </div>
              </>
            )}
          </div>

          {/* Mortgage Arrears */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="has_mortgage_arrears">Mortgage Arrears</Label>
                <p className="text-xs text-muted-foreground">Have you had any mortgage payment arrears?</p>
              </div>
              <Switch id="has_mortgage_arrears" checked={hasMortgageArrears} onCheckedChange={setHasMortgageArrears} />
            </div>
            {hasMortgageArrears && (
              <div>
                <Label htmlFor="arrears_details">Arrears Details</Label>
                <Textarea id="arrears_details" name="arrears_details" placeholder="Provide details (dates, amounts, current status)" defaultValue={creditHistory?.arrears_details || ""} />
              </div>
            )}
          </div>

          {/* Bankruptcy */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="has_bankruptcy">Bankruptcy</Label>
                <p className="text-xs text-muted-foreground">Have you ever been declared bankrupt?</p>
              </div>
              <Switch id="has_bankruptcy" checked={hasBankruptcy} onCheckedChange={setHasBankruptcy} />
            </div>
            {hasBankruptcy && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankruptcy_date">Bankruptcy Date</Label>
                    <Input id="bankruptcy_date" name="bankruptcy_date" type="date" defaultValue={creditHistory?.bankruptcy_date || ""} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="bankruptcy_discharged" name="bankruptcy_discharged" defaultChecked={creditHistory?.bankruptcy_discharged} />
                    <Label htmlFor="bankruptcy_discharged">Discharged</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="bankruptcy_discharge_date">Discharge Date</Label>
                  <Input id="bankruptcy_discharge_date" name="bankruptcy_discharge_date" type="date" defaultValue={creditHistory?.bankruptcy_discharge_date || ""} />
                </div>
              </>
            )}
          </div>

          {/* IVA */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="has_iva">Individual Voluntary Arrangement (IVA)</Label>
                <p className="text-xs text-muted-foreground">Have you entered into an IVA?</p>
              </div>
              <Switch id="has_iva" checked={hasIVA} onCheckedChange={setHasIVA} />
            </div>
            {hasIVA && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="iva_date">IVA Start Date</Label>
                    <Input id="iva_date" name="iva_date" type="date" defaultValue={creditHistory?.iva_date || ""} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="iva_completed" name="iva_completed" defaultChecked={creditHistory?.iva_completed} />
                    <Label htmlFor="iva_completed">Completed</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="iva_completion_date">Completion Date</Label>
                  <Input id="iva_completion_date" name="iva_completion_date" type="date" defaultValue={creditHistory?.iva_completion_date || ""} />
                </div>
              </>
            )}
          </div>

          {/* Repossession */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="has_repossession">Property Repossession</Label>
                <p className="text-xs text-muted-foreground">Have you had a property repossessed?</p>
              </div>
              <Switch id="has_repossession" checked={hasRepossession} onCheckedChange={setHasRepossession} />
            </div>
            {hasRepossession && (
              <div>
                <Label htmlFor="repossession_date">Repossession Date</Label>
                <Input id="repossession_date" name="repossession_date" type="date" defaultValue={creditHistory?.repossession_date || ""} />
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="additional_notes">Additional Notes</Label>
            <Textarea id="additional_notes" name="additional_notes" rows={4} placeholder="Any additional information about your credit history" defaultValue={creditHistory?.additional_notes || ""} />
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
