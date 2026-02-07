-- ============================================
-- LIQUIDA360 - Helper Functions + Security Hardening
-- Versión: 002
-- ============================================

-- ============================================
-- 1. Helper: get users by role (for Edge Functions)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_users_by_role(target_role TEXT)
RETURNS TABLE(id UUID) AS $$
  SELECT au.id
  FROM auth.users au
  WHERE au.raw_app_meta_data ->> 'role' = target_role;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Grant execute to service_role only (Edge Functions use service_role key)
REVOKE ALL ON FUNCTION public.get_users_by_role(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_users_by_role(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_users_by_role(TEXT) TO service_role;

-- ============================================
-- 2. Security: Prevent status downgrade on liquidations
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_liquidation_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions JSONB := '{
    "draft": ["pending_approval"],
    "pending_approval": ["approved", "rejected"],
    "approved": ["payment_requested"],
    "payment_requested": ["paid"],
    "rejected": ["draft"],
    "paid": []
  }'::JSONB;
  allowed_next JSONB;
BEGIN
  -- Skip validation for service_role (Edge Functions, admin operations)
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Only validate when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  allowed_next := valid_transitions -> OLD.status::TEXT;

  IF allowed_next IS NULL OR NOT (allowed_next ? NEW.status::TEXT) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER validate_liquidation_status
  BEFORE UPDATE OF status ON public.liquidations
  FOR EACH ROW EXECUTE FUNCTION public.validate_liquidation_status_transition();

-- ============================================
-- 3. Security: Prevent payment_request status downgrade
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_payment_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions JSONB := '{
    "pending": ["in_progress", "rejected"],
    "in_progress": ["paid", "rejected"],
    "paid": [],
    "rejected": []
  }'::JSONB;
  allowed_next JSONB;
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  allowed_next := valid_transitions -> OLD.status::TEXT;

  IF allowed_next IS NULL OR NOT (allowed_next ? NEW.status::TEXT) THEN
    RAISE EXCEPTION 'Invalid payment status transition from % to %', OLD.status, NEW.status;
  END IF;

  -- Auto-set processed_at and processed_by
  IF NEW.status IN ('paid', 'rejected') THEN
    NEW.processed_at := timezone('utc'::text, now());
    NEW.processed_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER validate_payment_status
  BEFORE UPDATE OF status ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_payment_status_transition();

-- ============================================
-- 4. Security: Ensure notifications belong to user
-- ============================================
-- Already covered by RLS policy: user_id = auth.uid()
-- Additional: prevent users from creating notifications for others
CREATE POLICY "Users cannot insert notifications for others"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Service role bypasses this; regular users can only insert for themselves
    user_id = auth.uid() OR current_setting('request.jwt.claim.role', true) = 'service_role'
  );

-- Drop the overly permissive policy from migration 001
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- ============================================
-- 5. Additional index for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_liquidations_created_at ON public.liquidations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_correspondent_expiry ON public.certificates(correspondent_id, expiry_date);
