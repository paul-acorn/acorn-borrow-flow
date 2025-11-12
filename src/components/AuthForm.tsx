import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { TermsPrivacyModal } from "@/components/TermsPrivacyModal";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(1, "This field is required");

interface AuthFormProps {
  onBack: () => void;
}

export function AuthForm({ onBack }: AuthFormProps) {
  const { signIn, signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [isCheckingInvitation, setIsCheckingInvitation] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);

      const { error } = await signIn(loginEmail, loginPassword);
      
      if (error) {
        toast.error("Login failed", {
          description: error.message || "Invalid email or password"
        });
      } else {
        toast.success("Login successful!", {
          description: "Welcome back to Acorn Finance"
        });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error("Validation error", {
          description: err.errors[0].message
        });
      } else {
        toast.error("An error occurred", {
          description: "Please try again"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termsAccepted || !privacyAccepted) {
      toast.error("Terms Required", {
        description: "Please accept the Terms and Privacy Policy to continue"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      emailSchema.parse(registerEmail);
      passwordSchema.parse(registerPassword);
      nameSchema.parse(firstName);
      nameSchema.parse(lastName);

      const { error } = await signUp(
        registerEmail, 
        registerPassword, 
        firstName, 
        lastName,
        invitationCode || undefined
      );
      
      if (error) {
        toast.error("Registration failed", {
          description: error.message || "Please try again"
        });
      } else {
        toast.success("Registration successful!", {
          description: "Please check your email to verify your account"
        });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error("Validation error", {
          description: err.errors[0].message
        });
      } else {
        toast.error("An error occurred", {
          description: "Please try again"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermsAccept = (terms: boolean, privacy: boolean) => {
    setTermsAccepted(terms);
    setPrivacyAccepted(privacy);
  };

  // Fetch invitation details when code is entered
  const handleInvitationCodeChange = async (code: string) => {
    const upperCode = code.toUpperCase();
    setInvitationCode(upperCode);
    
    if (upperCode.length >= 8) {
      setIsCheckingInvitation(true);
      try {
        const { data: invitation, error } = await supabase
          .from('team_invitations')
          .select('client_first_name, client_last_name, client_email')
          .eq('invitation_code', upperCode)
          .is('used_at', null)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (!error && invitation) {
          if (invitation.client_first_name) setFirstName(invitation.client_first_name);
          if (invitation.client_last_name) setLastName(invitation.client_last_name);
          if (invitation.client_email) setRegisterEmail(invitation.client_email);
          toast.success("Invitation found! Details pre-populated.");
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
      } finally {
        setIsCheckingInvitation(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-medium text-navy">
              Access Your Account
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="login" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-secondary">
                <TabsTrigger value="login" className="data-[state=active]:bg-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-white">
                  Register  
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Test Login Credentials:</p>
                  <p className="text-xs text-foreground">Email: <span className="font-mono">demo@acornfinance.com</span></p>
                  <p className="text-xs text-foreground">Password: <span className="font-mono">demo123</span></p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg"
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                  Forgot your password?{" "}
                  <button className="text-premium hover:underline font-medium">
                    Reset here
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName"
                        placeholder="Smith"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regEmail">Email Address</Label>
                    <Input 
                      id="regEmail"
                      type="email"
                      placeholder="your@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invitationCode">Invitation Code (Optional)</Label>
                    <Input 
                      id="invitationCode"
                      type="text"
                      placeholder="Enter code if you have one"
                      value={invitationCode}
                      onChange={(e) => handleInvitationCodeChange(e.target.value)}
                      className="h-11"
                      disabled={isCheckingInvitation}
                    />
                    {isCheckingInvitation && (
                      <p className="text-xs text-muted-foreground">Checking invitation...</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regPassword">Password</Label>
                    <div className="relative">
                      <Input 
                        id="regPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create password (min 6 characters)"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg"
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={isLoading || !termsAccepted || !privacyAccepted}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>

                <div className="space-y-3">
                  <div className="text-xs text-center text-muted-foreground leading-relaxed">
                    By registering, you agree to our{" "}
                    <button 
                      onClick={() => setShowTermsModal(true)}
                      className="text-premium hover:underline font-medium"
                    >
                      Terms of Service
                    </button>
                    {" "}and{" "}
                    <button 
                      onClick={() => setShowTermsModal(true)}
                      className="text-premium hover:underline font-medium"
                    >
                      Privacy Policy
                    </button>
                  </div>
                  {(termsAccepted && privacyAccepted) && (
                    <div className="flex items-center justify-center gap-2 text-success text-sm">
                      <span className="text-lg">✓</span>
                      <span>Terms and Privacy accepted</span>
                    </div>
                  )}
                  {!(termsAccepted && privacyAccepted) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTermsModal(true)}
                      className="w-full"
                    >
                      Review & Accept Terms
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <TermsPrivacyModal
        open={showTermsModal}
        onOpenChange={setShowTermsModal}
        onAccept={handleTermsAccept}
      />
    </div>
  );
}
