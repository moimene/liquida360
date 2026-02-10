-- ============================================
-- LIQUIDA360 - G-Invoice Domain Schema
-- Versión: 009
-- Fecha: 2026-02-09
-- Dominio: G-Invoice (facturación digital)
-- Principio: ADDITIVE ONLY — no modifica tablas existentes
-- ============================================

-- ============================================
-- 1. ENUMS (G-Invoice domain)
-- ============================================
CREATE TYPE ginv_intake_type AS ENUM ('vendor_invoice', 'official_fee');

CREATE TYPE ginv_intake_status AS ENUM (
  'draft',
  'submitted',
  'needs_info',
  'pending_approval',
  'approved',
  'rejected',
  'sent_to_accounting',
  'posted',
  'ready_to_bill',
  'billed',
  'archived'
);

CREATE TYPE ginv_uttai_status AS ENUM ('clear', 'blocked', 'pending_review');

CREATE TYPE ginv_compliance_status AS ENUM ('compliant', 'expiring_soon', 'non_compliant');

CREATE TYPE ginv_billing_decision AS ENUM ('emit', 'transfer', 'discard');

CREATE TYPE ginv_invoice_status AS ENUM (
  'invoice_draft',
  'pending_partner_approval',
  'ready_for_sap',
  'issued',
  'delivered',
  'platform_required',
  'platform_completed'
);

CREATE TYPE ginv_platform_task_status AS ENUM ('pending', 'in_progress', 'completed', 'blocked');

CREATE TYPE ginv_vendor_doc_type AS ENUM ('tax_residency_certificate', 'partners_letter', 'other');

-- ============================================
-- 2. HELPER: get G-Invoice role from JWT
-- ============================================
CREATE OR REPLACE FUNCTION public.get_ginv_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'ginv_role';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================
-- 3. TABLES
-- ============================================

-- 3a. ginv_jobs — Jobs/Clients master data
CREATE TABLE public.ginv_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_code TEXT NOT NULL UNIQUE,
  client_code TEXT NOT NULL,
  client_name TEXT NOT NULL,
  uttai_status ginv_uttai_status DEFAULT 'clear' NOT NULL,
  uttai_subject_obliged BOOLEAN,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_ginv_jobs_updated_at
  BEFORE UPDATE ON public.ginv_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3b. ginv_vendors — Vendor master data (separate from correspondents)
CREATE TABLE public.ginv_vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tax_id TEXT NOT NULL,
  country TEXT NOT NULL,
  compliance_status ginv_compliance_status DEFAULT 'non_compliant' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_ginv_vendors_updated_at
  BEFORE UPDATE ON public.ginv_vendors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3c. ginv_vendor_documents — Vendor compliance documents
CREATE TABLE public.ginv_vendor_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.ginv_vendors(id) ON DELETE CASCADE,
  doc_type ginv_vendor_doc_type NOT NULL,
  issued_at DATE,
  expires_at DATE,
  status ginv_compliance_status DEFAULT 'non_compliant' NOT NULL,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_ginv_vendor_documents_updated_at
  BEFORE UPDATE ON public.ginv_vendor_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3d. ginv_intake_items — Unified intake (vendor invoices + official fees)
CREATE TABLE public.ginv_intake_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type ginv_intake_type NOT NULL,
  vendor_id UUID REFERENCES public.ginv_vendors(id) ON DELETE RESTRICT,
  job_id UUID REFERENCES public.ginv_jobs(id) ON DELETE RESTRICT,
  currency TEXT DEFAULT 'EUR' NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  invoice_number TEXT,
  invoice_date DATE,
  concept_text TEXT,
  approver_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uttai_status_snapshot ginv_uttai_status,
  vendor_compliance_snapshot ginv_compliance_status,
  file_path TEXT,
  status ginv_intake_status DEFAULT 'draft' NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_ginv_intake_items_updated_at
  BEFORE UPDATE ON public.ginv_intake_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3e. ginv_sap_postings — SAP accounting confirmations
CREATE TABLE public.ginv_sap_postings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_item_id UUID NOT NULL REFERENCES public.ginv_intake_items(id) ON DELETE RESTRICT,
  sap_reference TEXT NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL,
  posted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3f. ginv_billing_batches — Billing preparation batches
