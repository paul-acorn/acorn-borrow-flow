-- Add comments to clarify the new status values for requirements
-- Status can be: 'pending', 'in_progress', 'completed', 'manually_complete', 'not_required'
-- No schema change needed as status is a TEXT column without constraints
-- This migration just serves as documentation of the new status values

COMMENT ON COLUMN public.requirements.status IS 'Status of the requirement: pending, in_progress, completed, manually_complete (verified offline), not_required (N/A)';