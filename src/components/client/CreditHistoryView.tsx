import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, Edit } from "lucide-react";
import { CreditHistoryEditModal } from "./CreditHistoryEditModal";

export function CreditHistoryView() {
  const { user } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: creditHistory, isLoading } = useQuery({
    queryKey: ['client-credit-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_credit_history')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!creditHistory) {
    return (
      <>
        <Card>
          <CardContent className="py-8 space-y-4">
            <p className="text-center text-muted-foreground">No credit history information recorded yet.</p>
            <div className="flex justify-center">
              <Button size="sm" onClick={() => setEditModalOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Add Credit History
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <CreditHistoryEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          creditHistory={null}
        />
      </>
    );
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '£0';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Credit History
          </Button>
        </div>
        
        {/* Credit Score */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Score</CardTitle>
          </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{creditHistory.credit_score || 'N/A'}</p>
              {creditHistory.credit_report_date && (
                <p className="text-sm text-muted-foreground mt-2">
                  As of {new Date(creditHistory.credit_report_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              {creditHistory.credit_score && (
                <Badge variant={creditHistory.credit_score >= 700 ? 'default' : creditHistory.credit_score >= 550 ? 'secondary' : 'destructive'}>
                  {creditHistory.credit_score >= 700 ? 'Excellent' : creditHistory.credit_score >= 550 ? 'Fair' : 'Poor'}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Issues Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Credit History Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CCJs */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="mt-0.5">
              {creditHistory.has_ccjs ? <XCircle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">County Court Judgements (CCJs)</p>
              {creditHistory.has_ccjs ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Count: {creditHistory.ccj_count} | Total Value: {formatCurrency(creditHistory.ccj_total_value)}
                  </p>
                  {creditHistory.ccj_details && (
                    <p className="text-sm text-muted-foreground">{creditHistory.ccj_details}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No CCJs recorded</p>
              )}
            </div>
          </div>

          {/* Defaults */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="mt-0.5">
              {creditHistory.has_defaults ? <XCircle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">Defaults</p>
              {creditHistory.has_defaults ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">Count: {creditHistory.default_count}</p>
                  {creditHistory.default_details && (
                    <p className="text-sm text-muted-foreground">{creditHistory.default_details}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No defaults recorded</p>
              )}
            </div>
          </div>

          {/* Mortgage Arrears */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="mt-0.5">
              {creditHistory.has_mortgage_arrears ? <AlertCircle className="h-5 w-5 text-orange-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">Mortgage Arrears</p>
              {creditHistory.has_mortgage_arrears ? (
                <div className="mt-2">
                  {creditHistory.arrears_details && (
                    <p className="text-sm text-muted-foreground">{creditHistory.arrears_details}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No mortgage arrears</p>
              )}
            </div>
          </div>

          {/* Bankruptcy */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="mt-0.5">
              {creditHistory.has_bankruptcy ? <XCircle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">Bankruptcy</p>
              {creditHistory.has_bankruptcy ? (
                <div className="mt-2 space-y-1">
                  {creditHistory.bankruptcy_date && (
                    <p className="text-sm text-muted-foreground">
                      Date: {new Date(creditHistory.bankruptcy_date).toLocaleDateString()}
                    </p>
                  )}
                  {creditHistory.bankruptcy_discharged && creditHistory.bankruptcy_discharge_date && (
                    <p className="text-sm text-muted-foreground">
                      Discharged: {new Date(creditHistory.bankruptcy_discharge_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No bankruptcy recorded</p>
              )}
            </div>
          </div>

          {/* IVA */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="mt-0.5">
              {creditHistory.has_iva ? <AlertCircle className="h-5 w-5 text-orange-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">Individual Voluntary Arrangement (IVA)</p>
              {creditHistory.has_iva ? (
                <div className="mt-2 space-y-1">
                  {creditHistory.iva_date && (
                    <p className="text-sm text-muted-foreground">
                      Date: {new Date(creditHistory.iva_date).toLocaleDateString()}
                    </p>
                  )}
                  {creditHistory.iva_completed && creditHistory.iva_completion_date && (
                    <p className="text-sm text-muted-foreground">
                      Completed: {new Date(creditHistory.iva_completion_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No IVA recorded</p>
              )}
            </div>
          </div>

          {/* Repossession */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="mt-0.5">
              {creditHistory.has_repossession ? <XCircle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">Property Repossession</p>
              {creditHistory.has_repossession ? (
                <div className="mt-2">
                  {creditHistory.repossession_date && (
                    <p className="text-sm text-muted-foreground">
                      Date: {new Date(creditHistory.repossession_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No repossession recorded</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      {creditHistory.additional_notes && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{creditHistory.additional_notes}</p>
          </CardContent>
        </Card>
      )}
      </div>

      <CreditHistoryEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        creditHistory={creditHistory}
      />
    </>
  );
}