CREATE TABLE public.ginv_billing_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.ginv_jobs(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'draft' NOT NULL,
  uttai_subject_obliged BOOLEAN,
  total_amount NUMERIC(15, 2),
  total_fees NUMERIC(15, 2),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_ginv_billing_batches_updated_at
  BEFORE UPDATE ON public.ginv_billing_batches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3g. ginv_billing_batch_items — Items within a billing batch
CREATE TABLE public.ginv_billing_batch_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.ginv_billing_batches(id) ON DELETE CASCADE,
  intake_item_id UUID NOT NULL REFERENCES public.ginv_intake_items(id) ON DELETE RESTRICT,
  attach_fee BOOLEAN DEFAULT false NOT NULL,
  decision ginv_billing_decision,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3h. ginv_client_invoices — Issued client invoices
CREATE TABLE public.ginv_client_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES public.ginv_billing_batches(id) ON DELETE SET NULL,
  sap_invoice_number TEXT,
  sap_invoice_date DATE,
  pdf_file_path TEXT,
  status ginv_invoice_status DEFAULT 'invoice_draft' NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_ginv_client_invoices_updated_at
  BEFORE UPDATE ON public.ginv_client_invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3i. ginv_deliveries — Client delivery records
CREATE TABLE public.ginv_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_invoice_id UUID NOT NULL REFERENCES public.ginv_client_invoices(id) ON DELETE RESTRICT,
  delivery_type TEXT DEFAULT 'email' NOT NULL,
  recipients JSONB DEFAULT '[]'::JSONB NOT NULL,
  subject TEXT,
  body TEXT,
  attachments JSONB DEFAULT '[]'::JSONB,
  status TEXT DEFAULT 'pending' NOT NULL,
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3j. ginv_platform_tasks — Platform upload tasks (SAGA replacement)
CREATE TABLE public.ginv_platform_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_invoice_id UUID NOT NULL REFERENCES public.ginv_client_invoices(id) ON DELETE RESTRICT,
  platform_name TEXT NOT NULL,
  client_platform_code TEXT,
  invoice_number TEXT,
  order_number TEXT,
  notes TEXT,
  evidence_file_path TEXT,
  status ginv_platform_task_status DEFAULT 'pending' NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sla_due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_ginv_platform_tasks_updated_at
  BEFORE UPDATE ON public.ginv_platform_tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3k. ginv_uttai_requests — UTTAI unblock requests
CREATE TABLE public.ginv_uttai_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.ginv_jobs(id) ON DELETE RESTRICT,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'pending' NOT NULL,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 4. INDEXES
-- ============================================
CREATE INDEX idx_ginv_jobs_client_code ON public.ginv_jobs(client_code);
CREATE INDEX idx_ginv_jobs_uttai_status ON public.ginv_jobs(uttai_status);
CREATE INDEX idx_ginv_vendors_tax_id ON public.ginv_vendors(tax_id);
CREATE INDEX idx_ginv_vendors_compliance ON public.ginv_vendors(compliance_status);
CREATE INDEX idx_ginv_vendor_documents_vendor ON public.ginv_vendor_documents(vendor_id);
CREATE INDEX idx_ginv_vendor_documents_expires ON public.ginv_vendor_documents(expires_at);
CREATE INDEX idx_ginv_intake_items_vendor ON public.ginv_intake_items(vendor_id);
CREATE INDEX idx_ginv_intake_items_job ON public.ginv_intake_items(job_id);
CREATE INDEX idx_ginv_intake_items_status ON public.ginv_intake_items(status);
CREATE INDEX idx_ginv_intake_items_created_by ON public.ginv_intake_items(created_by);
CREATE INDEX idx_ginv_intake_items_type ON public.ginv_intake_items(type);
CREATE INDEX idx_ginv_sap_postings_intake ON public.ginv_sap_postings(intake_item_id);
CREATE INDEX idx_ginv_billing_batches_job ON public.ginv_billing_batches(job_id);
CREATE INDEX idx_ginv_billing_batch_items_batch ON public.ginv_billing_batch_items(batch_id);
CREATE INDEX idx_ginv_billing_batch_items_intake ON public.ginv_billing_batch_items(intake_item_id);
CREATE INDEX idx_ginv_client_invoices_batch ON public.ginv_client_invoices(batch_id);
CREATE INDEX idx_ginv_client_invoices_status ON public.ginv_client_invoices(status);
CREATE INDEX idx_ginv_deliveries_invoice ON public.ginv_deliveries(client_invoice_id);
CREATE INDEX idx_ginv_platform_tasks_invoice ON public.ginv_platform_tasks(client_invoice_id);
CREATE INDEX idx_ginv_platform_tasks_status ON public.ginv_platform_tasks(status);
CREATE INDEX idx_ginv_platform_tasks_assigned ON public.ginv_platform_tasks(assigned_to);
CREATE INDEX idx_ginv_uttai_requests_job ON public.ginv_uttai_requests(job_id);

-- ============================================
-- 5. RLS - Enable Row Level Security
-- ============================================
ALTER TABLE public.ginv_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ginv_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ginv_vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ginv_intake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ginv_sap_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ginv_billing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ginv_billing_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ginv_client_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ginv_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ginv_platform_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ginv_uttai_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- 6a. ginv_jobs — All G-Invoice users can view; ginv_admin can manage
CREATE POLICY "ginv users can view jobs"
  ON public.ginv_jobs FOR SELECT
  TO authenticated
  USING (public.get_ginv_role() IS NOT NULL);

CREATE POLICY "ginv_admin can manage jobs"
  ON public.ginv_jobs FOR ALL
  TO authenticated
  USING (public.get_ginv_role() = 'ginv_admin')
  WITH CHECK (public.get_ginv_role() = 'ginv_admin');

-- 6b. ginv_vendors — All G-Invoice users can view; ginv_admin can manage
CREATE POLICY "ginv users can view vendors"
  ON public.ginv_vendors FOR SELECT
  TO authenticated
  USING (public.get_ginv_role() IS NOT NULL);

CREATE POLICY "ginv_admin can manage vendors"
  ON public.ginv_vendors FOR ALL
  TO authenticated
  USING (public.get_ginv_role() = 'ginv_admin')
  WITH CHECK (public.get_ginv_role() = 'ginv_admin');

-- 6c. ginv_vendor_documents — All G-Invoice users can view; admin + compliance can manage
CREATE POLICY "ginv users can view vendor documents"
  ON public.ginv_vendor_documents FOR SELECT
  TO authenticated
  USING (public.get_ginv_role() IS NOT NULL);

CREATE POLICY "ginv compliance can manage vendor documents"
  ON public.ginv_vendor_documents FOR ALL
  TO authenticated
  USING (public.get_ginv_role() IN ('ginv_admin', 'ginv_compliance_uttai'))
  WITH CHECK (public.get_ginv_role() IN ('ginv_admin', 'ginv_compliance_uttai'));

-- 6d. ginv_intake_items — Operadores see own; BPO/Admin see all
CREATE POLICY "ginv_operador can view own intake items"
  ON public.ginv_intake_items FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.get_ginv_role() IN ('ginv_bpo_proveedores', 'ginv_bpo_facturacion', 'ginv_socio_aprobador', 'ginv_compliance_uttai', 'ginv_admin')
  );

