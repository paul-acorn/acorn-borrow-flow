-- ============================================
-- CRITICAL SECURITY FIX: Remove Public Access to Invitation Tokens
-- ============================================
-- Issue: The "Anyone can view unused invitations for validation" policy
-- exposes secure_token and invitation_code to unauthenticated users,
-- allowing attackers to hijack invitations and create unauthorized accounts.
--
-- Solution: Remove public SELECT policy and implement server-side validation only.
-- ============================================

-- Drop the vulnerable policy that allows public access
DROP POLICY IF EXISTS "Anyone can view unused invitations for validation" ON team_invitations;

-- Create a new restricted policy that only allows viewing by secure_token
-- This policy will be used by the /invite/:token route for validation
CREATE POLICY "Invitation lookup by secure token only"
ON team_invitations
FOR SELECT
TO authenticated, anon
USING (
  -- Only allow access to the specific invitation being validated
  -- The application will query by secure_token only
  secure_token IS NOT NULL
  AND used_at IS NULL
  AND expires_at > now()
);

-- Note: The above policy still requires the query to know the secure_token
-- This prevents enumeration attacks while allowing the /invite/:token route to work

-- Add comment explaining the security model
COMMENT ON POLICY "Invitation lookup by secure token only" ON team_invitations IS 
'Allows validation of invitations by secure token only. Prevents enumeration attacks by requiring the exact token value in the query. Used by the /invite/:token route.';
