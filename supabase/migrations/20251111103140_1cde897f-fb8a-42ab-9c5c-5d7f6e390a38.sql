-- Create test invitation codes for RLS policy testing
-- Use these codes to sign up test accounts through the normal signup flow

-- Create invitations for test brokers
INSERT INTO public.team_invitations (invitation_code, role, expires_at, created_by, used_at, used_by_user_id)
VALUES 
  -- Broker invitations (create these accounts first)
  ('BROKER01', 'broker', now() + interval '30 days', (SELECT id FROM auth.users LIMIT 1), NULL, NULL),
  ('BROKER02', 'broker', now() + interval '30 days', (SELECT id FROM auth.users LIMIT 1), NULL, NULL),
  
  -- Client invitations (will be assigned to brokers after signup)
  ('CLIENT01', 'client', now() + interval '30 days', (SELECT id FROM auth.users LIMIT 1), NULL, NULL),
  ('CLIENT02', 'client', now() + interval '30 days', (SELECT id FROM auth.users LIMIT 1), NULL, NULL),
  ('CLIENT03', 'client', now() + interval '30 days', (SELECT id FROM auth.users LIMIT 1), NULL, NULL),
  ('CLIENT04', 'client', now() + interval '30 days', (SELECT id FROM auth.users LIMIT 1), NULL, NULL)
ON CONFLICT (invitation_code) DO NOTHING;

-- Instructions for creating test accounts:
-- 1. Sign up as broker1@acorn.finance using code BROKER01
-- 2. Sign up as broker2@acorn.finance using code BROKER02
-- 3. Sign up as client1@example.com using code CLIENT01
-- 4. Sign up as client2@example.com using code CLIENT02
-- 5. Sign up as client3@example.com using code CLIENT03
-- 6. Sign up as client4@example.com using code CLIENT04

COMMENT ON TABLE public.team_invitations IS 'Test invitation codes: BROKER01, BROKER02, CLIENT01-04. Use these to create test accounts for RLS testing.';