-- Fix infinite recursion in deal_participants RLS policies
-- Drop the problematic policy
DROP POLICY IF EXISTS "Team members can add participants to their deals" ON public.deal_participants;

-- Create a simpler policy that allows clients to add themselves when creating a deal
CREATE POLICY "Clients can add themselves as participants"
ON public.deal_participants
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'client'::app_role) AND auth.uid() = user_id)
);

-- Allow team members and admins to add any participants
CREATE POLICY "Team members and admins can add participants"
ON public.deal_participants
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'team_member'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);