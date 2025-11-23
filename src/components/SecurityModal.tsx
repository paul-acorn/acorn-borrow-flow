import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Key, AlertTriangle, CheckCircle2, Fingerprint } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";

interface SecurityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SecurityModal = ({ open, onOpenChange }: SecurityModalProps) => {
  const { registerBiometric, user } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);

  const handleRegisterBiometric = async () => {
    setIsRegistering(true);
    try {
      const { error } = await registerBiometric();
      if (error) {
        toast.error("Failed to register biometric", {
          description: error.message
        });
      } else {
        setBiometricRegistered(true);
        toast.success("Biometric authentication registered!", {
          description: "You can now sign in using your fingerprint or face"
        });
      }
    } finally {
      setIsRegistering(false);
    }
  };
  const securityChecklist = [
    { label: "Strong password set", completed: true },
    { label: "Email verified", completed: true },
    { label: "Two-factor authentication", completed: false },
    { label: "Recovery email added", completed: false },
    { label: "Security questions set", completed: false },
  ];

  const completedCount = securityChecklist.filter(item => item.completed).length;
  const securityScore = Math.round((completedCount / securityChecklist.length) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Security Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4 overflow-y-auto flex-1 -mx-6 px-6">
          {/* Security Score */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Security Score</span>
              <Badge variant={securityScore >= 80 ? "default" : "destructive"}>
                {securityScore}%
              </Badge>
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <div
                className="bg-gradient-primary h-2 rounded-full transition-all"
                style={{ width: `${securityScore}%` }}
              />
            </div>
          </div>

          <Separator />

          {/* Biometric Authentication */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-muted-foreground" />
                  Biometric Authentication
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Sign in with fingerprint or face recognition
                </p>
              </div>
              {biometricRegistered ? (
                <div className="flex items-center gap-2 text-success text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Enabled</span>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRegisterBiometric}
                  disabled={isRegistering || !user}
                >
                  {isRegistering ? "Setting up..." : "Enable"}
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Security Checklist */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Security Checklist</h3>
            {securityChecklist.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">{item.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Two-Factor Authentication */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
            <Button variant="outline" className="w-full" disabled>
              <Key className="mr-2 h-4 w-4" />
              Enable 2FA (Coming Soon)
            </Button>
          </div>

          {/* Password Change */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Password
            </h3>
            <Button variant="outline" className="w-full" disabled>
              Change Password (Coming Soon)
            </Button>
          </div>

          {/* Active Sessions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Active Sessions</h3>
            <p className="text-sm text-muted-foreground">
              You are currently signed in on this device
            </p>
            <Button variant="outline" className="w-full" disabled>
              View All Sessions (Coming Soon)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};