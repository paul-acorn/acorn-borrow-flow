import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Bell, Trash2 } from "lucide-react";
import { NotificationPreferencesModal } from "./NotificationPreferences";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { toast } = useToast();
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" || "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);

    // Listen for system theme changes if theme is set to system
    if (savedTheme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  const applyTheme = (themeValue: "light" | "dark" | "system") => {
    if (themeValue === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", isDark);
    } else {
      document.documentElement.classList.toggle("dark", themeValue === "dark");
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const handleDeleteAccountRequest = () => {
    console.log("Account deletion requested");
    toast({
      title: "Request Received",
      description: "Your request has been received. Account will be deleted in 30 days."
    });
    onOpenChange(false);
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
            <div className="space-y-3">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("light")}
                  className="flex items-center gap-2"
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("dark")}
                  className="flex items-center gap-2"
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("system")}
                  className="text-xs"
                >
                  System
                </Button>
              </div>
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

          <Separator />

          {/* Account Deletion */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Your account will be scheduled for deletion
                    and all your data will be permanently removed from our servers within 30 days.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccountRequest}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
