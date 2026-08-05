-- Production-only additive: align reports with current app code.
-- Do NOT run Dev baseline. Do NOT drop payment_status/plan_type.

BEGIN;

-- 1) entitlement: product access the app SELECT/INSERT today
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS entitlement text;

COMMENT ON COLUMN public.reports.entitlement IS
  'Server-only product entitlement: free | premium (replaces payment_status + plan_type in app code)';

-- Existing rows (if any): treat as free so NOT NULL can be applied
UPDATE public.reports
SET entitlement = 'free'
WHERE entitlement IS NULL;

ALTER TABLE public.reports
  ALTER COLUMN entitlement SET DEFAULT 'free';

ALTER TABLE public.reports
  ALTER COLUMN entitlement SET NOT NULL;

-- Idempotent check (name must not already exist with different def)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reports_entitlement_check'
      AND conrelid = 'public.reports'::regclass
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_entitlement_check
      CHECK (entitlement IN ('free', 'premium'));
  END IF;
END $$;

-- 2) report_type: self vs friend-proxy the app SELECT/INSERT/filters today
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS report_type text;

COMMENT ON COLUMN public.reports.report_type IS
  'Report kind: self (owner profile) | partner_manual (friend proxy)';

-- Existing rows → self (disposable test data OK; matches create default)
UPDATE public.reports
SET report_type = 'self'
WHERE report_type IS NULL;

ALTER TABLE public.reports
  ALTER COLUMN report_type SET DEFAULT 'self';

ALTER TABLE public.reports
  ALTER COLUMN report_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reports_report_type_check'
      AND conrelid = 'public.reports'::regclass
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_report_type_check
      CHECK (report_type IN ('self', 'partner_manual'));
  END IF;
END $$;

COMMIT;
