-- Create table for client personal details (extends profiles)
CREATE TABLE IF NOT EXISTS public.client_personal_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  dob DATE,
  marital_status TEXT,
  dependents INTEGER DEFAULT 0,
  dependent_ages TEXT,
  ni_number TEXT,
  nationality TEXT,
  residence TEXT,
  visa_type TEXT,
  visa_expiry DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for address history
CREATE TABLE IF NOT EXISTS public.client_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_current BOOLEAN DEFAULT false,
  property_number TEXT,
  street TEXT,
  city TEXT,
  postcode TEXT,
  date_moved_in DATE,
  date_moved_out DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for financial assets
CREATE TABLE IF NOT EXISTS public.client_financial_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_accounts NUMERIC DEFAULT 0,
  property_value NUMERIC DEFAULT 0,
  investments NUMERIC DEFAULT 0,
  pension_value NUMERIC DEFAULT 0,
  other_assets NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for mortgages
CREATE TABLE IF NOT EXISTS public.client_mortgages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('first', 'second')),
  balance NUMERIC,
  lender TEXT,
  interest_rate NUMERIC,
  rate_type TEXT,
  end_of_deal DATE,
  end_of_mortgage DATE,
  monthly_payment NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for personal loans
CREATE TABLE IF NOT EXISTS public.client_personal_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC,
  lender TEXT,
  interest_rate NUMERIC,
  rate_type TEXT,
  end_date DATE,
  monthly_payment NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for credit cards
CREATE TABLE IF NOT EXISTS public.client_credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_limit NUMERIC,
  balance NUMERIC,
  monthly_payment NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for other debts
CREATE TABLE IF NOT EXISTS public.client_other_debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_type TEXT,
  balance NUMERIC,
  lender TEXT,
  monthly_payment NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for car leases
CREATE TABLE IF NOT EXISTS public.client_car_leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_payment NUMERIC,
  end_date DATE,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for income streams
CREATE TABLE IF NOT EXISTS public.client_income_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_type TEXT CHECK (income_type IN ('employed', 'self-employed', 'benefits', 'pension', 'rental', 'other')),
  monthly_net NUMERIC,
  average_overtime NUMERIC,
  bonus NUMERIC,
  extras NUMERIC,
  annual_gross NUMERIC,
  employer_name TEXT,
  employer_address TEXT,
  start_date DATE,
  contract_type TEXT,
  annual_income NUMERIC,
  business_name TEXT,
  business_type TEXT,
  trading_start_date DATE,
  business_address TEXT,
  business_url TEXT,
  benefit_type TEXT,
  benefit_amount NUMERIC,
  pension_provider TEXT,
  pension_amount NUMERIC,
  rental_properties INTEGER,
  rental_income NUMERIC,
  other_description TEXT,
  other_amount NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for credit history
CREATE TABLE IF NOT EXISTS public.client_credit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  has_ccjs BOOLEAN DEFAULT false,
  ccj_count INTEGER DEFAULT 0,
  ccj_total_value NUMERIC DEFAULT 0,
  ccj_details TEXT,
  has_defaults BOOLEAN DEFAULT false,
  default_count INTEGER DEFAULT 0,
  default_details TEXT,
  has_bankruptcy BOOLEAN DEFAULT false,
  bankruptcy_date DATE,
  bankruptcy_discharged BOOLEAN DEFAULT false,
  bankruptcy_discharge_date DATE,
  has_iva BOOLEAN DEFAULT false,
  iva_date DATE,
  iva_completed BOOLEAN DEFAULT false,
  iva_completion_date DATE,
  has_mortgage_arrears BOOLEAN DEFAULT false,
  arrears_details TEXT,
  has_repossession BOOLEAN DEFAULT false,
  repossession_date DATE,
  credit_score INTEGER,
  credit_report_date DATE,
  additional_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.client_personal_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_financial_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_mortgages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_personal_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_other_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_car_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_income_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_credit_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_personal_details
CREATE POLICY "Users can view their own personal details"
  ON public.client_personal_details FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal details"
  ON public.client_personal_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal details"
  ON public.client_personal_details FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Brokers can view their clients' personal details"
  ON public.client_personal_details FOR SELECT
  USING (
    has_role(auth.uid(), 'broker'::app_role) AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = client_personal_details.user_id 
      AND profiles.assigned_broker = auth.uid()
    )
  );

CREATE POLICY "Admins and super admins can view all personal details"
  ON public.client_personal_details FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for client_addresses
CREATE POLICY "Users can manage their own addresses"
  ON public.client_addresses FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Brokers can view their clients' addresses"
  ON public.client_addresses FOR SELECT
  USING (
    has_role(auth.uid(), 'broker'::app_role) AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = client_addresses.user_id 
      AND profiles.assigned_broker = auth.uid()
    )
  );

