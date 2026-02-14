-- ============================================
-- 013_ginv_sap_payload_and_fx_guardrails
-- Metadatos SAP (adjuntos + auditoria FX) y saneamiento de conversiones
-- Fecha: 2026-02-14
-- ============================================

ALTER TABLE public.ginv_client_invoices
  ADD COLUMN IF NOT EXISTS sap_payload JSONB NOT NULL DEFAULT '{}'::JSONB;

CREATE INDEX IF NOT EXISTS idx_ginv_client_invoices_sap_payload
  ON public.ginv_client_invoices USING GIN (sap_payload);

UPDATE public.ginv_intake_items
SET
  exchange_rate_to_eur = 1,
  amount_eur = amount
WHERE currency = 'EUR'
  AND (exchange_rate_to_eur IS NULL OR amount_eur IS NULL);

UPDATE public.ginv_intake_items
SET amount_eur = ROUND((amount * exchange_rate_to_eur)::NUMERIC, 2)
WHERE currency <> 'EUR'
  AND exchange_rate_to_eur IS NOT NULL
  AND amount_eur IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ginv_intake_items_exchange_rate_positive_check'
  ) THEN
    ALTER TABLE public.ginv_intake_items
      ADD CONSTRAINT ginv_intake_items_exchange_rate_positive_check
      CHECK (exchange_rate_to_eur IS NULL OR exchange_rate_to_eur > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ginv_intake_items_amount_eur_non_negative_check'
  ) THEN
    ALTER TABLE public.ginv_intake_items
      ADD CONSTRAINT ginv_intake_items_amount_eur_non_negative_check
      CHECK (amount_eur IS NULL OR amount_eur >= 0);
  END IF;
END $$;

