-- ============================================
-- LIQUIDA360 - Correspondent Self-Service Portal
-- Version: 003
-- Fecha: 2026-02-07
-- ============================================

-- ============================================
-- 1. SCHEMA CHANGES
-- ============================================

-- 1a. Add user_id to correspondents (links to auth.users for portal access)
ALTER TABLE public.correspondents
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE;

CREATE INDEX idx_correspondents_user_id ON public.correspondents(user_id);

-- 1b. Add invoice_url to liquidations (PDF invoice uploaded by correspondent)
ALTER TABLE public.liquidations
  ADD COLUMN invoice_url TEXT;

-- 1c. Add 'pending_approval' to correspondent_status enum
ALTER TYPE correspondent_status ADD VALUE IF NOT EXISTS 'pending_approval';

-- ============================================
-- 2. HELPER FUNCTION: get correspondent_id for current user
-- ============================================
CREATE OR REPLACE FUNCTION public.get_correspondent_id_for_user()
RETURNS UUID AS $$
  SELECT id FROM public.correspondents WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================
-- 3. RLS - Restrict existing overly-permissive policies
-- ============================================

-- 3a. correspondents: was USING(true), now restricted to internal roles
DROP POLICY IF EXISTS "Authenticated users can view correspondents" ON public.correspondents;

CREATE POLICY "Internal users can view all correspondents"
  ON public.correspondents FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('pagador', 'supervisor', 'financiero', 'admin'));

-- 3b. certificates: was USING(true), now restricted to internal roles
DROP POLICY IF EXISTS "Authenticated users can view certificates" ON public.certificates;

CREATE POLICY "Internal users can view all certificates"
  ON public.certificates FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('pagador', 'supervisor', 'financiero', 'admin'));

-- ============================================
-- 4. RLS - New policies for corresponsal role
-- ============================================

-- 4a. correspondents: corresponsal can view/update ONLY their own record
CREATE POLICY "Corresponsal can view own correspondent record"
  ON public.correspondents FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'corresponsal'
    AND user_id = auth.uid()
  );

CREATE POLICY "Corresponsal can update own correspondent record"
  ON public.correspondents FOR UPDATE TO authenticated
  USING (
    public.get_user_role() = 'corresponsal'
    AND user_id = auth.uid()
  )
  WITH CHECK (
    public.get_user_role() = 'corresponsal'
    AND user_id = auth.uid()
  );

-- 4b. certificates: corresponsal can view/insert for their own correspondent
CREATE POLICY "Corresponsal can view own certificates"
  ON public.certificates FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'corresponsal'
    AND correspondent_id = public.get_correspondent_id_for_user()
  );

CREATE POLICY "Corresponsal can insert own certificates"
  ON public.certificates FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role() = 'corresponsal'
    AND correspondent_id = public.get_correspondent_id_for_user()
  );

-- 4c. liquidations: corresponsal can view/insert/update(draft) for their own
CREATE POLICY "Corresponsal can view own liquidations"
  ON public.liquidations FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'corresponsal'
    AND correspondent_id = public.get_correspondent_id_for_user()
  );

CREATE POLICY "Corresponsal can create own liquidations"
  ON public.liquidations FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role() = 'corresponsal'
    AND correspondent_id = public.get_correspondent_id_for_user()
  );

CREATE POLICY "Corresponsal can update own draft liquidations"
  ON public.liquidations FOR UPDATE TO authenticated
  USING (
    public.get_user_role() = 'corresponsal'
    AND correspondent_id = public.get_correspondent_id_for_user()
    AND status = 'draft'
  )
  WITH CHECK (
    public.get_user_role() = 'corresponsal'
    AND correspondent_id = public.get_correspondent_id_for_user()
  );

-- 4d. payment_requests: corresponsal can view requests for their own liquidations
CREATE POLICY "Corresponsal can view own payment requests"
  ON public.payment_requests FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'corresponsal'
    AND EXISTS (
      SELECT 1 FROM public.liquidations l
      WHERE l.id = liquidation_id
      AND l.correspondent_id = public.get_correspondent_id_for_user()
    )
  );

-- 4e. notifications: already covered by existing user_id = auth.uid() policy

-- ============================================
-- 5. Storage: Create invoices bucket for PDF uploads
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage RLS for invoices bucket
CREATE POLICY "Authenticated users can upload invoices"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Anyone can view invoices"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'invoices');

-- ============================================
-- 6. Update get_user_role fallback for users without role
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
