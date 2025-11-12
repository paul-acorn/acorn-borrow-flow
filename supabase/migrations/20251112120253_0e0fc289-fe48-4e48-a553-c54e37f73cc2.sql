-- Add avatar_url to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'hibernated'));

-- Add columns to team_invitations to store client details for pre-population
ALTER TABLE public.team_invitations
ADD COLUMN IF NOT EXISTS client_first_name TEXT,
ADD COLUMN IF NOT EXISTS client_last_name TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS deal_code TEXT;

-- Update the generate_deal_code function to use new format: FL250001
-- Format: Broker Initials + 2-digit year + sequential number (never resets)
CREATE OR REPLACE FUNCTION public.generate_deal_code(broker_initials text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  next_number INT;
  new_code TEXT;
  current_year TEXT;
BEGIN
  -- Get current 2-digit year
  current_year := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Get the highest sequential number across ALL deal codes (never resets)
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(deal_code FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM public.profiles
  WHERE deal_code IS NOT NULL;
  
  -- Also check team_invitations table for pending deal codes
  SELECT GREATEST(next_number, COALESCE(MAX(
    CAST(SUBSTRING(deal_code FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1)
  INTO next_number
  FROM public.team_invitations
  WHERE deal_code IS NOT NULL;
  
  -- Format: initials + year + padded sequential number (e.g., FL250001)
  new_code := broker_initials || current_year || LPAD(next_number::TEXT, 4, '0');
  RETURN new_code;
END;
$function$;

-- Add comment explaining the deal code format
COMMENT ON FUNCTION public.generate_deal_code IS 'Generates deal codes in format: BrokerInitials + 2DigitYear + 4DigitSequentialNumber (e.g., FL250001). Sequential number never resets annually.';