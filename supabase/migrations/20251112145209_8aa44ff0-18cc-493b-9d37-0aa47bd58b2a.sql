-- Add last_email_sent_at column to track when invitation emails were last sent
-- This enables rate limiting for resend functionality
ALTER TABLE public.team_invitations 
ADD COLUMN last_email_sent_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing records to set last_email_sent_at to created_at
UPDATE public.team_invitations 
SET last_email_sent_at = created_at 
WHERE last_email_sent_at IS NULL;