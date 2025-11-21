-- Create scheduled_callbacks table
CREATE TABLE public.scheduled_callbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  scheduled_by UUID NOT NULL,
  scheduled_with UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.scheduled_callbacks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scheduled callbacks"
  ON public.scheduled_callbacks
  FOR SELECT
  USING (
    auth.uid() = scheduled_by 
    OR auth.uid() = scheduled_with 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Brokers can view their clients' scheduled callbacks"
  ON public.scheduled_callbacks
  FOR SELECT
  USING (
    has_role(auth.uid(), 'broker'::app_role) 
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = scheduled_callbacks.scheduled_with 
        AND assigned_broker = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = scheduled_callbacks.scheduled_by 
        AND assigned_broker = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create scheduled callbacks"
  ON public.scheduled_callbacks
  FOR INSERT
  WITH CHECK (
    auth.uid() = scheduled_by
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      has_role(auth.uid(), 'broker'::app_role) 
      AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = scheduled_callbacks.scheduled_with 
        AND assigned_broker = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own scheduled callbacks"
  ON public.scheduled_callbacks
  FOR UPDATE
  USING (
    auth.uid() = scheduled_by 
    OR auth.uid() = scheduled_with
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Users can delete their own scheduled callbacks"
  ON public.scheduled_callbacks
  FOR DELETE
  USING (
    auth.uid() = scheduled_by 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_callbacks_updated_at
  BEFORE UPDATE ON public.scheduled_callbacks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_scheduled_callbacks_scheduled_at ON public.scheduled_callbacks(scheduled_at);
CREATE INDEX idx_scheduled_callbacks_scheduled_by ON public.scheduled_callbacks(scheduled_by);
CREATE INDEX idx_scheduled_callbacks_scheduled_with ON public.scheduled_callbacks(scheduled_with);
CREATE INDEX idx_scheduled_callbacks_status ON public.scheduled_callbacks(status);