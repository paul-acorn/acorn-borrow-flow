import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface WorkflowAction {
  type: 'create_task' | 'send_notification' | 'update_field' | 'assign_broker';
  params: Record<string, any>;
}

interface WorkflowRule {
  id: string;
  name: string;
  trigger_type: string;
  trigger_conditions: Record<string, any>;
  actions: WorkflowAction[];
  is_active: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dealId, oldStatus, newStatus, userId } = await req.json();

    console.log('Processing workflows for deal:', { dealId, oldStatus, newStatus });

    // Send automatic status change notifications
    await sendStatusChangeNotifications(supabase, dealId, oldStatus, newStatus);

    // Fetch active workflow rules for status changes
    const { data: rules, error: rulesError } = await supabase
      .from('workflow_rules')
      .select('*')
      .eq('trigger_type', 'status_change')
      .eq('is_active', true);

    if (rulesError) {
      throw rulesError;
    }

    console.log(`Found ${rules?.length || 0} active workflow rules`);

    const executedActions = [];

    for (const rule of rules || []) {
      const conditions = rule.trigger_conditions;
      
      // Check if conditions match
      const matchesConditions = 
        (!conditions.from_status || conditions.from_status === oldStatus) &&
        (!conditions.to_status || conditions.to_status === newStatus);

      if (matchesConditions) {
        console.log(`Executing workflow rule: ${rule.name}`);
        
        try {
          // Execute each action in the rule
          for (const action of rule.actions) {
            await executeAction(supabase, action, dealId, userId);
            executedActions.push({ rule: rule.name, action: action.type });
          }

          // Log successful execution
          await supabase.from('workflow_executions').insert({
            workflow_rule_id: rule.id,
            deal_id: dealId,
            trigger_data: { oldStatus, newStatus },
            actions_executed: rule.actions,
            status: 'success',
          });
        } catch (error) {
          console.error(`Error executing workflow rule ${rule.name}:`, error);
          
          // Log failed execution
          await supabase.from('workflow_executions').insert({
            workflow_rule_id: rule.id,
            deal_id: dealId,
            trigger_data: { oldStatus, newStatus },
            actions_executed: rule.actions,
            status: 'failed',
            error_message: error.message,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        executedActions,
        message: `Processed ${executedActions.length} workflow actions` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing workflows:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function executeAction(
  supabase: any,
  action: WorkflowAction,
  dealId: string,
  userId: string
) {
  console.log(`Executing action: ${action.type}`, action.params);

  switch (action.type) {
    case 'create_task':
      await supabase.from('automated_tasks').insert({
        deal_id: dealId,
        title: action.params.title || 'Automated Task',
        description: action.params.description,
        assigned_to: action.params.assigned_to || userId,
        priority: action.params.priority || 'medium',
        due_date: action.params.due_date 
          ? new Date(Date.now() + action.params.due_date * 24 * 60 * 60 * 1000).toISOString()
          : null,
      });
      break;

    case 'send_notification':
      // Get deal details for context
      const { data: deal } = await supabase
        .from('deals')
        .select('name, user_id, profiles:user_id(assigned_broker)')
        .eq('id', dealId)
        .single();

      const notificationRecipients = [];
      
      if (action.params.notify_client && deal?.user_id) {
        notificationRecipients.push(deal.user_id);
      }
      
      if (action.params.notify_broker && deal?.profiles?.assigned_broker) {
        notificationRecipients.push(deal.profiles.assigned_broker);
      }

      for (const recipientId of notificationRecipients) {
        await supabase.from('notifications').insert({
          user_id: recipientId,
          title: action.params.title || 'Deal Update',
          message: action.params.message || 'Your deal has been updated',
          type: action.params.notification_type || 'info',
          related_deal_id: dealId,
        });
      }
      break;

    case 'update_field':
      const updates: Record<string, any> = {};
      if (action.params.field && action.params.value !== undefined) {
        updates[action.params.field] = action.params.value;
      }
      
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('deals')
          .update(updates)
          .eq('id', dealId);
      }
      break;

    case 'assign_broker':
      if (action.params.broker_id) {
        const { data: deal } = await supabase
          .from('deals')
          .select('user_id')
          .eq('id', dealId)
          .single();

        if (deal?.user_id) {
          await supabase
            .from('profiles')
            .update({ assigned_broker: action.params.broker_id })
            .eq('id', deal.user_id);
        }
      }
      break;

    default:
      console.warn(`Unknown action type: ${action.type}`);
  }
}

async function sendStatusChangeNotifications(
  supabase: any,
  dealId: string,
  oldStatus: string,
  newStatus: string
) {
  try {
    // Get deal and user details
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        name,
        user_id,
        profiles:user_id(email, first_name, last_name, assigned_broker)
      `)
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      console.error('Error fetching deal:', dealError);
      return;
    }

    // Check notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('email_enabled, deal_status_updates')
      .eq('user_id', deal.user_id)
      .single();

    // Create in-app notification
    await supabase.from('notifications').insert({
      user_id: deal.user_id,
      title: 'Deal Status Updated',
      message: `Your deal "${deal.name}" has moved to ${formatStatus(newStatus)}`,
      type: 'info',
      related_deal_id: dealId,
    });

    // Send email if preferences allow
    if (preferences?.email_enabled && preferences?.deal_status_updates) {
      const userEmail = deal.profiles?.email;
      const userName = deal.profiles?.first_name || 'Client';

      if (userEmail) {
        try {
          await resend.emails.send({
            from: 'Acorn Finance <notifications@acorn.finance>',
            to: [userEmail],
            subject: `Deal Status Update: ${deal.name}`,
            html: `
              <h2>Hello ${userName},</h2>
              <p>Your deal <strong>${deal.name}</strong> has been updated.</p>
              <p><strong>Status:</strong> ${formatStatus(oldStatus)} → ${formatStatus(newStatus)}</p>
              <p>Log in to your portal to view more details and track your progress.</p>
              <br>
              <p>Best regards,<br>The Acorn Finance Team</p>
            `,
          });
          console.log(`Email sent to ${userEmail} for deal status change`);
        } catch (emailError) {
          console.error('Error sending email:', emailError);
        }
      }
    }
  } catch (error) {
    console.error('Error in sendStatusChangeNotifications:', error);
  }
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
