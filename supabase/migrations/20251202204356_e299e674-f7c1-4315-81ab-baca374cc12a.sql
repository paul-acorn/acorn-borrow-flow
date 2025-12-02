-- Remove the vulnerable public access policy
DROP POLICY IF EXISTS "Users can view invitation by secure token" ON public.team_invitations;

-- Ensure no other public-accessible policies exist
-- All access should now go through the validate_invitation_token security definer function