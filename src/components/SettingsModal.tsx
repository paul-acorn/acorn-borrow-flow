import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Bell } from "lucide-react";
import { NotificationPreferencesModal } from "./NotificationPreferences";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4 overflow-y-auto flex-1 -mx-6 px-6">
          {/* Theme Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Appearance</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === "light" ? (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="theme">Dark Mode</Label>
              </div>
              <Switch
                id="theme"
                checked={theme === "dark"}
                onCheckedChange={handleThemeChange}
              />
            </div>
          </div>

          <Separator />

          {/* Notification Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  Notifications
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage your notification preferences
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowNotificationPrefs(true)}
              >
                Configure
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <NotificationPreferencesModal
        open={showNotificationPrefs}
        onOpenChange={setShowNotificationPrefs}
      />
    </Dialog>
  );
};
