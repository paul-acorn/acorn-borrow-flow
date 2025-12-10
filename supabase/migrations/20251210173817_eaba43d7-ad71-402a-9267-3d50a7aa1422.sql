-- Add category column to requirements table for grouping
ALTER TABLE public.requirements 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- Create index for faster category-based queries
CREATE INDEX IF NOT EXISTS idx_requirements_category ON public.requirements(category);