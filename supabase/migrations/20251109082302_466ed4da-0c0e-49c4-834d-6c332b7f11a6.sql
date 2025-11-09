-- Insert test data for demo user
DO $$
DECLARE
  demo_user_id UUID := '5d42eae1-7e73-4cc8-a14e-96df12998804';
  deal1_id UUID;
  deal2_id UUID;
  deal3_id UUID;
BEGIN
  -- Create first deal
  INSERT INTO public.deals (user_id, created_by_user_id, name, amount, type, status)
  VALUES (demo_user_id, demo_user_id, 'Residential Property Purchase - London', 450000, 'mortgage', 'submitted')
  RETURNING id INTO deal1_id;

  -- Create second deal
  INSERT INTO public.deals (user_id, created_by_user_id, name, amount, type, status)
  VALUES (demo_user_id, demo_user_id, 'Commercial Development - Manchester', 1200000, 'development', 'draft')
  RETURNING id INTO deal2_id;

  -- Create third deal
  INSERT INTO public.deals (user_id, created_by_user_id, name, amount, type, status)
  VALUES (demo_user_id, demo_user_id, 'Bridge Loan - Birmingham Property', 300000, 'bridging', 'approved')
  RETURNING id INTO deal3_id;

  -- Add deal participants
  INSERT INTO public.deal_participants (deal_id, user_id, role, assigned_by)
  VALUES 
    (deal1_id, demo_user_id, 'client', demo_user_id),
    (deal2_id, demo_user_id, 'client', demo_user_id),
    (deal3_id, demo_user_id, 'client', demo_user_id);

  -- Add requirements for submitted deal
  INSERT INTO public.requirements (deal_id, title, description, status, priority, due_date)
  VALUES 
    (deal1_id, 'Proof of Income', 'Please provide last 3 months bank statements and payslips', 'pending', 'high', NOW() + INTERVAL '7 days'),
    (deal1_id, 'Property Valuation Report', 'Professional valuation report required for the property', 'pending', 'high', NOW() + INTERVAL '14 days'),
    (deal1_id, 'ID Verification', 'Passport or driving license copy', 'approved', 'high', NOW() + INTERVAL '3 days');

  -- Add requirements for approved deal
  INSERT INTO public.requirements (deal_id, title, description, status, priority, due_date)
  VALUES 
    (deal3_id, 'Legal Documentation', 'Property purchase agreement and title deeds', 'approved', 'high', NOW() - INTERVAL '5 days'),
    (deal3_id, 'Final Approval Documents', 'Sign final loan agreement', 'pending', 'medium', NOW() + INTERVAL '3 days');

  -- Add messages
  INSERT INTO public.messages (deal_id, sender, content, type)
  VALUES 
    (deal1_id, 'System', 'Your application has been submitted and is under review.', 'system'),
    (deal1_id, 'Acorn Finance Team', 'Thank you for your application. We have received all initial documents and will be in touch within 24 hours.', 'message'),
    (deal3_id, 'System', 'Your bridge loan application has been approved!', 'system'),
    (deal3_id, 'Acorn Finance Team', 'Congratulations! Your loan has been approved. Please review and sign the final documents.', 'message');

END $$;