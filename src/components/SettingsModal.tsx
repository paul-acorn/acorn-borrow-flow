import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Bell, Mail, MessageSquare } from "lucide-react";
import { getNotificationPreferences } from "./NotificationPreferences";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState(getNotificationPreferences());

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

  const updateNotificationPref = (key: keyof typeof notifications, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    localStorage.setItem("notificationPreferences", JSON.stringify(updated));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
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
            <h3 className="text-sm font-medium">Notifications</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="statusChanges">Status Changes</Label>
              </div>
              <Switch
                id="statusChanges"
                checked={notifications.statusChanges}
                onCheckedChange={(checked) => updateNotificationPref("statusChanges", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="newMessages">New Messages</Label>
              </div>
              <Switch
                id="newMessages"
                checked={notifications.newMessages}
                onCheckedChange={(checked) => updateNotificationPref("newMessages", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="enableEmail">Email Notifications</Label>
              </div>
              <Switch
                id="enableEmail"
                checked={notifications.enableEmail}
                onCheckedChange={(checked) => updateNotificationPref("enableEmail", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="enableSounds">Notification Sounds</Label>
              </div>
              <Switch
                id="enableSounds"
                checked={notifications.enableSounds}
                onCheckedChange={(checked) => updateNotificationPref("enableSounds", checked)}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};