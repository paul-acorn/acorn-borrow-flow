-- Step 1: Add new enum values for roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'broker';

-- Add deal_code to profiles table for tracking broker-assigned codes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deal_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_broker UUID;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_deal_code ON public.profiles(deal_code);
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_broker ON public.profiles(assigned_broker);