CREATE POLICY "ginv_operador can create intake items"
  ON public.ginv_intake_items FOR INSERT
  TO authenticated
  WITH CHECK (public.get_ginv_role() IN ('ginv_operador', 'ginv_admin'));

CREATE POLICY "ginv users can update intake items"
  ON public.ginv_intake_items FOR UPDATE
  TO authenticated
  USING (
    (created_by = auth.uid() AND status = 'draft')
    OR public.get_ginv_role() IN ('ginv_bpo_proveedores', 'ginv_socio_aprobador', 'ginv_admin')
  )
  WITH CHECK (
    (created_by = auth.uid() AND status = 'draft')
    OR public.get_ginv_role() IN ('ginv_bpo_proveedores', 'ginv_socio_aprobador', 'ginv_admin')
  );

-- 6e. ginv_sap_postings — BPO proveedores + admin
CREATE POLICY "ginv users can view sap postings"
  ON public.ginv_sap_postings FOR SELECT
  TO authenticated
  USING (public.get_ginv_role() IS NOT NULL);

CREATE POLICY "ginv_bpo can manage sap postings"
  ON public.ginv_sap_postings FOR ALL
  TO authenticated
  USING (public.get_ginv_role() IN ('ginv_bpo_proveedores', 'ginv_admin'))
  WITH CHECK (public.get_ginv_role() IN ('ginv_bpo_proveedores', 'ginv_admin'));

