-- Fix the can_access_deal function to NOT query the deals table
-- This prevents infinite recursion when used in RLS policies on the deals table

CREATE OR REPLACE FUNCTION public.can_access_deal(_user_id uuid, _deal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Only check deal_participants - do NOT query deals table here
  -- Ownership check should be done directly in RLS policies using (auth.uid() = user_id)
  SELECT EXISTS (
    SELECT 1 FROM public.deal_participants 
    WHERE deal_id = _deal_id AND user_id = _user_id
  );
$$;