-- Enable realtime for deals table
ALTER TABLE public.deals REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;