-- 6f. ginv_billing_batches — BPO facturacion + socio + admin
CREATE POLICY "ginv users can view billing batches"
  ON public.ginv_billing_batches FOR SELECT
  TO authenticated
  USING (public.get_ginv_role() IS NOT NULL);

CREATE POLICY "ginv_bpo_facturacion can manage billing batches"
  ON public.ginv_billing_batches FOR ALL
  TO authenticated
  USING (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_admin'))
  WITH CHECK (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_admin'));

-- 6g. ginv_billing_batch_items
CREATE POLICY "ginv users can view billing batch items"
  ON public.ginv_billing_batch_items FOR SELECT
  TO authenticated
  USING (public.get_ginv_role() IS NOT NULL);

CREATE POLICY "ginv_bpo_facturacion can manage billing batch items"
  ON public.ginv_billing_batch_items FOR ALL
  TO authenticated
  USING (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_admin'))
  WITH CHECK (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_admin'));

-- 6h. ginv_client_invoices
CREATE POLICY "ginv users can view client invoices"
  ON public.ginv_client_invoices FOR SELECT
  TO authenticated
  USING (public.get_ginv_role() IS NOT NULL);

CREATE POLICY "ginv_bpo_facturacion can manage client invoices"
  ON public.ginv_client_invoices FOR ALL
  TO authenticated
  USING (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_socio_aprobador', 'ginv_admin'))
  WITH CHECK (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_socio_aprobador', 'ginv_admin'));

-- 6i. ginv_deliveries
CREATE POLICY "ginv users can view deliveries"
  ON public.ginv_deliveries FOR SELECT
  TO authenticated
  USING (public.get_ginv_role() IS NOT NULL);

CREATE POLICY "ginv_bpo_facturacion can manage deliveries"
  ON public.ginv_deliveries FOR ALL
  TO authenticated
  USING (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_admin'))
  WITH CHECK (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_admin'));

-- 6j. ginv_platform_tasks
CREATE POLICY "ginv users can view platform tasks"
  ON public.ginv_platform_tasks FOR SELECT
  TO authenticated
  USING (public.get_ginv_role() IS NOT NULL);

CREATE POLICY "ginv_bpo_facturacion can manage platform tasks"
  ON public.ginv_platform_tasks FOR ALL
  TO authenticated
  USING (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_admin'))
  WITH CHECK (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_admin'));

-- 6k. ginv_uttai_requests
CREATE POLICY "ginv users can view uttai requests"
  ON public.ginv_uttai_requests FOR SELECT
  TO authenticated
  USING (public.get_ginv_role() IS NOT NULL);

CREATE POLICY "ginv users can create uttai requests"
  ON public.ginv_uttai_requests FOR INSERT
  TO authenticated
  WITH CHECK (public.get_ginv_role() IS NOT NULL);

CREATE POLICY "ginv_compliance can manage uttai requests"
  ON public.ginv_uttai_requests FOR UPDATE
  TO authenticated
  USING (public.get_ginv_role() IN ('ginv_compliance_uttai', 'ginv_admin'))
  WITH CHECK (public.get_ginv_role() IN ('ginv_compliance_uttai', 'ginv_admin'));

-- ============================================
-- 7. STORAGE: Private bucket for G-Invoice documents
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('ginv-documents', 'ginv-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: only G-Invoice users can access
CREATE POLICY "ginv users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ginv-documents'
    AND (auth.jwt() -> 'app_metadata' ->> 'ginv_role') IS NOT NULL
  );

CREATE POLICY "ginv users can view own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'ginv-documents'
    AND (auth.jwt() -> 'app_metadata' ->> 'ginv_role') IS NOT NULL
  );

CREATE POLICY "ginv_admin can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'ginv-documents'
    AND (auth.jwt() -> 'app_metadata' ->> 'ginv_role') = 'ginv_admin'
  );
