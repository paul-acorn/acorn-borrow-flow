-- Create system settings table for admin configurations
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can view and manage system settings
CREATE POLICY "Super admins can view system settings"
ON public.system_settings
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert system settings"
ON public.system_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update system settings"
ON public.system_settings
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'));

-- Add Google Drive folder ID to profiles for client-specific folders
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS google_drive_folder_id TEXT;

-- Update requirement_documents to store Google Drive file ID
ALTER TABLE public.requirement_documents
ADD COLUMN IF NOT EXISTS google_drive_file_id TEXT;

-- Insert default setting for root Google Drive folder
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
  'google_drive_root_folder_id',
  '',
  'Root Google Drive folder ID where all client folders will be created'
)
ON CONFLICT (setting_key) DO NOTHING;