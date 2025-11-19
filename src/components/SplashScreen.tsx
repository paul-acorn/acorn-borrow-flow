import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import acornLogo from "@/assets/acorn-icon-blue.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading time for premium feel
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <div className="p-8 text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src={acornLogo} 
              alt="Acorn Finance - Get Funded" 
              className="h-16 w-auto"
            />
          </div>

          {/* Welcome Message */}
          <div className="space-y-4">
            <h1 className="text-2xl font-medium text-navy">
              Professional Finance Platform
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Bridging Finance • Mortgages • Development Finance
              <br />
              <span className="text-sm font-medium text-premium">FCA Regulated</span>
            </p>
          </div>

          {/* Action Buttons */}
          {isLoaded && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <Button 
                size="lg" 
                className="w-full bg-gradient-primary hover:opacity-90 text-white font-medium"
                onClick={onComplete}
              >
                Get Started
              </Button>
              
              <div className="text-xs text-muted-foreground pt-2">
                Secure • Professional • Compliant
              </div>
            </div>
          )}

          {!isLoaded && (
            <div className="flex justify-center py-4">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}