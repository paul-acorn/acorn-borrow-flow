import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
      Digits: digits,
    } = params;

    console.log('IVR menu input:', { from, digits });

    // Get all brokers for the menu
    const { data: brokers } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone_number')
      .not('phone_number', 'is', null)
      .order('first_name', { ascending: true })
      .limit(9); // Max 9 for single digit dialing

    if (!brokers || brokers.length === 0) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">No representatives are available. Please try again later.</Say>
  <Hangup/>
</Response>`;
      return new Response(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Handle digit input
    const digitIndex = parseInt(digits) - 1;
    
    // 0 = operator/hunt group
    if (digits === '0') {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to the next available representative.</Say>
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

    // Check if digit is valid (1-9 and within range)
    if (digitIndex >= 0 && digitIndex < brokers.length) {
      const selectedBroker = brokers[digitIndex];
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to ${selectedBroker.first_name || 'your representative'}.</Say>
  <Dial 
    callerId="${from}"
    timeout="15"
    record="record-from-answer"
    recordingStatusCallback="https://${supabaseUrl.replace('https://', '')}/functions/v1/call-status"
    recordingStatusCallbackMethod="POST"
    action="https://${supabaseUrl.replace('https://', '')}/functions/v1/call-status"
    method="POST">
    <Number>${selectedBroker.phone_number}</Number>
  </Dial>
  <Say voice="alice">Your representative is not available. Connecting you to the next available representative.</Say>
  <Dial 
    timeout="20"
    record="record-from-answer"
    recordingStatusCallback="https://${supabaseUrl.replace('https://', '')}/functions/v1/call-status"
    recordingStatusCallbackMethod="POST">
    ${brokers.filter((_, i) => i !== digitIndex).map(b => `<Number>${b.phone_number}</Number>`).join('\n    ')}
  </Dial>
  <Say voice="alice">All representatives are currently unavailable. Please leave a message after the tone.</Say>
  <Record maxLength="120" transcribe="true" transcribeCallback="https://${supabaseUrl.replace('https://', '')}/functions/v1/call-status"/>
</Response>`;
      
      return new Response(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Invalid digit - replay menu
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Invalid selection. Please try again.</Say>
  <Redirect>https://${supabaseUrl.replace('https://', '')}/functions/v1/receive-call</Redirect>
</Response>`;
    
    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error processing IVR menu:', error);
    
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
