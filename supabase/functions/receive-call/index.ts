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

    // Get all brokers for IVR menu
    const { data: brokers } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone_number')
      .not('phone_number', 'is', null)
      .order('first_name', { ascending: true })
      .limit(9); // Max 9 for single digit dialing

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

    // Build IVR menu with recording disclosure
    let menuText = 'Thank you for calling. Please note that this call may be recorded for training and regulatory purposes. ';
    menuText += 'Please select from the following options. ';
    
    brokers.forEach((broker, index) => {
      menuText += `Press ${index + 1} for ${broker.first_name || 'representative'} ${broker.last_name || ''}. `;
    });
    
    menuText += 'Press 0 to speak with the next available representative.';

    // Present IVR menu with digit gathering
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather 
    numDigits="1" 
    timeout="10"
    action="https://${supabaseUrl.replace('https://', '')}/functions/v1/ivr-menu"
    method="POST">
    <Say voice="alice">${menuText}</Say>
  </Gather>
  <Say voice="alice">We didn't receive your selection. Connecting you to the next available representative.</Say>
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
