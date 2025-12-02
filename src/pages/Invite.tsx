import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthForm } from "@/components/AuthForm";

const Invite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitationData, setInvitationData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    dealCode: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Invalid invitation link");
        setLoading(false);
        return;
      }

      try {
        // Use the rate-limited edge function for secure validation
        const response = await fetch(
          "https://hooffptvzsvwukvstjai.supabase.co/functions/v1/validate-invitation",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          }
        );

        const result = await response.json();

        if (response.status === 429) {
          setError(`Too many attempts. Please try again in ${result.resetIn} seconds.`);
          setLoading(false);
          return;
        }

        if (!response.ok || !result.valid) {
          setError("Invalid or expired invitation link");
          setLoading(false);
          return;
        }

        const invitation = result.invitation;

        // Set invitation data for pre-filling the form
        setInvitationData({
          firstName: invitation.client_first_name || "",
          lastName: invitation.client_last_name || "",
          email: invitation.client_email || "",
          dealCode: invitation.deal_code,
        });
        setLoading(false);
      } catch (err) {
        console.error("Error validating invitation:", err);
        setError("An error occurred while validating your invitation");
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-md w-full mx-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="text-primary hover:underline"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Acorn Finance</h1>
          <p className="text-muted-foreground">
            Create your account to get started
          </p>
        </div>
        <AuthForm 
          onBack={() => navigate("/")}
          invitationToken={token}
          invitationData={invitationData}
        />
      </div>
    </div>
  );
};

export default Invite;
