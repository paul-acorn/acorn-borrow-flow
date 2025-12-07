import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Smartphone, Key, Copy, CheckCircle2 } from "lucide-react";
import { TOTP } from "otpauth";
import QRCode from "qrcode";

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
}

export const TwoFactorSetup = ({ open, onOpenChange, userId, userEmail }: TwoFactorSetupProps) => {
  const [totpSecret, setTotpSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [smsPhone, setSmsPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<"setup" | "verify" | "backup">("setup");

  useEffect(() => {
    if (open) {
      generateTOTPSecret();
    }
  }, [open]);

  const generateTOTPSecret = async () => {
    const totp = new TOTP({
      issuer: "Acorn Finance",
      label: userEmail,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    const secret = totp.secret.base32;
    setTotpSecret(secret);

    const otpauthUrl = totp.toString();
    const qrUrl = await QRCode.toDataURL(otpauthUrl);
    setQrCodeUrl(qrUrl);
  };

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 8 }, () => {
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    });
    setBackupCodes(codes);
    return codes;
  };

  const verifyTOTP = async () => {
    setIsVerifying(true);
    try {
      const totp = new TOTP({
        issuer: "Acorn Finance",
        label: userEmail,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: totpSecret,
      });

      const isValid = totp.validate({ token: totpCode, window: 1 }) !== null;

      if (!isValid) {
        toast.error("Invalid code", {
          description: "Please check the code and try again"
        });
        return;
      }

      const codes = generateBackupCodes();

      const { error } = await supabase
        .from("two_factor_auth")
        .upsert({
          user_id: userId,
          totp_secret: totpSecret,
          totp_enabled: true,
          backup_codes: codes,
        });

      if (error) throw error;

      setStep("backup");
      toast.success("TOTP enabled successfully!");
    } catch (error: any) {
      console.error("Error enabling TOTP:", error);
      toast.error("Failed to enable TOTP", {
        description: error.message
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const sendSMSCode = async () => {
    setIsVerifying(true);
    try {
      const { error } = await supabase.functions.invoke("send-sms", {
        body: {
          to: smsPhone,
          message: `Your Acorn Finance verification code is: ${Math.floor(100000 + Math.random() * 900000)}`,
        },
      });

      if (error) throw error;

      toast.success("Verification code sent!");
      setStep("verify");
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      toast.error("Failed to send SMS", {
        description: error.message
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const verifySMS = async () => {
    setIsVerifying(true);
    try {
      // In a real implementation, verify the SMS code with backend
      const codes = generateBackupCodes();

      const { error } = await supabase
        .from("two_factor_auth")
        .upsert({
          user_id: userId,
          sms_phone_number: smsPhone,
          sms_enabled: true,
          backup_codes: codes,
        });

      if (error) throw error;

      setStep("backup");
      toast.success("SMS 2FA enabled successfully!");
    } catch (error: any) {
      console.error("Error enabling SMS 2FA:", error);
      toast.error("Failed to enable SMS 2FA", {
        description: error.message
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard");
  };

  const handleClose = () => {
    setStep("setup");
    setTotpCode("");
    setSmsCode("");
    setSmsPhone("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Add an extra layer of security to your account
          </DialogDescription>
        </DialogHeader>

        {step === "setup" && (
          <Tabs defaultValue="totp" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="totp">
                <Key className="h-4 w-4 mr-2" />
                Authenticator App
              </TabsTrigger>
              <TabsTrigger value="sms">
                <Smartphone className="h-4 w-4 mr-2" />
                SMS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="totp" className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                {qrCodeUrl && (
                  <div className="flex justify-center p-4 bg-background border rounded-lg">
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                  </div>
                )}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Or enter this code manually:</p>
                  <code className="text-sm font-mono break-all">{totpSecret}</code>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totp-code">Verification Code</Label>
                <Input
                  id="totp-code"
                  placeholder="Enter 6-digit code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                />
              </div>

              <Button
                onClick={verifyTOTP}
                disabled={totpCode.length !== 6 || isVerifying}
                className="w-full"
              >
                {isVerifying ? "Verifying..." : "Enable TOTP"}
              </Button>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Enter your phone number to receive verification codes via SMS
                </p>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+44 7XXX XXXXXX"
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                />
              </div>

              <Button
                onClick={sendSMSCode}
                disabled={!smsPhone || isVerifying}
                className="w-full"
              >
                {isVerifying ? "Sending..." : "Send Verification Code"}
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-code">Verification Code</Label>
              <Input
                id="sms-code"
                placeholder="Enter 6-digit code"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
              />
            </div>

            <Button
              onClick={verifySMS}
              disabled={smsCode.length !== 6 || isVerifying}
              className="w-full"
            >
              {isVerifying ? "Verifying..." : "Verify and Enable"}
            </Button>
          </div>
        )}

        {step === "backup" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <Shield className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Save Your Backup Codes</p>
                <p className="text-xs text-muted-foreground">
                  Store these codes in a safe place. Each code can be used once if you lose access to your 2FA device.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Backup Codes</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyBackupCodes}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
