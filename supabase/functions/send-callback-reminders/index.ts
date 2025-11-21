import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface ScheduledCallback {
  id: string;
  scheduled_at: string;
  title: string;
  notes: string | null;
  scheduled_by: string;
  scheduled_with: string;
  deal_id: string | null;
  reminder_24h_sent: boolean;
  reminder_1h_sent: boolean;
  reminder_10m_sent: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const in10Minutes = new Date(now.getTime() + 10 * 60 * 1000);

    console.log('Checking for callbacks to remind...');

    // Get pending callbacks that need reminders
    const { data: callbacks, error } = await supabase
      .from('scheduled_callbacks')
      .select('*')
      .eq('status', 'pending')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', in24Hours.toISOString());

    if (error) {
      console.error('Error fetching callbacks:', error);
      throw error;
    }

    console.log(`Found ${callbacks?.length || 0} callbacks to check`);

    for (const callback of callbacks || []) {
      const scheduledTime = new Date(callback.scheduled_at);
      const timeUntil = scheduledTime.getTime() - now.getTime();
      const hoursUntil = timeUntil / (1000 * 60 * 60);

      // Determine which reminder to send
      let reminderType: '24h' | '1h' | '10m' | null = null;
      
      if (!callback.reminder_24h_sent && hoursUntil <= 24 && hoursUntil > 23) {
        reminderType = '24h';
      } else if (!callback.reminder_1h_sent && hoursUntil <= 1 && hoursUntil > 0.83) {
        reminderType = '1h';
      } else if (!callback.reminder_10m_sent && timeUntil <= 10 * 60 * 1000 && timeUntil > 5 * 60 * 1000) {
        reminderType = '10m';
      }

      if (reminderType) {
        console.log(`Sending ${reminderType} reminder for callback ${callback.id}`);
        await sendReminders(supabase, callback, reminderType, scheduledTime);
        
        // Mark reminder as sent
        const updateField = `reminder_${reminderType}_sent`;
        await supabase
          .from('scheduled_callbacks')
          .update({ [updateField]: true })
          .eq('id', callback.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: callbacks?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-callback-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendReminders(
  supabase: any,
  callback: ScheduledCallback,
  reminderType: '24h' | '1h' | '10m',
  scheduledTime: Date
) {
  // Get profiles for both parties
  const { data: scheduledByProfile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone_number')
    .eq('id', callback.scheduled_by)
    .single();

  const { data: scheduledWithProfile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone_number')
    .eq('id', callback.scheduled_with)
    .single();

  // Get notification preferences for both parties
  const { data: scheduledByPrefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', callback.scheduled_by)
    .single();

  const { data: scheduledWithPrefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', callback.scheduled_with)
    .single();

  const timeLabels = {
    '24h': '24 hours',
    '1h': '1 hour',
    '10m': '10 minutes'
  };

  const formattedTime = scheduledTime.toLocaleString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Send to scheduled_by user
  if (scheduledByProfile) {
    const message = `Reminder: You have a scheduled callback "${callback.title}" in ${timeLabels[reminderType]} at ${formattedTime}${callback.notes ? `. Notes: ${callback.notes}` : ''}`;
    
    if (scheduledByPrefs?.email_enabled) {
      try {
        await resend.emails.send({
          from: 'Acorn Finance <notifications@acorn.finance>',
          to: [scheduledByProfile.email],
          subject: `Callback Reminder: ${callback.title}`,
          html: `
            <h2>Callback Reminder</h2>
            <p>This is a reminder that you have a scheduled callback in ${timeLabels[reminderType]}:</p>
            <p><strong>Title:</strong> ${callback.title}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>With:</strong> ${scheduledWithProfile?.first_name} ${scheduledWithProfile?.last_name}</p>
            ${callback.notes ? `<p><strong>Notes:</strong> ${callback.notes}</p>` : ''}
            <p>Best regards,<br>Acorn Finance Team</p>
          `
        });
        console.log(`Email sent to ${scheduledByProfile.email}`);
      } catch (error) {
        console.error('Error sending email:', error);
      }
    }

    if (scheduledByPrefs?.sms_enabled && scheduledByProfile.phone_number) {
      await sendSMS(scheduledByProfile.phone_number, message);
    }
  }

  // Send to scheduled_with user
  if (scheduledWithProfile) {
    const message = `Reminder: You have a scheduled callback "${callback.title}" in ${timeLabels[reminderType]} at ${formattedTime}${callback.notes ? `. Notes: ${callback.notes}` : ''}`;
    
    if (scheduledWithPrefs?.email_enabled) {
      try {
        await resend.emails.send({
          from: 'Acorn Finance <notifications@acorn.finance>',
          to: [scheduledWithProfile.email],
          subject: `Callback Reminder: ${callback.title}`,
          html: `
            <h2>Callback Reminder</h2>
            <p>This is a reminder that you have a scheduled callback in ${timeLabels[reminderType]}:</p>
            <p><strong>Title:</strong> ${callback.title}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>With:</strong> ${scheduledByProfile?.first_name} ${scheduledByProfile?.last_name}</p>
            ${callback.notes ? `<p><strong>Notes:</strong> ${callback.notes}</p>` : ''}
            <p>Best regards,<br>Acorn Finance Team</p>
          `
        });
        console.log(`Email sent to ${scheduledWithProfile.email}`);
      } catch (error) {
        console.error('Error sending email:', error);
      }
    }

    if (scheduledWithPrefs?.sms_enabled && scheduledWithProfile.phone_number) {
      await sendSMS(scheduledWithProfile.phone_number, message);
    }
  }

  // Create in-app notifications for both parties
  await supabase.from('notifications').insert([
    {
      user_id: callback.scheduled_by,
      title: 'Callback Reminder',
      message: `Callback "${callback.title}" is scheduled in ${timeLabels[reminderType]} at ${formattedTime}`,
      type: 'info',
      related_deal_id: callback.deal_id
    },
    {
      user_id: callback.scheduled_with,
      title: 'Callback Reminder',
      message: `Callback "${callback.title}" is scheduled in ${timeLabels[reminderType]} at ${formattedTime}`,
      type: 'info',
      related_deal_id: callback.deal_id
    }
  ]);
}

async function sendSMS(to: string, message: string) {
  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Twilio credentials not configured');
      return;
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio API error:', error);
      throw new Error(`Twilio API error: ${response.status}`);
    }

    console.log(`SMS sent to ${to}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}
