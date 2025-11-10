-- Fix RLS policies for team_invitations to allow super_admin
DROP POLICY IF EXISTS "Team members can create invitations" ON public.team_invitations;

CREATE POLICY "Team members, admins, and super admins can create invitations"
ON public.team_invitations
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'team_member'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'broker'::app_role)
);

-- Also update the view policy to ensure super_admins can see invitations
DROP POLICY IF EXISTS "Team members can view their own invitations" ON public.team_invitations;

CREATE POLICY "Team members can view their own invitations"
ON public.team_invitations
FOR SELECT
USING (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);