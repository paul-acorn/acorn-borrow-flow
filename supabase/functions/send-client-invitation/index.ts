import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  firstName: string;
  lastName: string;
  invitationCode: string;
  invitationUrl: string;
  brokerName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      firstName,
      lastName,
      invitationCode,
      invitationUrl,
      brokerName,
    }: InvitationEmailRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Acorn Finance <onboarding@resend.dev>",
      to: [email],
      subject: `${brokerName} has invited you to Acorn Finance`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a365d;">Welcome to Acorn Finance</h1>
          <p>Hi ${firstName},</p>
          <p>${brokerName} has invited you to join Acorn Finance to manage your financial application.</p>
          
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Your Invitation Code:</strong></p>
            <p style="font-size: 24px; font-family: monospace; color: #2d3748; margin: 0;">${invitationCode}</p>
          </div>
          
          <p>Click the button below to get started:</p>
          
          <a href="${invitationUrl}" 
             style="display: inline-block; background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Complete Registration
          </a>
          
          <p style="color: #718096; font-size: 14px;">
            This invitation will expire in 7 days. If you have any questions, please contact ${brokerName}.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          
          <p style="color: #a0aec0; font-size: 12px;">
            Acorn Finance is FCA regulated. Your data is protected and secure.
          </p>
        </div>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
