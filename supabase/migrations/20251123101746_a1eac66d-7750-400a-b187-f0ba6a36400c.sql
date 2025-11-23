-- Add foreign key constraint from deals.user_id to profiles.id
ALTER TABLE public.deals
ADD CONSTRAINT deals_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;