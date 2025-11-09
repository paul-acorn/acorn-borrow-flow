-- Fix circular dependency between deals and deal_participants
-- Drop the existing SELECT policy on deals
DROP POLICY IF EXISTS "Users can view deals they participate in" ON public.deals;

-- Create a new SELECT policy that allows users to view deals they own OR participate in
CREATE POLICY "Users can view their deals"
ON public.deals
FOR SELECT
USING (
  -- Admins can see all
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Team members can see all
  has_role(auth.uid(), 'team_member'::app_role)
  OR
  -- Users can see deals they own
  auth.uid() = user_id
  OR
  -- Users can see deals they participate in
  EXISTS (
    SELECT 1 FROM public.deal_participants
    WHERE deal_participants.deal_id = deals.id
    AND deal_participants.user_id = auth.uid()
  )
);