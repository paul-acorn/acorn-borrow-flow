import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking for idle deals...');

    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Find deals that haven't been updated in 7 days and are in active status
    const { data: idleDeals, error: dealsError } = await supabase
      .from('deals')
      .select(`
        id,
        name,
        user_id,
        updated_at,
        profiles:user_id(assigned_broker, first_name, last_name)
      `)
      .in('status', ['draft', 'in_progress', 'submitted'])
      .lt('updated_at', sevenDaysAgo);

    if (dealsError) {
      throw dealsError;
    }

    console.log(`Found ${idleDeals?.length || 0} idle deals`);

    const notificationsCreated = [];

    for (const deal of idleDeals || []) {
      // Check if we already sent a notification in the last 7 days
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('related_deal_id', deal.id)
        .eq('type', 'warning')
        .gte('created_at', sevenDaysAgo)
        .limit(1)
        .single();

      if (existingNotification) {
        console.log(`Already notified about deal ${deal.id} recently`);
        continue;
      }

      // Notify the client
      const { error: clientNotifError } = await supabase
        .from('notifications')
        .insert({
          user_id: deal.user_id,
          title: 'Idle Deal Alert',
          message: `Your deal "${deal.name}" has been inactive for 7 days. Please review and take action.`,
          type: 'warning',
          related_deal_id: deal.id,
        });

      if (!clientNotifError) {
        notificationsCreated.push({ dealId: deal.id, recipient: 'client' });
      }

      // Notify the broker if assigned
      if (deal.profiles?.assigned_broker) {
        const clientName = deal.profiles.first_name && deal.profiles.last_name
          ? `${deal.profiles.first_name} ${deal.profiles.last_name}`
          : 'Client';

        const { error: brokerNotifError } = await supabase
          .from('notifications')
          .insert({
            user_id: deal.profiles.assigned_broker,
            title: 'Client Deal Idle',
            message: `${clientName}'s deal "${deal.name}" has been inactive for 7 days.`,
            type: 'warning',
            related_deal_id: deal.id,
          });

        if (!brokerNotifError) {
          notificationsCreated.push({ dealId: deal.id, recipient: 'broker' });
        }
      }

      // Create an automated task for the broker or client
      await supabase.from('automated_tasks').insert({
        deal_id: deal.id,
        title: 'Review Idle Deal',
        description: `This deal has been inactive for 7 days. Please review and take action.`,
        assigned_to: deal.profiles?.assigned_broker || deal.user_id,
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        idleDealsFound: idleDeals?.length || 0,
        notificationsCreated: notificationsCreated.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking idle deals:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
