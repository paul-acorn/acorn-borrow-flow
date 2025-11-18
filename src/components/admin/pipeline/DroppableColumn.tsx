import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DroppableColumnProps {
  id: string;
  title: string;
  count: number;
  color: string;
  children: React.ReactNode;
}

export function DroppableColumn({ id, title, count, color, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Card 
      ref={setNodeRef}
      className={`flex flex-col transition-colors ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Badge variant="secondary" className="ml-2">
            {count}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {children}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
