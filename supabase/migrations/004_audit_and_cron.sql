-- ============================================
-- LIQUIDA360 - Audit Log & Alert Config Hardening
-- Version: 004
-- Fecha: 2026-02-07
-- ============================================

-- ============================================
-- 1. AUDIT LOG TABLE
-- ============================================
CREATE TABLE public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- RLS: admin-only read access
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view audit log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ============================================
-- 2. GENERIC AUDIT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. APPLY AUDIT TRIGGERS TO CRITICAL TABLES
-- ============================================
CREATE TRIGGER audit_liquidations
  AFTER INSERT OR UPDATE OR DELETE ON public.liquidations
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_payment_requests
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ============================================
-- 4. UNIQUE CONSTRAINT ON alert_configs (prevent duplicate seeds)
-- ============================================
ALTER TABLE public.alert_configs
  ADD CONSTRAINT uq_alert_configs_type_days UNIQUE (alert_type, days_before_expiry);

-- ============================================
-- 5. pg_cron SCHEDULING
-- ============================================
-- NOTE: pg_cron must be enabled from the Supabase Dashboard first:
--   Database > Extensions > pg_cron (enable)
--   Database > Extensions > pg_net (enable)
-- Then run these commands from the SQL Editor in the Dashboard:
--
-- SELECT cron.schedule(
--   'check-certificates-daily',
--   '0 6 * * *',
--   $$
--   SELECT net.http_post(
--     url := '<SUPABASE_URL>/functions/v1/check-certificates',
--     headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );
--
-- SELECT cron.schedule(
--   'generate-certificate-notifications-daily',
--   '15 6 * * *',
--   $$
--   SELECT net.http_post(
--     url := '<SUPABASE_URL>/functions/v1/generate-notifications',
--     headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
--     body := '{"type":"certificate_check"}'::jsonb
--   );
--   $$
-- );
