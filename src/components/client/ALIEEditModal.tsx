import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface ALIEEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ALIEEditModal({ open, onOpenChange }: ALIEEditModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("assets");

  // Income state
  const [incomeStreams, setIncomeStreams] = useState<Array<{
    type: string;
    monthlyNet?: string;
    employerName?: string;
    annualGross?: string;
  }>>([{ type: 'employed', monthlyNet: '', employerName: '' }]);

  // Liabilities state
  const [mortgages, setMortgages] = useState<Array<{
    lender: string;
    balance: string;
    monthlyPayment: string;
    interestRate: string;
  }>>([]);
  const [personalLoans, setPersonalLoans] = useState<Array<{
    lender: string;
    balance: string;
    monthlyPayment: string;
  }>>([]);
  const [creditCards, setCreditCards] = useState<Array<{
    creditLimit: string;
    balance: string;
    monthlyPayment: string;
  }>>([]);

  // Expenses state
  const [expenses, setExpenses] = useState({
    mortgage: '',
    rent: '',
    utilities: '',
    councilTax: '',
    groceries: '',
    transport: '',
    childcare: '',
    insurance: '',
    other: '',
  });

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

  const handleIncomeSubmit = async () => {
    setLoading(true);
    try {
      // Delete existing income streams
      await supabase.from('client_income_streams').delete().eq('user_id', user?.id);

      // Insert new income streams
      const incomeData = incomeStreams
        .filter(s => s.monthlyNet || s.employerName)
        .map(s => ({
          user_id: user?.id,
          income_type: s.type,
          monthly_net: parseFloat(s.monthlyNet || '0') || null,
          annual_gross: parseFloat(s.annualGross || '0') || null,
          employer_name: s.employerName || null,
        }));

      if (incomeData.length > 0) {
        await supabase.from('client_income_streams').insert(incomeData);
      }

      toast.success("Income streams updated successfully");
      queryClient.invalidateQueries({ queryKey: ['client-income-streams'] });
    } catch (error) {
      toast.error("Failed to update income streams");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLiabilitiesSubmit = async () => {
    setLoading(true);
    try {
      // Delete existing liabilities
      await Promise.all([
        supabase.from('client_mortgages').delete().eq('user_id', user?.id),
        supabase.from('client_personal_loans').delete().eq('user_id', user?.id),
        supabase.from('client_credit_cards').delete().eq('user_id', user?.id),
      ]);

      // Insert mortgages
      const mortgageData = mortgages
        .filter(m => m.lender)
        .map(m => ({
          user_id: user?.id,
          lender: m.lender,
          balance: parseFloat(m.balance) || null,
          monthly_payment: parseFloat(m.monthlyPayment) || null,
          interest_rate: parseFloat(m.interestRate) || null,
        }));

      if (mortgageData.length > 0) {
        await supabase.from('client_mortgages').insert(mortgageData);
      }

      // Insert personal loans
      const loanData = personalLoans
        .filter(l => l.lender)
        .map(l => ({
          user_id: user?.id,
          lender: l.lender,
          balance: parseFloat(l.balance) || null,
          monthly_payment: parseFloat(l.monthlyPayment) || null,
        }));

      if (loanData.length > 0) {
        await supabase.from('client_personal_loans').insert(loanData);
      }

      // Insert credit cards
      const cardData = creditCards
        .filter(c => c.creditLimit)
        .map(c => ({
          user_id: user?.id,
          credit_limit: parseFloat(c.creditLimit) || null,
          balance: parseFloat(c.balance) || null,
          monthly_payment: parseFloat(c.monthlyPayment) || null,
        }));

      if (cardData.length > 0) {
        await supabase.from('client_credit_cards').insert(cardData);
      }

      toast.success("Liabilities updated successfully");
      queryClient.invalidateQueries({ queryKey: ['client-mortgages', 'client-personal-loans', 'client-credit-cards'] });
    } catch (error) {
      toast.error("Failed to update liabilities");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpensesSubmit = async () => {
    setLoading(true);
    try {
      const expenseData = {
        mortgage_rent: parseFloat(expenses.mortgage) || 0,
        utilities: parseFloat(expenses.utilities) || 0,
        council_tax: parseFloat(expenses.councilTax) || 0,
        groceries: parseFloat(expenses.groceries) || 0,
        transport: parseFloat(expenses.transport) || 0,
        childcare: parseFloat(expenses.childcare) || 0,
        insurance: parseFloat(expenses.insurance) || 0,
        other: parseFloat(expenses.other) || 0,
      };

      const { data: existing } = await supabase
        .from('client_expenses')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('client_expenses')
          .update(expenseData)
          .eq('user_id', user?.id);
      } else {
        await supabase
          .from('client_expenses')
          .insert({ ...expenseData, user_id: user?.id });
      }

      toast.success("Expenses updated successfully");
      queryClient.invalidateQueries({ queryKey: ['client-expenses'] });
    } catch (error) {
      toast.error("Failed to update expenses");
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

          <TabsContent value="income" className="space-y-4">
            <div className="space-y-4">
              {incomeStreams.map((stream, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Income Stream {index + 1}</Label>
                    {incomeStreams.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIncomeStreams(incomeStreams.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={stream.type}
                        onValueChange={(value) => {
                          const updated = [...incomeStreams];
                          updated[index].type = value;
                          setIncomeStreams(updated);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employed">Employed</SelectItem>
                          <SelectItem value="self-employed">Self-Employed</SelectItem>
                          <SelectItem value="benefits">Benefits</SelectItem>
                          <SelectItem value="pension">Pension</SelectItem>
                          <SelectItem value="rental">Rental</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {stream.type === 'self-employed' ? (
                      <div>
                        <Label>Annual Gross (£)</Label>
                        <Input
                          type="number"
                          value={stream.annualGross}
                          onChange={(e) => {
                            const updated = [...incomeStreams];
                            updated[index].annualGross = e.target.value;
                            setIncomeStreams(updated);
                          }}
                          placeholder="0.00"
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>Monthly Net (£)</Label>
                        <Input
                          type="number"
                          value={stream.monthlyNet}
                          onChange={(e) => {
                            const updated = [...incomeStreams];
                            updated[index].monthlyNet = e.target.value;
                            setIncomeStreams(updated);
                          }}
                          placeholder="0.00"
                        />
                      </div>
                    )}
                    <div>
                      <Label>Employer/Source Name</Label>
                      <Input
                        value={stream.employerName}
                        onChange={(e) => {
                          const updated = [...incomeStreams];
                          updated[index].employerName = e.target.value;
                          setIncomeStreams(updated);
                        }}
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIncomeStreams([...incomeStreams, { type: 'employed', monthlyNet: '', employerName: '' }])}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Income Stream
            </Button>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleIncomeSubmit} disabled={loading}>
                {loading ? "Saving..." : "Save Income"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="liabilities" className="space-y-6">
            {/* Mortgages */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Mortgages</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMortgages([...mortgages, { lender: '', balance: '', monthlyPayment: '', interestRate: '' }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              {mortgages.map((mortgage, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMortgages(mortgages.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Lender</Label>
                      <Input
                        value={mortgage.lender}
                        onChange={(e) => {
                          const updated = [...mortgages];
                          updated[index].lender = e.target.value;
                          setMortgages(updated);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Balance (£)</Label>
                      <Input
                        type="number"
                        value={mortgage.balance}
                        onChange={(e) => {
                          const updated = [...mortgages];
                          updated[index].balance = e.target.value;
                          setMortgages(updated);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Monthly Payment (£)</Label>
                      <Input
                        type="number"
                        value={mortgage.monthlyPayment}
                        onChange={(e) => {
                          const updated = [...mortgages];
                          updated[index].monthlyPayment = e.target.value;
                          setMortgages(updated);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Interest Rate (%)</Label>
                      <Input
                        type="number"
                        value={mortgage.interestRate}
                        onChange={(e) => {
                          const updated = [...mortgages];
                          updated[index].interestRate = e.target.value;
                          setMortgages(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Personal Loans */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Personal Loans</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPersonalLoans([...personalLoans, { lender: '', balance: '', monthlyPayment: '' }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              {personalLoans.map((loan, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPersonalLoans(personalLoans.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Lender</Label>
                      <Input
                        value={loan.lender}
                        onChange={(e) => {
                          const updated = [...personalLoans];
                          updated[index].lender = e.target.value;
                          setPersonalLoans(updated);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Balance (£)</Label>
                      <Input
                        type="number"
                        value={loan.balance}
                        onChange={(e) => {
                          const updated = [...personalLoans];
                          updated[index].balance = e.target.value;
                          setPersonalLoans(updated);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Monthly Payment (£)</Label>
                      <Input
                        type="number"
                        value={loan.monthlyPayment}
                        onChange={(e) => {
                          const updated = [...personalLoans];
                          updated[index].monthlyPayment = e.target.value;
                          setPersonalLoans(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Credit Cards */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Credit Cards</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreditCards([...creditCards, { creditLimit: '', balance: '', monthlyPayment: '' }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              {creditCards.map((card, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCreditCards(creditCards.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Credit Limit (£)</Label>
                      <Input
                        type="number"
                        value={card.creditLimit}
                        onChange={(e) => {
                          const updated = [...creditCards];
                          updated[index].creditLimit = e.target.value;
                          setCreditCards(updated);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Balance (£)</Label>
                      <Input
                        type="number"
                        value={card.balance}
                        onChange={(e) => {
                          const updated = [...creditCards];
                          updated[index].balance = e.target.value;
                          setCreditCards(updated);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Monthly Payment (£)</Label>
                      <Input
                        type="number"
                        value={card.monthlyPayment}
                        onChange={(e) => {
                          const updated = [...creditCards];
                          updated[index].monthlyPayment = e.target.value;
                          setCreditCards(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleLiabilitiesSubmit} disabled={loading}>
                {loading ? "Saving..." : "Save Liabilities"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Track your monthly expenses. This helps assess affordability.</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mortgage">Mortgage/Rent (£)</Label>
                  <Input
                    id="mortgage"
                    type="number"
                    value={expenses.mortgage}
                    onChange={(e) => setExpenses({ ...expenses, mortgage: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="utilities">Utilities (£)</Label>
                  <Input
                    id="utilities"
                    type="number"
                    value={expenses.utilities}
                    onChange={(e) => setExpenses({ ...expenses, utilities: e.target.value })}
                    placeholder="Gas, electric, water"
                  />
                </div>
                <div>
                  <Label htmlFor="councilTax">Council Tax (£)</Label>
                  <Input
                    id="councilTax"
                    type="number"
                    value={expenses.councilTax}
                    onChange={(e) => setExpenses({ ...expenses, councilTax: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="groceries">Groceries (£)</Label>
                  <Input
                    id="groceries"
                    type="number"
                    value={expenses.groceries}
                    onChange={(e) => setExpenses({ ...expenses, groceries: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="transport">Transport (£)</Label>
                  <Input
                    id="transport"
                    type="number"
                    value={expenses.transport}
                    onChange={(e) => setExpenses({ ...expenses, transport: e.target.value })}
                    placeholder="Fuel, public transport"
                  />
                </div>
                <div>
                  <Label htmlFor="childcare">Childcare (£)</Label>
                  <Input
                    id="childcare"
                    type="number"
                    value={expenses.childcare}
                    onChange={(e) => setExpenses({ ...expenses, childcare: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="insurance">Insurance (£)</Label>
                  <Input
                    id="insurance"
                    type="number"
                    value={expenses.insurance}
                    onChange={(e) => setExpenses({ ...expenses, insurance: e.target.value })}
                    placeholder="Life, home, car"
                  />
                </div>
                <div>
                  <Label htmlFor="other">Other Expenses (£)</Label>
                  <Input
                    id="other"
                    type="number"
                    value={expenses.other}
                    onChange={(e) => setExpenses({ ...expenses, other: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Total Monthly Expenses</p>
                <p className="text-2xl font-bold">
                  £{Object.values(expenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(2)}
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleExpensesSubmit} disabled={loading}>
                  {loading ? "Saving..." : "Save Expenses"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
