-- Drop the existing check constraint
ALTER TABLE public.deal_participants DROP CONSTRAINT IF EXISTS deal_participants_role_check;

-- Add a new check constraint that includes 'broker' as a valid role
ALTER TABLE public.deal_participants ADD CONSTRAINT deal_participants_role_check 
CHECK (role IN ('client', 'broker', 'team_member', 'admin', 'super_admin', 'owner', 'viewer', 'editor'));