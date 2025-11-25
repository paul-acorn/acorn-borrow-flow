import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface ALIEEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ALIEEditModal({ open, onOpenChange }: ALIEEditModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleAssetsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      property_value: parseFloat(formData.get('property_value') as string) || 0,
      bank_accounts: parseFloat(formData.get('bank_accounts') as string) || 0,
      investments: parseFloat(formData.get('investments') as string) || 0,
      pension_value: parseFloat(formData.get('pension_value') as string) || 0,
      other_assets: parseFloat(formData.get('other_assets') as string) || 0,
    };

    try {
      const { data: existing } = await supabase
        .from('client_financial_assets')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('client_financial_assets')
          .update(data)
          .eq('user_id', user?.id);
      } else {
        await supabase
          .from('client_financial_assets')
          .insert({ ...data, user_id: user?.id });
      }
      
      toast.success("Assets updated successfully");
      queryClient.invalidateQueries({ queryKey: ['client-financial-assets'] });
    } catch (error) {
      toast.error("Failed to update assets");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Financial Information</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="assets">
            <form onSubmit={handleAssetsSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property_value">Property Value (£)</Label>
                  <Input
                    id="property_value"
                    name="property_value"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="bank_accounts">Bank Accounts (£)</Label>
                  <Input
                    id="bank_accounts"
                    name="bank_accounts"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="investments">Investments (£)</Label>
                  <Input
                    id="investments"
                    name="investments"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="pension_value">Pension Value (£)</Label>
                  <Input
                    id="pension_value"
                    name="pension_value"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="other_assets">Other Assets (£)</Label>
                  <Input
                    id="other_assets"
                    name="other_assets"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Assets"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="income">
            <p className="text-sm text-muted-foreground">Income stream management coming soon. Use the main dashboard to add income sources.</p>
          </TabsContent>

          <TabsContent value="liabilities">
            <p className="text-sm text-muted-foreground">Liability management coming soon. Use the main dashboard to add liabilities.</p>
          </TabsContent>

          <TabsContent value="expenses">
            <p className="text-sm text-muted-foreground">Expense tracking coming soon.</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
