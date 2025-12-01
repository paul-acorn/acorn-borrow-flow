-- Add explicit DENY policy for anonymous users on profiles table
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add comment explaining the security measure
COMMENT ON POLICY "Deny anonymous access to profiles" ON public.profiles IS 
'Explicit defense-in-depth measure: deny all anonymous access to user profiles to prevent data leakage if RLS is bypassed or misconfigured';