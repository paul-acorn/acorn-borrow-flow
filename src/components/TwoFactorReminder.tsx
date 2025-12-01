import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TwoFactorReminder = () => {
  const [show2FAReminder, setShow2FAReminder] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check2FAStatus = async () => {
      // Check if reminder was dismissed in this session
      const sessionDismissed = sessionStorage.getItem("2fa-reminder-dismissed");
      if (sessionDismissed) {
        setDismissed(true);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has 2FA enabled
      const { data: twoFactorData } = await supabase
        .from("two_factor_auth")
        .select("totp_enabled, sms_enabled")
        .eq("user_id", user.id)
        .single();

      // Show reminder if no 2FA method is enabled
      if (!twoFactorData || (!twoFactorData.totp_enabled && !twoFactorData.sms_enabled)) {
        setShow2FAReminder(true);
      }
    };

    check2FAStatus();
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("2fa-reminder-dismissed", "true");
    setDismissed(true);
    setShow2FAReminder(false);
  };

  const handleSetup2FA = () => {
    navigate("/");
    // Trigger security modal - we'll need to emit an event
    window.dispatchEvent(new CustomEvent("open-security-modal"));
    handleDismiss();
  };

  if (!show2FAReminder || dismissed) return null;

  return (
    <Alert className="fixed bottom-4 right-4 max-w-md z-50 border-warning bg-warning/10">
      <Shield className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        Enhance Your Security
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="text-sm">
          Two-factor authentication is not enabled on your account. Enable 2FA to add an extra layer of security.
        </p>
        <Button
          onClick={handleSetup2FA}
          size="sm"
          className="w-full"
        >
          Set Up 2FA Now
        </Button>
      </AlertDescription>
    </Alert>
  );
};
