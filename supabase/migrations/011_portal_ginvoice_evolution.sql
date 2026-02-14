-- ============================================
-- 011_portal_ginvoice_evolution
-- Ajustes evolutivos solicitados por usuarios
-- Fecha: 2026-02-14
-- ============================================

-- 1) Portal corresponsal: datos bancarios + tipos de certificados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'certificate_doc_type'
  ) THEN
    CREATE TYPE certificate_doc_type AS ENUM (
      'residence',
      'withholding',
      'bank_account'
    );
  END IF;
END $$;

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS certificate_type certificate_doc_type NOT NULL DEFAULT 'residence';

CREATE INDEX IF NOT EXISTS idx_certificates_type
  ON public.certificates(certificate_type);

ALTER TABLE public.correspondents
  ADD COLUMN IF NOT EXISTS bank_account_holder TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_iban TEXT,
  ADD COLUMN IF NOT EXISTS bank_swift_bic TEXT,
  ADD COLUMN IF NOT EXISTS bank_certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS bank_data_updated_at TIMESTAMPTZ;

-- 2) G-Invoice: base para mejoras de subidas/tasas
ALTER TABLE public.ginv_jobs
  ADD COLUMN IF NOT EXISTS client_country TEXT DEFAULT 'ES';

UPDATE public.ginv_jobs
SET client_country = COALESCE(client_country, 'ES')
WHERE client_country IS NULL;

ALTER TABLE public.ginv_jobs
  ALTER COLUMN client_country SET NOT NULL;

ALTER TABLE public.ginv_intake_items
  ADD COLUMN IF NOT EXISTS nrc_number TEXT,
  ADD COLUMN IF NOT EXISTS official_organism TEXT,
  ADD COLUMN IF NOT EXISTS tariff_type TEXT,
  ADD COLUMN IF NOT EXISTS exchange_rate_to_eur NUMERIC(12, 6),
  ADD COLUMN IF NOT EXISTS amount_eur NUMERIC(15, 2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ginv_intake_items_tariff_type_check'
  ) THEN
    ALTER TABLE public.ginv_intake_items
      ADD CONSTRAINT ginv_intake_items_tariff_type_check
      CHECK (tariff_type IS NULL OR tariff_type IN ('general', 'special'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ginv_intake_items_nrc
  ON public.ginv_intake_items(nrc_number);

