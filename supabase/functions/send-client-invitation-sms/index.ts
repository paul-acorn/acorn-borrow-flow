import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');
const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

interface SendInvitationSmsRequest {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  secureToken: string;
  brokerName: string;
  channel: 'sms' | 'whatsapp';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      phoneNumber, 
      firstName, 
      lastName, 
      secureToken, 
      brokerName,
      channel 
    }: SendInvitationSmsRequest = await req.json();

    console.log(`Sending ${channel} invitation to ${firstName} ${lastName} at ${phoneNumber}`);

    // Build secure invitation URL
    const invitationUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovable.app/invite/${secureToken}`;

    // Format the message
    const message = `Hi ${firstName}! ${brokerName} from Acorn Finance has invited you to create your account. Click here to get started: ${invitationUrl}`;

    // Send via Twilio
    const fromNumber = channel === 'whatsapp' 
      ? `whatsapp:${TWILIO_WHATSAPP_NUMBER}`
      : TWILIO_PHONE_NUMBER;
    
    const toNumber = channel === 'whatsapp' 
      ? `whatsapp:${phoneNumber}`
      : phoneNumber;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const formData = new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: message,
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioResult);
      throw new Error(`Twilio error: ${twilioResult.message || 'Unknown error'}`);
    }

    console.log(`${channel} invitation sent successfully:`, twilioResult.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: twilioResult.sid,
        status: twilioResult.status 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
