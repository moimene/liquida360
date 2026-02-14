-- ============================================
-- 015_ginv_collections_claims
-- Flujo semiautomatico de reclamaciones CxC con aprobacion previa
-- Fecha: 2026-02-14
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ginv_collection_claim_status'
  ) THEN
    CREATE TYPE ginv_collection_claim_status AS ENUM (
      'pending_approval',
      'approved',
      'rejected',
      'sent'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ginv_collection_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_invoice_id UUID NOT NULL REFERENCES public.ginv_client_invoices(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.ginv_jobs(id) ON DELETE SET NULL,
  status ginv_collection_claim_status NOT NULL DEFAULT 'pending_approval',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipients JSONB NOT NULL DEFAULT '[]'::JSONB,
  cc_recipients JSONB NOT NULL DEFAULT '[]'::JSONB,
  responsible_recipients JSONB NOT NULL DEFAULT '[]'::JSONB,
  approval_notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  delivery_id UUID REFERENCES public.ginv_deliveries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_ginv_collection_claims_updated_at
  BEFORE UPDATE ON public.ginv_collection_claims
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ginv_collection_claims_approved_fields_check'
  ) THEN
    ALTER TABLE public.ginv_collection_claims
      ADD CONSTRAINT ginv_collection_claims_approved_fields_check
      CHECK (
        status <> 'approved'
        OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ginv_collection_claims_rejected_fields_check'
  ) THEN
    ALTER TABLE public.ginv_collection_claims
      ADD CONSTRAINT ginv_collection_claims_rejected_fields_check
      CHECK (
        status <> 'rejected'
        OR (rejected_by IS NOT NULL AND rejected_at IS NOT NULL)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ginv_collection_claims_sent_fields_check'
  ) THEN
    ALTER TABLE public.ginv_collection_claims
      ADD CONSTRAINT ginv_collection_claims_sent_fields_check
      CHECK (
        status <> 'sent'
        OR (
          approved_by IS NOT NULL
          AND approved_at IS NOT NULL
          AND sent_by IS NOT NULL
          AND sent_at IS NOT NULL
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ginv_collection_claims_invoice
  ON public.ginv_collection_claims(client_invoice_id);

CREATE INDEX IF NOT EXISTS idx_ginv_collection_claims_status
  ON public.ginv_collection_claims(status);

CREATE INDEX IF NOT EXISTS idx_ginv_collection_claims_job
  ON public.ginv_collection_claims(job_id);

CREATE INDEX IF NOT EXISTS idx_ginv_collection_claims_created_at
  ON public.ginv_collection_claims(created_at DESC);

ALTER TABLE public.ginv_collection_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ginv users can view collection claims"
  ON public.ginv_collection_claims FOR SELECT
  TO authenticated
  USING (public.get_ginv_role() IS NOT NULL);

CREATE POLICY "ginv_bpo_facturacion can create collection claims"
  ON public.ginv_collection_claims FOR INSERT
  TO authenticated
  WITH CHECK (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_admin'));

CREATE POLICY "ginv_bpo_facturacion can manage collection claims"
  ON public.ginv_collection_claims FOR UPDATE
  TO authenticated
  USING (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_admin'))
  WITH CHECK (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_admin'));

CREATE POLICY "ginv_socio can approve collection claims"
  ON public.ginv_collection_claims FOR UPDATE
  TO authenticated
  USING (public.get_ginv_role() IN ('ginv_socio_aprobador', 'ginv_admin'))
  WITH CHECK (public.get_ginv_role() IN ('ginv_socio_aprobador', 'ginv_admin'));

