-- Step 2: Update RLS policies for new roles
DROP POLICY IF EXISTS "Team members can view client profiles" ON public.profiles;

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can update all profiles
CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Brokers can view their assigned clients
CREATE POLICY "Brokers can view their clients"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'broker'::app_role) 
  AND assigned_broker = auth.uid()
);

-- Brokers can update their clients
CREATE POLICY "Brokers can update their clients"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'broker'::app_role) 
  AND assigned_broker = auth.uid()
);

-- Super admins can manage all roles
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Function to generate deal code for a client
CREATE OR REPLACE FUNCTION public.generate_deal_code(broker_initials TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INT;
  new_code TEXT;
BEGIN
  -- Get the next sequential number for this broker's initials
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(deal_code FROM LENGTH(broker_initials) + 1) AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM public.profiles
  WHERE deal_code LIKE broker_initials || '%';
  
  new_code := broker_initials || next_number::TEXT;
  RETURN new_code;
END;
$$;