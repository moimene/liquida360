-- ============================================
-- 014_ginv_accounts_receivable_baseline
-- Base CxC: estado de cobro, vencimiento y saldos en factura cliente
-- Fecha: 2026-02-14
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ginv_collection_status'
  ) THEN
    CREATE TYPE ginv_collection_status AS ENUM ('pending', 'partially_paid', 'paid');
  END IF;
END $$;

ALTER TABLE public.ginv_client_invoices
  ADD COLUMN IF NOT EXISTS collection_status ginv_collection_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS amount_due_eur NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS amount_paid_eur NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

UPDATE public.ginv_client_invoices
SET due_date = (sap_invoice_date + INTERVAL '60 days')::DATE
WHERE due_date IS NULL
  AND sap_invoice_date IS NOT NULL;

UPDATE public.ginv_client_invoices
SET amount_due_eur = ROUND((sap_payload #>> '{fx_audit,total_amount_eur}')::NUMERIC, 2)
WHERE amount_due_eur IS NULL
  AND sap_payload ? 'fx_audit'
  AND (sap_payload #>> '{fx_audit,total_amount_eur}') IS NOT NULL;

UPDATE public.ginv_client_invoices
SET collection_status = 'paid',
    paid_at = COALESCE(paid_at, timezone('utc'::text, now()))
WHERE amount_due_eur IS NOT NULL
  AND amount_due_eur > 0
  AND amount_paid_eur >= amount_due_eur
  AND collection_status <> 'paid';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ginv_client_invoices_amount_due_non_negative_check'
  ) THEN
    ALTER TABLE public.ginv_client_invoices
      ADD CONSTRAINT ginv_client_invoices_amount_due_non_negative_check
      CHECK (amount_due_eur IS NULL OR amount_due_eur >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ginv_client_invoices_amount_paid_non_negative_check'
  ) THEN
    ALTER TABLE public.ginv_client_invoices
      ADD CONSTRAINT ginv_client_invoices_amount_paid_non_negative_check
      CHECK (amount_paid_eur >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ginv_client_invoices_collection_status
  ON public.ginv_client_invoices(collection_status);

CREATE INDEX IF NOT EXISTS idx_ginv_client_invoices_due_date
  ON public.ginv_client_invoices(due_date);

