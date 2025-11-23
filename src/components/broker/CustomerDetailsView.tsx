import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CustomerDetailsViewProps {
  customerId: string;
  customerName: string;
}

export const CustomerDetailsView = ({ customerId, customerName }: CustomerDetailsViewProps) => {
  // Fetch all customer details
  const { data: personalDetails, isLoading: loadingPersonal } = useQuery({
    queryKey: ["customer-personal", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_personal_details")
        .select("*")
        .eq("user_id", customerId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: addresses, isLoading: loadingAddresses } = useQuery({
    queryKey: ["customer-addresses", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_addresses")
        .select("*")
        .eq("user_id", customerId)
        .order("is_current", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: incomeStreams, isLoading: loadingIncome } = useQuery({
    queryKey: ["customer-income", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_income_streams")
        .select("*")
        .eq("user_id", customerId);
      if (error) throw error;
      return data;
    },
  });

  const { data: financialAssets, isLoading: loadingAssets } = useQuery({
    queryKey: ["customer-assets", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_financial_assets")
        .select("*")
        .eq("user_id", customerId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: mortgages, isLoading: loadingMortgages } = useQuery({
    queryKey: ["customer-mortgages", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_mortgages")
        .select("*")
        .eq("user_id", customerId);
      if (error) throw error;
      return data;
    },
  });

  const { data: creditHistory, isLoading: loadingCredit } = useQuery({
    queryKey: ["customer-credit", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_credit_history")
        .select("*")
        .eq("user_id", customerId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: creditCards, isLoading: loadingCards } = useQuery({
    queryKey: ["customer-credit-cards", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_credit_cards")
        .select("*")
        .eq("user_id", customerId);
      if (error) throw error;
      return data;
    },
  });

  const { data: personalLoans, isLoading: loadingLoans } = useQuery({
    queryKey: ["customer-loans", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_personal_loans")
        .select("*")
        .eq("user_id", customerId);
      if (error) throw error;
      return data;
    },
  });

  const { data: otherDebts, isLoading: loadingDebts } = useQuery({
    queryKey: ["customer-debts", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_other_debts")
        .select("*")
        .eq("user_id", customerId);
      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "£0";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const isLoading = loadingPersonal || loadingAddresses || loadingIncome || loadingAssets || 
                    loadingMortgages || loadingCredit || loadingCards || loadingLoans || loadingDebts;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{customerName}</h2>
        <p className="text-muted-foreground">Complete customer profile</p>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
          <TabsTrigger value="credit">Credit</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {personalDetails ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Title</p>
                      <p className="text-base">{personalDetails.title || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                      <p className="text-base">{personalDetails.dob ? new Date(personalDetails.dob).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nationality</p>
                      <p className="text-base">{personalDetails.nationality || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Marital Status</p>
                      <p className="text-base">{personalDetails.marital_status || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">NI Number</p>
                      <p className="text-base">{personalDetails.ni_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Residence Status</p>
                      <p className="text-base">{personalDetails.residence || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dependents</p>
                      <p className="text-base">{personalDetails.dependents || 0}</p>
                    </div>
                    {personalDetails.visa_type && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Visa Type</p>
                          <p className="text-base">{personalDetails.visa_type}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Visa Expiry</p>
                          <p className="text-base">{personalDetails.visa_expiry ? new Date(personalDetails.visa_expiry).toLocaleDateString() : "N/A"}</p>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No personal details recorded</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses && addresses.length > 0 ? (
                addresses.map((address) => (
                  <div key={address.id} className="border-l-2 border-primary pl-4">
                    {address.is_current && <Badge className="mb-2">Current</Badge>}
                    <p className="font-medium">
                      {address.property_number} {address.street}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.postcode}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {address.date_moved_in ? new Date(address.date_moved_in).toLocaleDateString() : "Unknown"} - 
                      {address.date_moved_out ? new Date(address.date_moved_out).toLocaleDateString() : "Present"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No address history recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          {incomeStreams && incomeStreams.length > 0 ? (
            incomeStreams.map((income, index) => (
              <Card key={income.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Income Source {index + 1}
                    <Badge>{income.income_type}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {income.income_type === "employed" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Employer</p>
                          <p className="text-base">{income.employer_name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Contract Type</p>
                          <p className="text-base">{income.contract_type || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Annual Gross</p>
                          <p className="text-base font-semibold">{formatCurrency(income.annual_gross)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Monthly Net</p>
                          <p className="text-base font-semibold">{formatCurrency(income.monthly_net)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                          <p className="text-base">{income.start_date ? new Date(income.start_date).toLocaleDateString() : "N/A"}</p>
                        </div>
                      </div>
                    </>
                  )}
                  {income.income_type === "self_employed" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Business Name</p>
                          <p className="text-base">{income.business_name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Business Type</p>
                          <p className="text-base">{income.business_type || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Annual Income</p>
                          <p className="text-base font-semibold">{formatCurrency(income.annual_income)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Trading Since</p>
                          <p className="text-base">{income.trading_start_date ? new Date(income.trading_start_date).toLocaleDateString() : "N/A"}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No income information recorded</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Assets</CardTitle>
            </CardHeader>
            <CardContent>
              {financialAssets ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bank Accounts</p>
                    <p className="text-lg font-semibold">{formatCurrency(financialAssets.bank_accounts)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Property Value</p>
                    <p className="text-lg font-semibold">{formatCurrency(financialAssets.property_value)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Investments</p>
                    <p className="text-lg font-semibold">{formatCurrency(financialAssets.investments)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pension Value</p>
                    <p className="text-lg font-semibold">{formatCurrency(financialAssets.pension_value)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Other Assets</p>
                    <p className="text-lg font-semibold">{formatCurrency(financialAssets.other_assets)}</p>
                  </div>
                  <div className="col-span-2 pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(
                        (financialAssets.bank_accounts || 0) +
                        (financialAssets.property_value || 0) +
                        (financialAssets.investments || 0) +
                        (financialAssets.pension_value || 0) +
                        (financialAssets.other_assets || 0)
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No asset information recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liabilities" className="space-y-4">
          {mortgages && mortgages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mortgages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mortgages.map((mortgage) => (
                  <div key={mortgage.id} className="border-l-2 border-primary pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{mortgage.type}</Badge>
                      <Badge variant="outline">{mortgage.rate_type}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Lender</p>
                        <p className="text-base">{mortgage.lender}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Balance</p>
                        <p className="text-base font-semibold">{formatCurrency(mortgage.balance)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Monthly Payment</p>
                        <p className="text-base font-semibold">{formatCurrency(mortgage.monthly_payment)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {personalLoans && personalLoans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Loans</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {personalLoans.map((loan) => (
                  <div key={loan.id} className="border-l-2 border-orange-500 pl-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Lender</p>
                        <p className="text-base">{loan.lender}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Balance</p>
                        <p className="text-base font-semibold">{formatCurrency(loan.balance)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Monthly Payment</p>
                        <p className="text-base font-semibold">{formatCurrency(loan.monthly_payment)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {creditCards && creditCards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Credit Cards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {creditCards.map((card) => (
                  <div key={card.id} className="border-l-2 border-blue-500 pl-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Limit</p>
                        <p className="text-base">{formatCurrency(card.credit_limit)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Balance</p>
                        <p className="text-base font-semibold">{formatCurrency(card.balance)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Monthly Payment</p>
                        <p className="text-base font-semibold">{formatCurrency(card.monthly_payment)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {otherDebts && otherDebts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Other Debts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {otherDebts.map((debt) => (
                  <div key={debt.id} className="border-l-2 border-red-500 pl-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Type</p>
                        <p className="text-base">{debt.debt_type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Balance</p>
                        <p className="text-base font-semibold">{formatCurrency(debt.balance)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Monthly Payment</p>
                        <p className="text-base font-semibold">{formatCurrency(debt.monthly_payment)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(!mortgages || mortgages.length === 0) && 
           (!personalLoans || personalLoans.length === 0) && 
           (!creditCards || creditCards.length === 0) && 
           (!otherDebts || otherDebts.length === 0) && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No liability information recorded</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="credit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit History</CardTitle>
            </CardHeader>
            <CardContent>
              {creditHistory ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Credit Score</p>
                      <p className="text-2xl font-bold">{creditHistory.credit_score || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Report Date</p>
                      <p className="text-base">{creditHistory.credit_report_date ? new Date(creditHistory.credit_report_date).toLocaleDateString() : "N/A"}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">CCJs</span>
                      {creditHistory.has_ccjs ? (
                        <Badge variant="destructive">{creditHistory.ccj_count} ({formatCurrency(creditHistory.ccj_total_value)})</Badge>
                      ) : (
                        <Badge variant="outline">None</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Defaults</span>
                      {creditHistory.has_defaults ? (
                        <Badge variant="destructive">{creditHistory.default_count}</Badge>
                      ) : (
                        <Badge variant="outline">None</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Bankruptcy</span>
                      {creditHistory.has_bankruptcy ? (
                        <Badge variant="destructive">Yes</Badge>
                      ) : (
                        <Badge variant="outline">None</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">IVA</span>
                      {creditHistory.has_iva ? (
                        <Badge variant="destructive">Yes</Badge>
                      ) : (
                        <Badge variant="outline">None</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Mortgage Arrears</span>
                      {creditHistory.has_mortgage_arrears ? (
                        <Badge variant="destructive">Yes</Badge>
                      ) : (
                        <Badge variant="outline">None</Badge>
                      )}
                    </div>
                  </div>

                  {creditHistory.additional_notes && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Additional Notes</p>
                      <p className="text-sm">{creditHistory.additional_notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No credit history recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};