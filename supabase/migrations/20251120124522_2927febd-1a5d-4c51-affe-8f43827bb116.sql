-- Update deal_status enum to include new pipeline stages
ALTER TYPE deal_status RENAME TO deal_status_old;

CREATE TYPE deal_status AS ENUM (
  'new_case',
  'awaiting_dip',
  'dip_approved',
  'reports_instructed',
  'final_underwriting',
  'offered',
  'with_solicitors',
  'completed'
);

-- Update deals table to use new enum
ALTER TABLE deals ALTER COLUMN status DROP DEFAULT;
ALTER TABLE deals ALTER COLUMN status TYPE deal_status USING 
  CASE 
    WHEN status::text = 'draft' THEN 'new_case'::deal_status
    WHEN status::text = 'in_progress' THEN 'awaiting_dip'::deal_status
    WHEN status::text = 'submitted' THEN 'dip_approved'::deal_status
    WHEN status::text = 'approved' THEN 'offered'::deal_status
    WHEN status::text = 'declined' THEN 'new_case'::deal_status
    ELSE 'new_case'::deal_status
  END;
ALTER TABLE deals ALTER COLUMN status SET DEFAULT 'new_case'::deal_status;

DROP TYPE deal_status_old;