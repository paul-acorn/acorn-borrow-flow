import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

// Verify Twilio webhook signature
function verifyTwilioSignature(signature: string, url: string, params: Record<string, string>): boolean {
  if (!TWILIO_AUTH_TOKEN) return false;
  
  const data = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  
  const hmac = createHmac('sha1', TWILIO_AUTH_TOKEN);
  hmac.update(url + data);
  const expectedSignature = hmac.digest('base64');
  
  return signature === expectedSignature;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify Twilio signature for security
    const signature = req.headers.get('X-Twilio-Signature');
    const url = new URL(req.url).toString();
    
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    if (signature && !verifyTwilioSignature(signature, url, params)) {
      throw new Error('Invalid Twilio signature');
    }

    const {
      From: from,
      To: to,
      Body: body,
      MessageSid: messageSid,
      NumMedia: numMedia,
    } = params;

    console.log('Received message:', { from, to, body, messageSid });

    // Determine if it's SMS or WhatsApp
    const channel = from.startsWith('whatsapp:') ? 'whatsapp' : 'sms';
    const cleanFrom = from.replace('whatsapp:', '');

    // Find the client by phone number
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, assigned_broker')
      .eq('phone_number', cleanFrom)
      .single();

    if (profileError || !profile) {
      console.error('Client not found:', profileError);
      return new Response('Client not found', { status: 404 });
    }

    // Find an active deal for this client
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('id')
      .eq('user_id', profile.id)
      .neq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (dealError || !deal) {
      console.error('No active deal found:', dealError);
      return new Response('No active deal found', { status: 404 });
    }

    // Log the incoming message
    const { error: logError } = await supabase
      .from('communication_logs')
      .insert({
        deal_id: deal.id,
        user_id: profile.id,
        communication_type: channel,
        direction: 'inbound',
        phone_number: cleanFrom,
        content: body,
        status: 'received',
      });

    if (logError) {
      console.error('Error logging message:', logError);
      throw logError;
    }

    // Create notification for the assigned broker
    if (profile.assigned_broker) {
      await supabase
        .from('notifications')
        .insert({
          user_id: profile.assigned_broker,
          title: `New ${channel.toUpperCase()} message`,
          message: `You have a new ${channel} message from ${cleanFrom}: ${body.substring(0, 50)}${body.length > 50 ? '...' : ''}`,
          type: 'communication',
          related_deal_id: deal.id,
        });
    }

    console.log('Message logged successfully');

    // Respond to Twilio (empty response means we received it)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
