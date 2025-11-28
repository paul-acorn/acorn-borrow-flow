import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Briefcase, DollarSign, Edit } from "lucide-react";
import { ALIEEditModal } from "./ALIEEditModal";

export function ALIEView() {
  const { user } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: assets, isLoading: loadingAssets } = useQuery({
    queryKey: ['client-financial-assets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_financial_assets')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: incomeStreams, isLoading: loadingIncome } = useQuery({
    queryKey: ['client-income-streams', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_income_streams')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: mortgages, isLoading: loadingMortgages } = useQuery({
    queryKey: ['client-mortgages', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_mortgages')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: personalLoans, isLoading: loadingLoans } = useQuery({
    queryKey: ['client-personal-loans', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_personal_loans')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: creditCards, isLoading: loadingCards } = useQuery({
    queryKey: ['client-credit-cards', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_credit_cards')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: carLeases, isLoading: loadingLeases } = useQuery({
    queryKey: ['client-car-leases', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_car_leases')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: otherDebts, isLoading: loadingOtherDebts } = useQuery({
    queryKey: ['client-other-debts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_other_debts')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ['client-expenses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_expenses')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '£0';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isLoading = loadingAssets || loadingIncome || loadingMortgages || loadingLoans || loadingCards || loadingLeases || loadingOtherDebts || loadingExpenses;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const totalAssets = (assets?.bank_accounts || 0) + (assets?.investments || 0) + (assets?.pension_value || 0) + (assets?.property_value || 0) + (assets?.other_assets || 0);
  const totalLiabilities = 
    (mortgages?.reduce((sum, m) => sum + (m.balance || 0), 0) || 0) +
    (personalLoans?.reduce((sum, l) => sum + (l.balance || 0), 0) || 0) +
    (creditCards?.reduce((sum, c) => sum + (c.balance || 0), 0) || 0) +
    (otherDebts?.reduce((sum, d) => sum + (d.balance || 0), 0) || 0);

  const totalIncome = incomeStreams?.reduce((sum, stream) => {
    return sum + (stream.monthly_net || stream.annual_income || stream.rental_income || stream.pension_amount || stream.benefit_amount || stream.other_amount || 0);
  }, 0) || 0;

  const totalExpenses = 
    (mortgages?.reduce((sum, m) => sum + (m.monthly_payment || 0), 0) || 0) +
    (personalLoans?.reduce((sum, l) => sum + (l.monthly_payment || 0), 0) || 0) +
    (creditCards?.reduce((sum, c) => sum + (c.monthly_payment || 0), 0) || 0) +
    (carLeases?.reduce((sum, l) => sum + (l.monthly_payment || 0), 0) || 0) +
    (otherDebts?.reduce((sum, d) => sum + (d.monthly_payment || 0), 0) || 0) +
    (expenses?.mortgage_rent || 0) +
    (expenses?.utilities || 0) +
    (expenses?.council_tax || 0) +
    (expenses?.groceries || 0) +
    (expenses?.transport || 0) +
    (expenses?.childcare || 0) +
    (expenses?.insurance || 0) +
    (expenses?.other || 0);

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Financial Info
          </Button>
        </div>
        
        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalAssets)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalLiabilities)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Assets Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
        </CardHeader>
        <CardContent>
          {assets ? (
            <div className="space-y-3">
              {assets.property_value! > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span>Property Value</span>
                  <span className="font-semibold">{formatCurrency(assets.property_value)}</span>
                </div>
              )}
              {assets.bank_accounts! > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span>Bank Accounts</span>
                  <span className="font-semibold">{formatCurrency(assets.bank_accounts)}</span>
                </div>
              )}
              {assets.investments! > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span>Investments</span>
                  <span className="font-semibold">{formatCurrency(assets.investments)}</span>
                </div>
              )}
              {assets.pension_value! > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span>Pension Value</span>
                  <span className="font-semibold">{formatCurrency(assets.pension_value)}</span>
                </div>
              )}
              {assets.other_assets! > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span>Other Assets</span>
                  <span className="font-semibold">{formatCurrency(assets.other_assets)}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No assets recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Income Streams */}
      <Card>
        <CardHeader>
          <CardTitle>Income Streams</CardTitle>
        </CardHeader>
        <CardContent>
          {incomeStreams && incomeStreams.length > 0 ? (
            <div className="space-y-3">
              {incomeStreams.map((stream) => (
                <div key={stream.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{stream.income_type?.replace(/_/g, ' ')}</span>
                    <span className="font-semibold">
                      {formatCurrency(stream.monthly_net || stream.annual_income || stream.rental_income || stream.pension_amount || stream.benefit_amount || stream.other_amount)}
                    </span>
                  </div>
                  {stream.employer_name && (
                    <p className="text-sm text-muted-foreground">{stream.employer_name}</p>
                  )}
                  {stream.business_name && (
                    <p className="text-sm text-muted-foreground">{stream.business_name}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No income streams recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Liabilities */}
      <Card>
        <CardHeader>
          <CardTitle>Liabilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mortgages */}
          {mortgages && mortgages.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Mortgages</h4>
              {mortgages.map((mortgage) => (
                <div key={mortgage.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{mortgage.lender}</span>
                    <span className="font-semibold">{formatCurrency(mortgage.balance)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Monthly: {formatCurrency(mortgage.monthly_payment)}</span>
                    <span>{mortgage.interest_rate}% {mortgage.rate_type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Personal Loans */}
          {personalLoans && personalLoans.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Personal Loans</h4>
              {personalLoans.map((loan) => (
                <div key={loan.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{loan.lender}</span>
                    <span className="font-semibold">{formatCurrency(loan.balance)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Monthly: {formatCurrency(loan.monthly_payment)}</span>
                    {loan.interest_rate && <span>{loan.interest_rate}%</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Credit Cards */}
          {creditCards && creditCards.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Credit Cards</h4>
              {creditCards.map((card) => (
                <div key={card.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Credit Card</span>
                    <span className="font-semibold">{formatCurrency(card.balance)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Monthly: {formatCurrency(card.monthly_payment)}</span>
                    <span>Limit: {formatCurrency(card.credit_limit)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Car Leases */}
          {carLeases && carLeases.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Car Leases</h4>
              {carLeases.map((lease) => (
                <div key={lease.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{lease.provider}</span>
                    <span className="font-semibold">{formatCurrency(lease.monthly_payment)}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Other Debts */}
          {otherDebts && otherDebts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Other Debts</h4>
              {otherDebts.map((debt) => (
                <div key={debt.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{debt.debt_type?.replace(/_/g, ' ')}</span>
                    <span className="font-semibold">{formatCurrency(debt.balance)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Monthly: {formatCurrency(debt.monthly_payment)}</span>
                    {debt.lender && <span>{debt.lender}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!mortgages?.length && !personalLoans?.length && !creditCards?.length && !carLeases?.length && !otherDebts?.length && (
            <p className="text-sm text-muted-foreground">No liabilities recorded yet.</p>
          )}
        </CardContent>
      </Card>
      </div>

      <ALIEEditModal open={editModalOpen} onOpenChange={setEditModalOpen} />
    </>
  );
}
