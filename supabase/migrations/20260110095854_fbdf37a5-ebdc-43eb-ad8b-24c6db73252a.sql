-- =====================================================
-- FIX: Infinite Recursion in RLS Policies for Deals
-- =====================================================
-- Problem: Policies on 'deals' query 'deal_participants' 
-- and policies on 'deal_participants' query 'deals', 
-- creating an infinite loop.
--
-- Solution: Simplify policies to use direct lookups only,
-- and use security definer functions that bypass RLS.
-- =====================================================

-- Step 1: Create a helper function to check broker assignment
-- This uses SECURITY DEFINER to bypass RLS and prevent recursion
CREATE OR REPLACE FUNCTION public.is_broker_for_deal(_user_id uuid, _deal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deals d
    JOIN public.profiles p ON p.id = d.user_id
    WHERE d.id = _deal_id AND p.assigned_broker = _user_id
  );
$$;

-- Step 2: Create a helper function to check deal ownership
CREATE OR REPLACE FUNCTION public.is_deal_owner(_user_id uuid, _deal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deals
    WHERE id = _deal_id AND user_id = _user_id
  );
$$;

-- Step 3: Drop problematic policies on deal_participants
DROP POLICY IF EXISTS "Brokers can manage participants" ON public.deal_participants;
DROP POLICY IF EXISTS "Users can view deal participants" ON public.deal_participants;

-- Step 4: Create new non-recursive policies for deal_participants

-- SELECT: Users can view participants
CREATE POLICY "Users can view deal participants"
ON public.deal_participants
FOR SELECT
USING (
  -- Admins and team members can see all
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'team_member'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  -- User is the participant themselves
  OR auth.uid() = user_id
  -- User owns the deal (use security definer function)
  OR is_deal_owner(auth.uid(), deal_id)
  -- User is the assigned broker (use security definer function)  
  OR is_broker_for_deal(auth.uid(), deal_id)
);

-- ALL: Brokers can manage participants for their assigned clients
CREATE POLICY "Brokers can manage participants"
ON public.deal_participants
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR auth.uid() = user_id
  -- Use security definer function instead of direct query
  OR is_broker_for_deal(auth.uid(), deal_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR auth.uid() = user_id
  OR is_broker_for_deal(auth.uid(), deal_id)
);

-- Step 5: Drop and recreate the problematic UPDATE policy on deals
DROP POLICY IF EXISTS "Deal participants can update deals" ON public.deals;

-- Recreate using security definer function to avoid recursion
CREATE POLICY "Deal participants can update deals"
ON public.deals
FOR UPDATE
USING (
  -- Use the can_access_deal function which only queries deal_participants
  public.can_access_deal(auth.uid(), id)
);

-- Step 6: Simplify the "Users can view their deals" policy
DROP POLICY IF EXISTS "Users can view their deals" ON public.deals;

CREATE POLICY "Users can view their deals"
ON public.deals
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'team_member'::app_role)
  OR has_role(auth.uid(), 'broker'::app_role)
  OR auth.uid() = user_id
  OR public.can_access_deal(auth.uid(), id)
);