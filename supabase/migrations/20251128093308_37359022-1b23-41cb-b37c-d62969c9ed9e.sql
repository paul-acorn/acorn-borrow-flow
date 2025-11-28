-- Create table for client expenses
CREATE TABLE IF NOT EXISTS public.client_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mortgage_rent NUMERIC,
  utilities NUMERIC,
  council_tax NUMERIC,
  groceries NUMERIC,
  transport NUMERIC,
  childcare NUMERIC,
  insurance NUMERIC,
  other NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.client_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own expenses" 
ON public.client_expenses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses" 
ON public.client_expenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" 
ON public.client_expenses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" 
ON public.client_expenses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_expenses_updated_at
BEFORE UPDATE ON public.client_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();