-- ============================================
-- PROPER FIX: Complete Lockdown of Invitation Tokens
-- ============================================
-- The previous policy was still vulnerable because it allowed
-- SELECT on all rows that met the criteria, enabling enumeration.
--
-- Solution: Remove ALL public SELECT access and create a 
-- security definer function for token validation only.
-- ============================================

-- Drop the still-vulnerable policy
DROP POLICY IF EXISTS "Invitation lookup by secure token only" ON team_invitations;

-- Create a security definer function that validates a specific token
-- This function runs with elevated privileges and doesn't expose data
CREATE OR REPLACE FUNCTION public.validate_invitation_token(_token uuid)
RETURNS TABLE (
  id uuid,
  role app_role,
  client_email text,
  client_first_name text,
  client_last_name text,
  deal_code text,
  created_by uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    role,
    client_email,
    client_first_name,
    client_last_name,
    deal_code,
    created_by
  FROM team_invitations
  WHERE secure_token = _token
    AND used_at IS NULL
    AND expires_at > now()
  LIMIT 1;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.validate_invitation_token(uuid) TO anon, authenticated;

-- Add comment explaining the security model
COMMENT ON FUNCTION public.validate_invitation_token(uuid) IS 
'Securely validates an invitation token and returns only the necessary data for registration. Prevents enumeration attacks by not exposing tokens or allowing table scans.';
