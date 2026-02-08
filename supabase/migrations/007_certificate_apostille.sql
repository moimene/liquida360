-- ============================================
-- LIQUIDA360 - Certificate Apostille Field
-- Version: 007
-- Fecha: 2026-02-08
-- ============================================
-- Adds apostille tracking and risk level to certificates.
-- Supports AEAT/Spain criteria for certificate acceptance.
-- ============================================

-- 1. Add apostille field to certificates
ALTER TABLE public.certificates
  ADD COLUMN apostilled BOOLEAN DEFAULT false NOT NULL;

-- 2. Add apostille risk level per country (informational, not enforced)
-- Stored as text: 'not_required' | 'recommended' | 'strongly_recommended'
ALTER TABLE public.certificates
  ADD COLUMN apostille_requirement TEXT DEFAULT 'recommended';

COMMENT ON COLUMN public.certificates.apostilled IS 'Whether this certificate has been apostilled (Hague Convention)';
COMMENT ON COLUMN public.certificates.apostille_requirement IS 'Apostille risk level for this country: not_required (EU), recommended (Cat.A/B with e-verification), strongly_recommended (Cat.C/D without e-verification)';