CREATE POLICY "Admins and super admins can view all addresses"
  ON public.client_addresses FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for client_financial_assets
CREATE POLICY "Users can manage their own financial assets"
  ON public.client_financial_assets FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Brokers can view their clients' financial assets"
  ON public.client_financial_assets FOR SELECT
  USING (
    has_role(auth.uid(), 'broker'::app_role) AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = client_financial_assets.user_id 
      AND profiles.assigned_broker = auth.uid()
    )
  );

CREATE POLICY "Admins and super admins can view all financial assets"
  ON public.client_financial_assets FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for client_mortgages
CREATE POLICY "Users can manage their own mortgages"
  ON public.client_mortgages FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Brokers can view their clients' mortgages"
  ON public.client_mortgages FOR SELECT
  USING (
    has_role(auth.uid(), 'broker'::app_role) AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = client_mortgages.user_id 
      AND profiles.assigned_broker = auth.uid()
    )
  );

CREATE POLICY "Admins and super admins can view all mortgages"
  ON public.client_mortgages FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for client_personal_loans
CREATE POLICY "Users can manage their own personal loans"
  ON public.client_personal_loans FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Brokers can view their clients' personal loans"
  ON public.client_personal_loans FOR SELECT
  USING (
    has_role(auth.uid(), 'broker'::app_role) AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = client_personal_loans.user_id 
      AND profiles.assigned_broker = auth.uid()
    )
  );

CREATE POLICY "Admins and super admins can view all personal loans"
  ON public.client_personal_loans FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for client_credit_cards
CREATE POLICY "Users can manage their own credit cards"
  ON public.client_credit_cards FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Brokers can view their clients' credit cards"
  ON public.client_credit_cards FOR SELECT
  USING (
    has_role(auth.uid(), 'broker'::app_role) AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = client_credit_cards.user_id 
      AND profiles.assigned_broker = auth.uid()
    )
  );

CREATE POLICY "Admins and super admins can view all credit cards"
  ON public.client_credit_cards FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for client_other_debts
CREATE POLICY "Users can manage their own other debts"
  ON public.client_other_debts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Brokers can view their clients' other debts"
  ON public.client_other_debts FOR SELECT
  USING (
    has_role(auth.uid(), 'broker'::app_role) AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = client_other_debts.user_id 
      AND profiles.assigned_broker = auth.uid()
    )
  );

CREATE POLICY "Admins and super admins can view all other debts"
  ON public.client_other_debts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for client_car_leases
CREATE POLICY "Users can manage their own car leases"
  ON public.client_car_leases FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Brokers can view their clients' car leases"
  ON public.client_car_leases FOR SELECT
  USING (
    has_role(auth.uid(), 'broker'::app_role) AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = client_car_leases.user_id 
      AND profiles.assigned_broker = auth.uid()
    )
  );

CREATE POLICY "Admins and super admins can view all car leases"
  ON public.client_car_leases FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for client_income_streams
CREATE POLICY "Users can manage their own income streams"
  ON public.client_income_streams FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Brokers can view their clients' income streams"
  ON public.client_income_streams FOR SELECT
  USING (
    has_role(auth.uid(), 'broker'::app_role) AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = client_income_streams.user_id 
      AND profiles.assigned_broker = auth.uid()
    )
  );

CREATE POLICY "Admins and super admins can view all income streams"
  ON public.client_income_streams FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for client_credit_history
CREATE POLICY "Users can manage their own credit history"
  ON public.client_credit_history FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Brokers can view their clients' credit history"
  ON public.client_credit_history FOR SELECT
  USING (
    has_role(auth.uid(), 'broker'::app_role) AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = client_credit_history.user_id 
      AND profiles.assigned_broker = auth.uid()
    )
  );

CREATE POLICY "Admins and super admins can view all credit history"
  ON public.client_credit_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_client_personal_details_updated_at
  BEFORE UPDATE ON public.client_personal_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_addresses_updated_at
  BEFORE UPDATE ON public.client_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_financial_assets_updated_at
  BEFORE UPDATE ON public.client_financial_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_mortgages_updated_at
  BEFORE UPDATE ON public.client_mortgages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_personal_loans_updated_at
  BEFORE UPDATE ON public.client_personal_loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_credit_cards_updated_at
  BEFORE UPDATE ON public.client_credit_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_other_debts_updated_at
  BEFORE UPDATE ON public.client_other_debts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_car_leases_updated_at
  BEFORE UPDATE ON public.client_car_leases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_income_streams_updated_at
  BEFORE UPDATE ON public.client_income_streams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_credit_history_updated_at
  BEFORE UPDATE ON public.client_credit_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();