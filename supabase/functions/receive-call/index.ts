import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const {
      From: from,
      To: to,
      CallSid: callSid,
      CallStatus: callStatus,
    } = params;

    console.log('Incoming call:', { from, to, callSid, callStatus });

    // Find the client by phone number
    const cleanFrom = from.replace(/\D/g, '').slice(-10); // Get last 10 digits
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, assigned_broker, first_name, last_name, phone_number')
      .like('phone_number', `%${cleanFrom}%`)
      .limit(10);

    let profile = profiles?.find(p => p.phone_number?.replace(/\D/g, '').slice(-10) === cleanFrom);

    // Handle unassigned callers (lenders, service providers, etc.)
    if (!profile || !profile.assigned_broker) {
      console.log('Unassigned caller - presenting broker directory');
      
      // Get all active brokers
      const { data: brokers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone_number')
        .not('phone_number', 'is', null)
        .limit(10);

      if (!brokers || brokers.length === 0) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling. All representatives are currently unavailable. Please try again later.</Say>
  <Hangup/>
</Response>`;
        return new Response(twiml, {
          headers: { 'Content-Type': 'text/xml' },
        });
      }

      // Create hunt group for unassigned callers - dial all brokers simultaneously
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling. Connecting you to the next available representative.</Say>
  <Dial 
    timeout="20"
    record="record-from-answer"
    recordingStatusCallback="https://${supabaseUrl.replace('https://', '')}/functions/v1/call-status"
    recordingStatusCallbackMethod="POST"
    action="https://${supabaseUrl.replace('https://', '')}/functions/v1/call-status"
    method="POST">
    ${brokers.map(b => `<Number>${b.phone_number}</Number>`).join('\n    ')}
  </Dial>
  <Say voice="alice">All representatives are currently unavailable. Please leave a message after the tone.</Say>
  <Record maxLength="120" transcribe="true" transcribeCallback="https://${supabaseUrl.replace('https://', '')}/functions/v1/call-status"/>
</Response>`;
      
      return new Response(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Get broker's phone number
    const { data: broker } = await supabase
      .from('profiles')
      .select('phone_number, first_name, last_name')
      .eq('id', profile.assigned_broker)
      .single();

    if (!broker?.phone_number) {
      console.log('Broker has no phone number');
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Your broker is currently unavailable. Please try again later.</Say>
  <Hangup/>
</Response>`;
      
      return new Response(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Find active deal for logging
    const { data: deal } = await supabase
      .from('deals')
      .select('id')
      .eq('user_id', profile.id)
      .neq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Log the call
    if (deal) {
      await supabase.from('communication_logs').insert({
        deal_id: deal.id,
        user_id: profile.id,
        communication_type: 'call',
        direction: 'inbound',
        phone_number: from,
        status: 'ringing',
        content: `Call from ${profile.first_name || 'Unknown'} ${profile.last_name || 'Client'}`,
      });

      // Create notification for broker
      await supabase.from('notifications').insert({
        user_id: profile.assigned_broker,
        title: 'Incoming Call',
        message: `Call from ${profile.first_name} ${profile.last_name} (${from})`,
        type: 'communication',
        related_deal_id: deal.id,
      });
    }

    // Get all brokers for hunt group fallback
    const { data: allBrokers } = await supabase
      .from('profiles')
      .select('phone_number')
      .not('phone_number', 'is', null)
      .neq('id', profile.assigned_broker)
      .limit(10);

    // Forward call to assigned broker first, then hunt group if no answer
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to ${broker.first_name || 'your broker'}.</Say>
  <Dial 
    callerId="${from}"
    timeout="15"
    record="record-from-answer"
    recordingStatusCallback="https://${supabaseUrl.replace('https://', '')}/functions/v1/call-status"
    recordingStatusCallbackMethod="POST"
    action="https://${supabaseUrl.replace('https://', '')}/functions/v1/call-status"
    method="POST">
    <Number>${broker.phone_number}</Number>
  </Dial>
  ${allBrokers && allBrokers.length > 0 ? `
  <Say voice="alice">Your broker is not available. Connecting you to the next available representative.</Say>
  <Dial 
    timeout="20"
    record="record-from-answer"
    recordingStatusCallback="https://${supabaseUrl.replace('https://', '')}/functions/v1/call-status"
    recordingStatusCallbackMethod="POST">
    ${allBrokers.map(b => `<Number>${b.phone_number}</Number>`).join('\n    ')}
  </Dial>` : ''}
  <Say voice="alice">All representatives are currently unavailable. Please leave a message after the tone.</Say>
  <Record maxLength="120" transcribe="true" transcribeCallback="https://${supabaseUrl.replace('https://', '')}/functions/v1/call-status"/>
</Response>`;

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error processing call:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We're sorry, but we're experiencing technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>`;
    
    return new Response(errorTwiml, {
      status: 500,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
});
