import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
        // Fetch invitation details using the secure token
        const { data, error: fetchError } = await supabase
          .from("team_invitations")
          .select("client_first_name, client_last_name, client_email, deal_code, expires_at, used_at")
          .eq("secure_token", token)
          .single();

        if (fetchError || !data) {
          setError("Invalid or expired invitation link");
          setLoading(false);
          return;
        }

        // Check if invitation has been used
        if (data.used_at) {
          setError("This invitation has already been used");
          setLoading(false);
          return;
        }

        // Check if invitation has expired
        if (new Date(data.expires_at) < new Date()) {
          setError("This invitation has expired");
          setLoading(false);
          return;
        }

        // Set invitation data for pre-filling the form
        setInvitationData({
          firstName: data.client_first_name || "",
          lastName: data.client_last_name || "",
          email: data.client_email || "",
          dealCode: data.deal_code,
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
