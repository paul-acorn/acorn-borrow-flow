Deno.serve(async (req) => {
  // Return TwiML to connect the outbound call
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="30">
    <Number>${new URL(req.url).searchParams.get('To') || ''}</Number>
  </Dial>
</Response>`;

  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
});
