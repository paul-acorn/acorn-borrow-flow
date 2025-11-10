-- Update deals RLS policy to include super_admin
DROP POLICY IF EXISTS "Users can view their deals" ON public.deals;

CREATE POLICY "Users can view their deals"
ON public.deals
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'team_member'::app_role) OR 
  (auth.uid() = user_id) OR 
  can_access_deal(auth.uid(), id)
);