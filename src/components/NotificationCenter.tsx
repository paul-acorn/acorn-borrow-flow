import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Trash2, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationPreferencesModal } from "./NotificationPreferences";

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onClearAll: () => void;
  onMarkAsRead: (id: string) => void;
}

export function NotificationCenter({ notifications, onClearAll, onMarkAsRead }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleOpen = () => {
    setOpen(true);
    // Mark all as read when opened
    notifications.forEach(n => {
      if (!n.read) {
        onMarkAsRead(n.id);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative" onClick={handleOpen}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreferencesOpen(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </Button>
              {notifications.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClearAll}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-6">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.read ? 'bg-background' : 'bg-accent/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>

      <NotificationPreferencesModal 
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
    </Sheet>
  );
}
