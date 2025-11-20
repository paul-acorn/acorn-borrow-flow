import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { TrendingUp, TrendingDown } from "lucide-react";
import { DraggableDealCard } from "./pipeline/DraggableDealCard";
import { DroppableColumn } from "./pipeline/DroppableColumn";

interface Deal {
  id: string;
  name: string;
  amount: number | null;
  type: string;
  status: string;
  created_at: string;
  user_id: string;
}

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  deal_code: string | null;
  assigned_broker: string | null;
}

const DEAL_STAGES = [
  { id: 'new_case', label: 'New Case', color: 'bg-secondary' },
  { id: 'awaiting_dip', label: 'Awaiting DIP', color: 'bg-blue-500' },
  { id: 'dip_approved', label: 'DIP Approved', color: 'bg-indigo-500' },
  { id: 'reports_instructed', label: 'Reports Instructed', color: 'bg-purple-500' },
  { id: 'final_underwriting', label: 'Final Underwriting', color: 'bg-yellow-500' },
  { id: 'offered', label: 'Offered', color: 'bg-amber-500' },
  { id: 'with_solicitors', label: 'With Solicitors', color: 'bg-orange-500' },
  { id: 'completed', label: 'Completed', color: 'bg-green-500' },
];

interface SalesPipelineViewProps {
  deals: Deal[];
  profiles: Profile[];
  searchTerm?: string;
  filterType?: string;
}

export function SalesPipelineView({ deals, profiles, searchTerm = "", filterType = "all" }: SalesPipelineViewProps) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter deals
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch = deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profiles.find(p => p.id === deal.user_id)?.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || deal.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [deals, searchTerm, filterType, profiles]);

  // Group deals by status
  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Deal[]> = {};
    DEAL_STAGES.forEach(stage => {
      grouped[stage.id] = filteredDeals.filter(deal => deal.status === stage.id);
    });
    return grouped;
  }, [filteredDeals]);

  // Calculate conversion metrics
  const conversionMetrics = useMemo(() => {
    const metrics: Record<string, { count: number; value: number; conversionRate: number }> = {};
    const totalDeals = filteredDeals.length;
    
    DEAL_STAGES.forEach(stage => {
      const stageDeals = dealsByStage[stage.id];
      const count = stageDeals.length;
      const value = stageDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
      const conversionRate = totalDeals > 0 ? (count / totalDeals) * 100 : 0;
      
      metrics[stage.id] = { count, value, conversionRate };
    });
    
    return metrics;
  }, [dealsByStage, filteredDeals]);

  // Update deal status mutation
  const updateDealStatusMutation = useMutation({
    mutationFn: async ({ dealId, newStatus }: { dealId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('deals')
        .update({ 
          status: newStatus as 'new_case' | 'awaiting_dip' | 'dip_approved' | 'reports_instructed' | 'final_underwriting' | 'offered' | 'with_solicitors' | 'completed', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', dealId);

      if (error) throw error;

      // Log activity
      await supabase.from('deal_activity_logs').insert({
        deal_id: dealId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'status_changed',
        details: { new_status: newStatus },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-deals'] });
      toast.success("Deal status updated");
    },
    onError: (error) => {
      toast.error("Failed to update deal status");
      console.error(error);
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const dealId = active.id as string;
    const newStatus = over.id as string;
    
    // Find the deal
    const deal = deals.find(d => d.id === dealId);
    
    if (deal && deal.status !== newStatus) {
      updateDealStatusMutation.mutate({ dealId, newStatus });
    }
    
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null;
  const activeProfile = activeDeal ? profiles.find(p => p.id === activeDeal.user_id) : null;

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "£0";
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Conversion Metrics Overview */}
      <div className="grid grid-cols-5 gap-4">
        {DEAL_STAGES.map(stage => {
          const metrics = conversionMetrics[stage.id];
          return (
            <Card key={stage.id} className="border-t-4" style={{ borderTopColor: `var(--${stage.color})` }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stage.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{metrics.count}</div>
                <div className="text-sm text-muted-foreground">{formatCurrency(metrics.value)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {metrics.conversionRate > 20 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-destructive" />
                  )}
                  {metrics.conversionRate.toFixed(1)}% of pipeline
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-5 gap-4 h-[600px]">
          {DEAL_STAGES.map(stage => {
            const stageDeals = dealsByStage[stage.id];
            return (
              <DroppableColumn
                key={stage.id}
                id={stage.id}
                title={stage.label}
                count={stageDeals.length}
                color={stage.color}
              >
                <SortableContext items={stageDeals.map(d => d.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {stageDeals.map(deal => {
                      const profile = profiles.find(p => p.id === deal.user_id);
                      return (
                        <DraggableDealCard
                          key={deal.id}
                          deal={deal}
                          profile={profile}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal && (
            <Card className="w-64 shadow-lg cursor-grabbing opacity-90">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="font-medium">{activeDeal.name}</div>
                  {activeDeal.amount && (
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(activeDeal.amount)}
                    </div>
                  )}
                  {activeProfile && (
                    <div className="text-xs text-muted-foreground">
                      {activeProfile.first_name} {activeProfile.last_name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
