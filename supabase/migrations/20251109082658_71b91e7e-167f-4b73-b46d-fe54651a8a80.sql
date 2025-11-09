-- Fix remaining infinite recursion in deal_participants policies
-- Drop all problematic policies
DROP POLICY IF EXISTS "Users can view participants of their deals" ON public.deal_participants;

-- Create a new SELECT policy that doesn't cause recursion
-- Allow users to view participants if they are a participant in any deal
CREATE POLICY "Users can view deal participants"
ON public.deal_participants
FOR SELECT
USING (
  -- Admins can see all
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Team members can see all
  has_role(auth.uid(), 'team_member'::app_role)
  OR
  -- Users can see participants of deals they own
  EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_participants.deal_id
    AND deals.user_id = auth.uid()
  )
);