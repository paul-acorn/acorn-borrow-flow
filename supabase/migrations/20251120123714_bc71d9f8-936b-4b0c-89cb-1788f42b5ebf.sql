-- Fix RLS policy for brokers creating deals
DROP POLICY IF EXISTS "Brokers can create deals for their clients" ON public.deals;

-- Brokers can create deals for any client assigned to them
CREATE POLICY "Brokers can create deals for their clients"
ON public.deals
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'broker'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = deals.user_id 
    AND profiles.assigned_broker = auth.uid()
  )
);

-- Brokers can view deals for their clients
CREATE POLICY "Brokers can view their clients' deals"
ON public.deals
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'broker'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = deals.user_id
    AND profiles.assigned_broker = auth.uid()
  )
);

-- Brokers can update deals for their clients
CREATE POLICY "Brokers can update their clients' deals"
ON public.deals
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'broker'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = deals.user_id
    AND profiles.assigned_broker = auth.uid()
  )
);

-- Brokers can view automated tasks for their clients' deals
CREATE POLICY "Brokers can view their clients' tasks"
ON public.automated_tasks
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'broker'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.deals d
    JOIN public.profiles p ON d.user_id = p.id
    WHERE d.id = automated_tasks.deal_id
    AND p.assigned_broker = auth.uid()
  )
);

-- Brokers can update tasks for their clients' deals
CREATE POLICY "Brokers can update their clients' tasks"
ON public.automated_tasks
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'broker'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.deals d
    JOIN public.profiles p ON d.user_id = p.id
    WHERE d.id = automated_tasks.deal_id
    AND p.assigned_broker = auth.uid()
  )
);

-- Brokers can view their clients' communication logs
CREATE POLICY "Brokers can view their clients' communication logs"
ON public.communication_logs
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'broker'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.deals d
    JOIN public.profiles p ON d.user_id = p.id
    WHERE d.id = communication_logs.deal_id
    AND p.assigned_broker = auth.uid()
  )
);

-- Brokers can insert communication logs for their clients
CREATE POLICY "Brokers can insert their clients' communication logs"
ON public.communication_logs
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'broker'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.deals d
    JOIN public.profiles p ON d.user_id = p.id
    WHERE d.id = communication_logs.deal_id
    AND p.assigned_broker = auth.uid()
  )
);