-- Add missing columns to deals table
ALTER TABLE public.deals 
  ADD COLUMN IF NOT EXISTS amount NUMERIC,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT;

-- Create enums for loan types and deal status
DO $$ BEGIN
  CREATE TYPE public.loan_type AS ENUM (
    'bridging', 
    'mortgage', 
    'development', 
    'business', 
    'factoring', 
    'asset', 
    'mca', 
    'equity'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.deal_status AS ENUM (
    'draft', 
    'in_progress', 
    'submitted', 
    'approved', 
    'declined'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Set default values for existing rows
UPDATE public.deals SET status = 'draft' WHERE status IS NULL;
UPDATE public.deals SET type = 'bridging' WHERE type IS NULL;

-- Convert columns to use enums
ALTER TABLE public.deals 
  ALTER COLUMN type TYPE public.loan_type USING type::public.loan_type,
  ALTER COLUMN status TYPE public.deal_status USING status::public.deal_status;

-- Set defaults and constraints
ALTER TABLE public.deals 
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'draft'::public.deal_status,
  ALTER COLUMN status SET NOT NULL;