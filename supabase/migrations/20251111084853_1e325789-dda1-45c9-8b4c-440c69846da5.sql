-- Create deal_activity_logs table for tracking all changes and activities
CREATE TABLE public.deal_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal_activity_logs ENABLE ROW LEVEL SECURITY;

-- Deal participants can view activity logs
CREATE POLICY "Deal participants can view activity logs"
ON public.deal_activity_logs
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'team_member'::app_role) OR
  can_access_deal(auth.uid(), deal_id)
);

-- Authenticated users can create activity logs
CREATE POLICY "Authenticated users can create activity logs"
ON public.deal_activity_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_deal_activity_logs_deal_id ON public.deal_activity_logs(deal_id);
CREATE INDEX idx_deal_activity_logs_created_at ON public.deal_activity_logs(created_at DESC);

-- Add realtime for activity logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_activity_logs;

-- Enable replica identity for deals table to support realtime updates
ALTER TABLE public.deals REPLICA IDENTITY FULL;