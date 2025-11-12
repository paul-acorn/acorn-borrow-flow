import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";

interface TermsPrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (termsAccepted: boolean, privacyAccepted: boolean, marketingAccepted: boolean) => void;
}

export function TermsPrivacyModal({ open, onOpenChange, onAccept }: TermsPrivacyModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);

  const handleAccept = () => {
    if (termsAccepted && privacyAccepted) {
      onAccept(termsAccepted, privacyAccepted, marketingAccepted);
      onOpenChange(false);
    }
  };

  const canAccept = termsAccepted && privacyAccepted;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Terms & Privacy</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Terms and Conditions Summary</h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>By proceeding, you agree to our terms and conditions including:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Accurate information provision</li>
                  <li>Consent to credit and affordability checks</li>
                  <li>Understanding that this is not a guarantee of lending</li>
                  <li>Agreement to our data processing policies</li>
                </ul>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Privacy Policy Summary</h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>We are committed to protecting your privacy:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Your data is encrypted and stored securely</li>
                  <li>Information is only shared with relevant lenders</li>
                  <li>You can request data deletion at any time</li>
                  <li>We comply with GDPR and UK data protection laws</li>
                  <li>FCA regulated - your data is protected</li>
                </ul>
                <p className="mt-2">
                  <a 
                    href="https://acorn.finance/privacy-policy-how-acorn-finance-protects-your-data-fca-regulated" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Read full Privacy Policy →
                  </a>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the Terms and Conditions *
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="privacy" 
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(!!checked)}
                />
                <Label htmlFor="privacy" className="text-sm">
                  I agree to the Privacy Policy *
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="marketing" 
                  checked={marketingAccepted}
                  onCheckedChange={(checked) => setMarketingAccepted(!!checked)}
                />
                <Label htmlFor="marketing" className="text-sm">
                  I consent to receiving marketing communications (optional)
                </Label>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAccept}
              disabled={!canAccept}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              Accept & Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}