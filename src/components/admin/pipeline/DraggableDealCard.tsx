import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";

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

interface DraggableDealCardProps {
  deal: Deal;
  profile?: Profile;
}

const LOAN_TYPE_LABELS: Record<string, string> = {
  bridging: "Bridging Finance",
  mortgage: "Mortgage",
  development: "Development Finance",
  business: "Business Loan",
  factoring: "Factoring",
  asset: "Asset Finance",
  mca: "MCA",
  equity: "Equity Release",
};

export function DraggableDealCard({ deal, profile }: DraggableDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{deal.name}</div>
              {profile && (
                <div className="text-xs text-muted-foreground truncate">
                  {profile.first_name} {profile.last_name}
                </div>
              )}
            </div>
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-xs">
              {LOAN_TYPE_LABELS[deal.type] || deal.type}
            </Badge>
            {deal.amount && (
              <div className="text-xs font-semibold text-primary">
                {formatCurrency(deal.amount)}
              </div>
            )}
          </div>

          {profile?.deal_code && (
            <div className="text-xs text-muted-foreground">
              Code: {profile.deal_code}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
