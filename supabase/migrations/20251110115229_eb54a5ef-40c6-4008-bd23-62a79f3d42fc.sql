-- Add role column to team_invitations to track what role the invitation is for
ALTER TABLE public.team_invitations 
ADD COLUMN role app_role NOT NULL DEFAULT 'client'::app_role;

-- Update the handle_new_user trigger to assign roles based on invitation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  invitation_role app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- Check if user signed up with an invitation code
  IF NEW.raw_user_meta_data->>'invitation_code' IS NOT NULL THEN
    -- Get the role from the invitation
    SELECT role INTO invitation_role
    FROM public.team_invitations
    WHERE invitation_code = NEW.raw_user_meta_data->>'invitation_code';
    
    -- Assign the role from the invitation
    IF invitation_role IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, invitation_role);
    ELSE
      -- Default to client if no invitation found
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