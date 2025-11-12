-- Create storage bucket for requirement documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'requirement-documents',
  'requirement-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- Create table to track requirement documents
CREATE TABLE IF NOT EXISTS public.requirement_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on requirement_documents
ALTER TABLE public.requirement_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for requirement_documents
CREATE POLICY "Deal participants can view requirement documents"
ON public.requirement_documents
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin') OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'team_member') OR
  can_access_deal(auth.uid(), deal_id)
);

CREATE POLICY "Authenticated users can upload requirement documents"
ON public.requirement_documents
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by AND
  can_access_deal(auth.uid(), deal_id)
);

CREATE POLICY "Uploaders and admins can delete requirement documents"
ON public.requirement_documents
FOR DELETE
USING (
  auth.uid() = uploaded_by OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'super_admin')
);

-- Storage policies for requirement-documents bucket
CREATE POLICY "Users can view documents for their deals"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'requirement-documents' AND
  (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'team_member') OR
    EXISTS (
      SELECT 1 FROM public.requirement_documents rd
      WHERE rd.file_path = name
      AND can_access_deal(auth.uid(), rd.deal_id)
    )
  )
);

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'requirement-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own uploaded documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'requirement-documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'super_admin')
  )
);

-- Add index for better query performance
CREATE INDEX idx_requirement_documents_requirement_id ON public.requirement_documents(requirement_id);
CREATE INDEX idx_requirement_documents_deal_id ON public.requirement_documents(deal_id);

-- Enable realtime for requirement_documents
ALTER PUBLICATION supabase_realtime ADD TABLE public.requirement_documents;