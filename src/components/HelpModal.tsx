import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string | React.ReactNode;
}

export function HelpModal({ open, onOpenChange, title, content }: HelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-primary">
            <HelpCircle className="w-6 h-6" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="prose prose-sm max-w-none text-foreground">
          {typeof content === 'string' ? <p>{content}</p> : content}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface HelpButtonProps {
  onClick: () => void;
  className?: string;
}

export function HelpButton({ onClick, className = "" }: HelpButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`p-1 h-auto hover:bg-primary/10 ${className}`}
    >
      <HelpCircle className="w-4 h-4 text-primary" />
    </Button>
  );
}
