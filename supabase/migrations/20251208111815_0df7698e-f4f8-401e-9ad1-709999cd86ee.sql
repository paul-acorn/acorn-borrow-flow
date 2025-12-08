-- Add status and notes columns to requirement_documents table
ALTER TABLE public.requirement_documents 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS review_notes text,
ADD COLUMN IF NOT EXISTS reviewed_by uuid,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

-- Add RLS policy for brokers to update document status
CREATE POLICY "Brokers can update their clients' requirement documents"
ON public.requirement_documents
FOR UPDATE
USING (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM deals d
    JOIN profiles p ON d.user_id = p.id
    WHERE d.id = requirement_documents.deal_id
    AND p.assigned_broker = auth.uid()
  )
);

-- Admins and super_admins can also update
CREATE POLICY "Admins can update requirement documents"
ON public.requirement_documents
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);