-- Add secure_token column to team_invitations
ALTER TABLE public.team_invitations 
ADD COLUMN IF NOT EXISTS secure_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_team_invitations_secure_token 
ON public.team_invitations(secure_token);

-- Drop existing public SELECT policies on team_invitations
DROP POLICY IF EXISTS "Anyone can view valid invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Public can select invitations" ON public.team_invitations;

-- Create new secure policy: Only SELECT by secure_token (no invitation_code)
CREATE POLICY "Users can view invitation by secure token"
ON public.team_invitations
FOR SELECT
USING (
  secure_token IS NOT NULL
  AND expires_at > NOW()
  AND used_at IS NULL
);

-- Staff can view all invitations (for management)
CREATE POLICY "Staff can view all invitations"
ON public.team_invitations
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin') OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'broker')
);

-- Staff can create invitations
CREATE POLICY "Staff can create invitations"
ON public.team_invitations
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'super_admin') OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'broker')
);

-- Staff can update invitations (for resending)
CREATE POLICY "Staff can update invitations"
ON public.team_invitations
FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin') OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'broker')
);

-- Update handle_new_user to use secure_token instead of invitation_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_role app_role;
  invitation_token TEXT;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- Check if user signed up with a secure token
  invitation_token := NEW.raw_user_meta_data->>'invitation_token';
  
  IF invitation_token IS NOT NULL THEN
    -- Get the role from the invitation using secure_token
    SELECT role INTO invitation_role
    FROM public.team_invitations
    WHERE secure_token::text = invitation_token
      AND expires_at > NOW()
      AND used_at IS NULL;
    
    -- Mark invitation as used
    UPDATE public.team_invitations
    SET used_at = NOW(),
        used_by_user_id = NEW.id
    WHERE secure_token::text = invitation_token;
    
    -- Assign the role from the invitation
    IF invitation_role IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, invitation_role);
    ELSE
      -- Default to client if no valid invitation found
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'client');
    END IF;
  ELSE
    -- Auto-assign 'client' role to users without invitation
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client');
  END IF;
  
  RETURN NEW;
END;
$$;