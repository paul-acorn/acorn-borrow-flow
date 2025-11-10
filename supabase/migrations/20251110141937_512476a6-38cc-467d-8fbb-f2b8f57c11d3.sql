-- First, let's create profiles for any auth users that don't have one
INSERT INTO public.profiles (id, email, first_name, last_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'last_name', '')
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Now assign default 'client' role to any users without roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  'client'::app_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.id IS NULL;

-- For testing: Create a super_admin test account
-- You'll need to manually create a user in Supabase Auth with email 'superadmin@test.com'
-- Then run this to give them super_admin role:
-- First, remove any existing client role if present
DELETE FROM public.user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'superadmin@test.com'
)
AND role = 'client'::app_role;

-- Then add super_admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'superadmin@test.com'
ON CONFLICT DO NOTHING;