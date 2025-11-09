
-- Create a security definer function to check deal access without triggering RLS
CREATE OR REPLACE FUNCTION public.can_access_deal(_user_id uuid, _deal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- User can access if they own the deal OR are a participant
  SELECT EXISTS (
    SELECT 1 FROM public.deals 
    WHERE id = _deal_id AND user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.deal_participants 
    WHERE deal_id = _deal_id AND user_id = _user_id
  );
$$;

-- Drop the circular policies
DROP POLICY IF EXISTS "Users can view their deals" ON public.deals;
DROP POLICY IF EXISTS "Users can view deal participants" ON public.deal_participants;

-- Create new deals SELECT policy using the security definer function
CREATE POLICY "Users can view their deals"
ON public.deals
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'team_member'::app_role)
  OR auth.uid() = user_id
  OR public.can_access_deal(auth.uid(), id)
);

-- Create new deal_participants SELECT policy using the security definer function
CREATE POLICY "Users can view deal participants"
ON public.deal_participants
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'team_member'::app_role)
  OR public.can_access_deal(auth.uid(), deal_id)
);
