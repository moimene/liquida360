-- ============================================
-- LIQUIDA360 - Initial Schema Migration
-- Versión: 001
-- Fecha: 2026-02-07
-- ============================================

-- ============================================
-- 1. ENUMS
-- ============================================
CREATE TYPE correspondent_status AS ENUM ('active', 'inactive');
CREATE TYPE certificate_status AS ENUM ('valid', 'expiring_soon', 'expired');
CREATE TYPE liquidation_status AS ENUM ('draft', 'pending_approval', 'approved', 'payment_requested', 'paid', 'rejected');
CREATE TYPE payment_request_status AS ENUM ('pending', 'in_progress', 'paid', 'rejected');

-- ============================================
-- 2. HELPER: updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. TABLES
-- ============================================

-- 3a. correspondents
CREATE TABLE public.correspondents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  tax_id TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status correspondent_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_correspondents_updated_at
  BEFORE UPDATE ON public.correspondents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3b. certificates
CREATE TABLE public.certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  correspondent_id UUID NOT NULL REFERENCES public.correspondents(id) ON DELETE CASCADE,
  issuing_country TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  document_url TEXT,
  status certificate_status DEFAULT 'valid' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3c. liquidations
CREATE TABLE public.liquidations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  correspondent_id UUID NOT NULL REFERENCES public.correspondents(id) ON DELETE RESTRICT,
  certificate_id UUID REFERENCES public.certificates(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'EUR' NOT NULL,
  concept TEXT NOT NULL,
  reference TEXT,
  status liquidation_status DEFAULT 'draft' NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_liquidations_updated_at
  BEFORE UPDATE ON public.liquidations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3d. payment_requests
CREATE TABLE public.payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  liquidation_id UUID NOT NULL REFERENCES public.liquidations(id) ON DELETE RESTRICT,
  status payment_request_status DEFAULT 'pending' NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_proof_url TEXT,
  notes TEXT
);

-- 3e. notifications
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  read BOOLEAN DEFAULT false NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3f. alert_configs
CREATE TABLE public.alert_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  days_before_expiry INTEGER NOT NULL CHECK (days_before_expiry > 0),
  enabled BOOLEAN DEFAULT true NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_alert_configs_updated_at
  BEFORE UPDATE ON public.alert_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 4. INDEXES
-- ============================================
CREATE INDEX idx_certificates_correspondent ON public.certificates(correspondent_id);
CREATE INDEX idx_certificates_expiry ON public.certificates(expiry_date);
CREATE INDEX idx_certificates_status ON public.certificates(status);
CREATE INDEX idx_liquidations_correspondent ON public.liquidations(correspondent_id);
CREATE INDEX idx_liquidations_status ON public.liquidations(status);
CREATE INDEX idx_liquidations_created_by ON public.liquidations(created_by);
CREATE INDEX idx_payment_requests_liquidation ON public.payment_requests(liquidation_id);
CREATE INDEX idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);

-- ============================================
-- 5. RLS - Enable Row Level Security
-- ============================================
ALTER TABLE public.correspondents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_configs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. HELPER: get user role from JWT
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'pagador'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- 7a. correspondents
CREATE POLICY "Authenticated users can view correspondents"
  ON public.correspondents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage correspondents"
  ON public.correspondents FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- 7b. certificates
CREATE POLICY "Authenticated users can view certificates"
  ON public.certificates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pagador and Supervisor can insert certificates"
  ON public.certificates FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('pagador', 'supervisor', 'admin'));

CREATE POLICY "Admin can manage certificates"
  ON public.certificates FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admin can delete certificates"
  ON public.certificates FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- 7c. liquidations
CREATE POLICY "Users can view own liquidations"
  ON public.liquidations FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.get_user_role() IN ('supervisor', 'admin')
    OR (public.get_user_role() = 'financiero' AND status IN ('approved', 'payment_requested', 'paid'))
  );

CREATE POLICY "Pagador can create liquidations"
  ON public.liquidations FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('pagador', 'supervisor', 'admin'));

CREATE POLICY "Pagador can update own draft liquidations"
  ON public.liquidations FOR UPDATE
  TO authenticated
  USING (
    (created_by = auth.uid() AND status = 'draft')
    OR public.get_user_role() IN ('supervisor', 'admin')
  )
  WITH CHECK (
    (created_by = auth.uid() AND status = 'draft')
    OR public.get_user_role() IN ('supervisor', 'admin')
  );

CREATE POLICY "Admin can delete liquidations"
  ON public.liquidations FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- 7d. payment_requests
CREATE POLICY "Users can view related payment requests"
  ON public.payment_requests FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('financiero', 'admin')
    OR EXISTS (
      SELECT 1 FROM public.liquidations l
      WHERE l.id = liquidation_id
      AND (l.created_by = auth.uid() OR public.get_user_role() = 'supervisor')
    )
  );

CREATE POLICY "Financiero can manage payment requests"
  ON public.payment_requests FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('financiero', 'admin'))
  WITH CHECK (public.get_user_role() IN ('financiero', 'admin'));

CREATE POLICY "System can create payment requests"
  ON public.payment_requests FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('supervisor', 'admin', 'pagador'));

-- 7e. notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications (mark read)"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 7f. alert_configs
CREATE POLICY "Authenticated users can view alert configs"
  ON public.alert_configs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage alert configs"
  ON public.alert_configs FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ============================================
-- 8. SEED: Default alert configs
-- ============================================
-- These will be inserted by the admin on first setup
-- Default pre-alerts: 90 days, 30 days
