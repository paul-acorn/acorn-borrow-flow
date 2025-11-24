-- Create table for 2FA settings
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT false,
  sms_phone_number TEXT,
  sms_enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own 2FA settings
CREATE POLICY "Users can view their own 2FA settings"
ON public.two_factor_auth
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings"
ON public.two_factor_auth
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings"
ON public.two_factor_auth
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_two_factor_auth_updated_at
BEFORE UPDATE ON public.two_factor_auth
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();