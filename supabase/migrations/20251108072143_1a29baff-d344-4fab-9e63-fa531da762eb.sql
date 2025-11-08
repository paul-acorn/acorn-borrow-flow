-- Create test data for demo user
-- This migration adds sample deals and requirements for testing

DO $$
DECLARE
  demo_user_id UUID;
  deal1_id UUID;
  deal2_id UUID;
  deal3_id UUID;
BEGIN
  -- Find the demo user by email
  SELECT id INTO demo_user_id 
  FROM auth.users 
  WHERE email = 'demo@acornfinance.com'
  LIMIT 1;

  -- Only proceed if demo user exists
  IF demo_user_id IS NOT NULL THEN
    
    -- Create test deals
    INSERT INTO public.deals (id, user_id, created_by_user_id, name, amount, type, status)
    VALUES 
      (gen_random_uuid(), demo_user_id, demo_user_id, 'Residential Property Purchase - London', 450000, 'mortgage', 'submitted'),
      (gen_random_uuid(), demo_user_id, demo_user_id, 'Commercial Development - Manchester', 1200000, 'development', 'draft'),
      (gen_random_uuid(), demo_user_id, demo_user_id, 'Bridge Loan - Birmingham Property', 300000, 'bridging', 'approved')
    RETURNING id INTO deal1_id;

    -- Get the IDs of the created deals
    SELECT id INTO deal1_id FROM public.deals WHERE name = 'Residential Property Purchase - London' AND user_id = demo_user_id;
    SELECT id INTO deal2_id FROM public.deals WHERE name = 'Commercial Development - Manchester' AND user_id = demo_user_id;
    SELECT id INTO deal3_id FROM public.deals WHERE name = 'Bridge Loan - Birmingham Property' AND user_id = demo_user_id;

    -- Add deal participants for all deals
    INSERT INTO public.deal_participants (deal_id, user_id, role, assigned_by)
    VALUES 
      (deal1_id, demo_user_id, 'client', demo_user_id),
      (deal2_id, demo_user_id, 'client', demo_user_id),
      (deal3_id, demo_user_id, 'client', demo_user_id);

    -- Add sample requirements for the submitted deal
    INSERT INTO public.requirements (deal_id, title, description, status, priority, due_date)
    VALUES 
      (deal1_id, 'Proof of Income', 'Please provide last 3 months bank statements and payslips', 'pending', 'high', NOW() + INTERVAL '7 days'),
      (deal1_id, 'Property Valuation Report', 'Professional valuation report required for the property', 'pending', 'high', NOW() + INTERVAL '14 days'),
      (deal1_id, 'ID Verification', 'Passport or driving license copy', 'completed', 'high', NOW() + INTERVAL '3 days');

    -- Add sample requirements for the approved deal
    INSERT INTO public.requirements (deal_id, title, description, status, priority, due_date)
    VALUES 
      (deal3_id, 'Legal Documentation', 'Property purchase agreement and title deeds', 'completed', 'high', NOW() - INTERVAL '5 days'),
      (deal3_id, 'Final Approval Documents', 'Sign final loan agreement', 'pending', 'medium', NOW() + INTERVAL '3 days');

    -- Add sample messages for demonstration
    INSERT INTO public.messages (deal_id, sender, content, type)
    VALUES 
      (deal1_id, 'system', 'Your application has been submitted and is under review.', 'status_update'),
      (deal1_id, 'Acorn Finance Team', 'Thank you for your application. We have received all initial documents and will be in touch within 24 hours.', 'message'),
      (deal3_id, 'system', 'Your bridge loan application has been approved!', 'status_update'),
      (deal3_id, 'Acorn Finance Team', 'Congratulations! Your loan has been approved. Please review and sign the final documents.', 'message');

    RAISE NOTICE 'Test data created successfully for demo user';
  ELSE
    RAISE NOTICE 'Demo user not found. Please sign up with demo@acornfinance.com first';
  END IF;
END $$;
