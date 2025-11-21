-- Add reminder tracking columns to scheduled_callbacks table
ALTER TABLE public.scheduled_callbacks
ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_10m_sent BOOLEAN DEFAULT FALSE;

-- Create index for efficient querying of pending reminders
CREATE INDEX IF NOT EXISTS idx_scheduled_callbacks_reminders 
ON public.scheduled_callbacks(scheduled_at, status) 
WHERE status = 'pending';