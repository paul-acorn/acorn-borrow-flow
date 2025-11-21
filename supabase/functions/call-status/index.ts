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
      CallDuration: duration,
      CallStatus: status,
      DialCallStatus: dialStatus,
    } = params;

    console.log('Call status update:', { from, duration, status, dialStatus });

    // Find the most recent call log for this number
    const { data: logs } = await supabase
      .from('communication_logs')
      .select('*')
      .eq('phone_number', from)
      .eq('communication_type', 'call')
      .order('created_at', { ascending: false })
      .limit(1);

    if (logs && logs.length > 0) {
      const log = logs[0];
      
      // Update the call log with duration and final status
      await supabase
        .from('communication_logs')
        .update({
          duration_seconds: parseInt(duration) || 0,
          status: dialStatus === 'completed' ? 'completed' : 'missed',
        })
        .eq('id', log.id);

      // Log activity
      await supabase.from('deal_activity_logs').insert({
        deal_id: log.deal_id,
        user_id: log.user_id,
        action: `Call ${dialStatus === 'completed' ? 'completed' : 'ended'}`,
        details: {
          duration: parseInt(duration) || 0,
          status: dialStatus,
        },
      });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error updating call status:', error);
    return new Response('Error', { status: 500 });
  }
});
