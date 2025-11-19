-- Create workflow_rules table
CREATE TABLE public.workflow_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'status_change', 'time_based', 'field_update'
  trigger_conditions JSONB NOT NULL, -- e.g., {"from_status": "draft", "to_status": "in_progress"}
  actions JSONB NOT NULL, -- e.g., [{"type": "create_task", "params": {...}}, {"type": "send_notification", "params": {...}}]
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create automated_tasks table
CREATE TABLE public.automated_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  workflow_rule_id UUID REFERENCES public.workflow_rules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID, -- user_id
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workflow_executions table for logging
CREATE TABLE public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_rule_id UUID NOT NULL REFERENCES public.workflow_rules(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  trigger_data JSONB,
  actions_executed JSONB,
  status TEXT DEFAULT 'success', -- 'success', 'failed', 'partial'
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  related_deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  related_task_id UUID REFERENCES public.automated_tasks(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for performance
CREATE INDEX idx_workflow_rules_active ON public.workflow_rules(is_active);
CREATE INDEX idx_automated_tasks_deal ON public.automated_tasks(deal_id);
CREATE INDEX idx_automated_tasks_assigned ON public.automated_tasks(assigned_to);
CREATE INDEX idx_automated_tasks_status ON public.automated_tasks(status);
CREATE INDEX idx_workflow_executions_deal ON public.workflow_executions(deal_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_rules
CREATE POLICY "Admins and super admins can manage workflow rules"
  ON public.workflow_rules
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Team members can view workflow rules"
  ON public.workflow_rules
  FOR SELECT
  USING (
    has_role(auth.uid(), 'team_member'::app_role) OR
    has_role(auth.uid(), 'broker'::app_role)
  );

-- RLS Policies for automated_tasks
CREATE POLICY "Users can view tasks assigned to them"
  ON public.automated_tasks
  FOR SELECT
  USING (
    auth.uid() = assigned_to OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role) OR
    can_access_deal(auth.uid(), deal_id)
  );

CREATE POLICY "Users can update their assigned tasks"
  ON public.automated_tasks
  FOR UPDATE
  USING (
    auth.uid() = assigned_to OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "System can create automated tasks"
  ON public.automated_tasks
  FOR INSERT
  WITH CHECK (true); -- Edge functions will create tasks

-- RLS Policies for workflow_executions
CREATE POLICY "Admins can view workflow executions"
  ON public.workflow_executions
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "System can log workflow executions"
  ON public.workflow_executions
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Add updated_at triggers
CREATE TRIGGER update_workflow_rules_updated_at
  BEFORE UPDATE ON public.workflow_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automated_tasks_updated_at
  BEFORE UPDATE ON public.automated_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check for idle deals and create notifications
CREATE OR REPLACE FUNCTION public.check_idle_deals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deal_record RECORD;
  assigned_broker_id UUID;
BEGIN
  -- Find deals that haven't been updated in 7 days and are in active status
  FOR deal_record IN
    SELECT d.id, d.name, d.user_id, d.updated_at, p.assigned_broker
    FROM deals d
    LEFT JOIN profiles p ON d.user_id = p.id
    WHERE d.status IN ('draft', 'in_progress', 'submitted')
      AND d.updated_at < NOW() - INTERVAL '7 days'
  LOOP
    -- Notify the client
    INSERT INTO notifications (user_id, title, message, type, related_deal_id)
    VALUES (
      deal_record.user_id,
      'Idle Deal Alert',
      'Your deal "' || deal_record.name || '" has been inactive for 7 days.',
      'warning',
      deal_record.id
    );
    
    -- Notify the broker if assigned
    IF deal_record.assigned_broker IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, related_deal_id)
      VALUES (
        deal_record.assigned_broker,
        'Client Deal Idle',
        'Deal "' || deal_record.name || '" has been inactive for 7 days.',
        'warning',
        deal_record.id
      );
    END IF;
  END LOOP;
END;
$$;

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.automated_tasks;