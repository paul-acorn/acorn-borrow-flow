-- Allow brokers to create deals for their clients
CREATE POLICY "Brokers can create deals for their clients"
ON public.deals
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'broker'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = deals.user_id
    AND assigned_broker = auth.uid()
  )
);