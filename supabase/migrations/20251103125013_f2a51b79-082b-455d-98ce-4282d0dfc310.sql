-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('client', 'team_member', 'admin');

-- Create user_roles table to store role assignments
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create team_invitations table for invitation codes
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Create deal_participants junction table for multi-user deals
CREATE TABLE public.deal_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'team_member')),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (deal_id, user_id)
);

ALTER TABLE public.deal_participants ENABLE ROW LEVEL SECURITY;

-- Add created_by_user_id to deals table
ALTER TABLE public.deals ADD COLUMN created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Team members can view client profiles"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'team_member') 
  AND EXISTS (
    SELECT 1 FROM public.deal_participants dp1
    INNER JOIN public.deal_participants dp2 ON dp1.deal_id = dp2.deal_id
    WHERE dp1.user_id = auth.uid()
      AND dp2.user_id = profiles.id
  )
);

-- RLS Policies for team_invitations
CREATE POLICY "Team members can create invitations"
ON public.team_invitations
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'team_member') 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Team members can view their own invitations"
ON public.team_invitations
FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Anyone can view unused invitations for validation"
ON public.team_invitations
FOR SELECT
USING (used_at IS NULL AND expires_at > now());

CREATE POLICY "Admins can view all invitations"
ON public.team_invitations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for deal_participants
CREATE POLICY "Users can view participants of their deals"
ON public.deal_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.deal_participants
    WHERE deal_id = deal_participants.deal_id
      AND user_id = auth.uid()
  )
);

CREATE POLICY "Team members can add participants to their deals"
ON public.deal_participants
FOR INSERT
WITH CHECK (
  (public.has_role(auth.uid(), 'team_member') OR public.has_role(auth.uid(), 'admin'))
  AND EXISTS (
    SELECT 1 FROM public.deal_participants
    WHERE deal_id = deal_participants.deal_id
      AND user_id = auth.uid()
      AND role = 'team_member'
  )
);

CREATE POLICY "Admins can manage all deal participants"
ON public.deal_participants
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update deals RLS policies to use deal_participants
DROP POLICY IF EXISTS "Users can view their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can create their own deals" ON public.deals;

CREATE POLICY "Users can view deals they participate in"
ON public.deals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.deal_participants
    WHERE deal_id = deals.id
      AND user_id = auth.uid()
  )
);

CREATE POLICY "Clients can create deals for themselves"
ON public.deals
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'client')
  AND auth.uid() = user_id
);

CREATE POLICY "Team members can create deals"
ON public.deals
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'team_member') 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Deal participants can update deals"
ON public.deals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.deal_participants
    WHERE deal_id = deals.id
      AND user_id = auth.uid()
  )
);

-- Update messages RLS policies to use deal_participants
DROP POLICY IF EXISTS "Users can view messages for their deals" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages for their deals" ON public.messages;

CREATE POLICY "Deal participants can view messages"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.deal_participants
    WHERE deal_id = messages.deal_id
      AND user_id = auth.uid()
  )
);

CREATE POLICY "Deal participants can create messages"
ON public.messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.deal_participants
    WHERE deal_id = messages.deal_id
      AND user_id = auth.uid()
  )
);

-- Update requirements RLS policies to use deal_participants
DROP POLICY IF EXISTS "Users can view requirements for their deals" ON public.requirements;
DROP POLICY IF EXISTS "Users can update requirements for their deals" ON public.requirements;

CREATE POLICY "Deal participants can view requirements"
ON public.requirements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.deal_participants
    WHERE deal_id = requirements.deal_id
      AND user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create requirements"
ON public.requirements
FOR INSERT
WITH CHECK (
  (public.has_role(auth.uid(), 'team_member') OR public.has_role(auth.uid(), 'admin'))
  AND EXISTS (
    SELECT 1 FROM public.deal_participants
    WHERE deal_id = requirements.deal_id
      AND user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update requirements"
ON public.requirements
FOR UPDATE
USING (
  (public.has_role(auth.uid(), 'team_member') OR public.has_role(auth.uid(), 'admin'))
  AND EXISTS (
    SELECT 1 FROM public.deal_participants
    WHERE deal_id = requirements.deal_id
      AND user_id = auth.uid()
  )
);

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- Auto-assign 'client' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate unique invitation codes
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.team_invitations WHERE invitation_code = code)
    INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();