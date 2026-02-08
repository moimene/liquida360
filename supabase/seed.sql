-- ============================================
-- LIQUIDA360 - Seed Data (Test Environment)
-- ============================================
-- Este script BORRA todos los datos de negocio existentes
-- y los reemplaza con los 5 casos de uso de DatosTest.
--
-- NO toca: auth.users, alert_configs
--
-- Ejecutar via:
--   supabase db reset          (ejecuta migraciones + seed)
--   O pegar directamente en Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. LIMPIAR DATOS EXISTENTES (orden FK inverso)
-- ============================================
DELETE FROM public.audit_log;
DELETE FROM public.notifications;
DELETE FROM public.payment_requests;
DELETE FROM public.liquidations;
DELETE FROM public.certificates;
DELETE FROM public.correspondents;

-- ============================================
-- 2. CORRESPONSALES (5)
-- ============================================
INSERT INTO public.correspondents (id, name, country, tax_id, address, email, phone, status)
VALUES
  -- Mexico
  ('a1000000-0000-0000-0000-000000000001',
   'Bufete Rodriguez & Asociados S.C.', 'MX', 'ROAM850312QX7',
   'Av. Reforma 505, Col. Cuauhtemoc, CDMX 06500, Mexico',
   'contacto@bufeterodriguez.mx', '+52 55 1234 5678', 'active'),
  -- Chile
  ('a1000000-0000-0000-0000-000000000002',
   'Estudio Juridico Pacifico SpA', 'CL', '76.543.210-K',
   'Av. Providencia 1234, Of. 501, Santiago, Chile',
   'info@ejpacifico.cl', '+56 2 9876 5432', 'active'),
  -- China
  ('a1000000-0000-0000-0000-000000000003',
   'Zhu & Partners Law Firm', 'CN', '91310000MA1K4LXX3J',
   '88 Century Avenue, Floor 32, Pudong, Shanghai 200120, China',
   'contact@zhupartners.cn', '+86 21 5888 9999', 'active'),
  -- USA
  ('a1000000-0000-0000-0000-000000000004',
   'Thompson & Reed LLP', 'US', '84-3456789',
   '745 Fifth Avenue, Suite 2100, New York, NY 10151, USA',
   'info@thompsonreed.com', '+1 212 555 0199', 'active'),
  -- Colombia
  ('a1000000-0000-0000-0000-000000000005',
   'Mendoza Arias & Cia. S.A.S.', 'CO', '900.876.543-1',
   'Carrera 7 No. 71-52, Torre B, Of. 1201, Bogota, Colombia',
   'administracion@mendozaarias.co', '+57 601 345 6789', 'active');

-- ============================================
-- 3. CERTIFICADOS (5) - Fechas relativas a CURRENT_DATE
-- ============================================
INSERT INTO public.certificates (id, correspondent_id, issuing_country, issue_date, expiry_date, document_url, status, apostilled, apostille_requirement)
VALUES
  -- Mexico - VALID (vence en ~13 meses) - Cat. D, sin verificacion → apostilla fuertemente recomendada, NO apostillado
  ('b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001', 'MX',
   CURRENT_DATE - INTERVAL '11 months',
   CURRENT_DATE + INTERVAL '13 months',
   NULL, 'valid', false, 'strongly_recommended'),

  -- Chile - VALID (vence en ~4.5 meses) - Cat. A, portal publico → apostilla recomendada, SI apostillado
  ('b1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000002', 'CL',
   CURRENT_DATE - INTERVAL '7 months',
   CURRENT_DATE + INTERVAL '135 days',
   NULL, 'valid', true, 'recommended'),

  -- China - VALID (vence en ~7 meses) - Cat. B, ecosistema cerrado → apostilla recomendada, SI apostillado
  ('b1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000003', 'CN',
   CURRENT_DATE - INTERVAL '5 months',
   CURRENT_DATE + INTERVAL '7 months',
   NULL, 'valid', true, 'recommended'),

  -- USA - EXPIRING_SOON (vence en ~25 dias) - Cat. C, sin portal → apostilla fuertemente recomendada, SI apostillado
  ('b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000004', 'US',
   CURRENT_DATE - INTERVAL '11 months',
   CURRENT_DATE + INTERVAL '25 days',
   NULL, 'expiring_soon', true, 'strongly_recommended'),

  -- Colombia - EXPIRED (vencio hace ~85 dias) - Cat. B, verificacion restringida → apostilla recomendada, NO apostillado
  ('b1000000-0000-0000-0000-000000000005',
   'a1000000-0000-0000-0000-000000000005', 'CO',
   CURRENT_DATE - INTERVAL '450 days',
   CURRENT_DATE - INTERVAL '85 days',
   NULL, 'expired', false, 'recommended');

-- ============================================
-- 4. LIQUIDACIONES (20) + PAYMENT_REQUESTS
-- ============================================
-- Usa DO $$ block para buscar dinamicamente un admin user
-- Si no hay usuarios, las liquidaciones NO se insertan.

DO $$
DECLARE
  v_admin_id UUID;
  v_supervisor_id UUID;
  -- Liquidation IDs (deterministas)
  liq_mx_001 UUID := 'c1000000-0000-0000-0000-000000000001';
  liq_mx_002 UUID := 'c1000000-0000-0000-0000-000000000002';
  liq_mx_003 UUID := 'c1000000-0000-0000-0000-000000000003';
  liq_mx_004 UUID := 'c1000000-0000-0000-0000-000000000004';
  liq_cl_001 UUID := 'c1000000-0000-0000-0000-000000000005';
  liq_cl_002 UUID := 'c1000000-0000-0000-0000-000000000006';
  liq_cl_003 UUID := 'c1000000-0000-0000-0000-000000000007';
  liq_cl_004 UUID := 'c1000000-0000-0000-0000-000000000008';
  liq_cn_001 UUID := 'c1000000-0000-0000-0000-000000000009';
  liq_cn_002 UUID := 'c1000000-0000-0000-0000-000000000010';
  liq_cn_003 UUID := 'c1000000-0000-0000-0000-000000000011';
  liq_cn_004 UUID := 'c1000000-0000-0000-0000-000000000012';
  liq_us_001 UUID := 'c1000000-0000-0000-0000-000000000013';
  liq_us_002 UUID := 'c1000000-0000-0000-0000-000000000014';
  liq_us_003 UUID := 'c1000000-0000-0000-0000-000000000015';
  liq_us_004 UUID := 'c1000000-0000-0000-0000-000000000016';
  liq_co_001 UUID := 'c1000000-0000-0000-0000-000000000017';
  liq_co_002 UUID := 'c1000000-0000-0000-0000-000000000018';
  liq_co_003 UUID := 'c1000000-0000-0000-0000-000000000019';
  liq_co_004 UUID := 'c1000000-0000-0000-0000-000000000020';
BEGIN
  -- Buscar un usuario admin (o cualquier usuario como fallback)
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE raw_app_meta_data->>'role' = 'admin'
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM auth.users LIMIT 1;
  END IF;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'No hay usuarios en auth.users. Liquidaciones no insertadas. Cree al menos un usuario y ejecute de nuevo.';
    RETURN;
  END IF;

  -- Buscar un supervisor para approved_by (o usar el admin)
  SELECT id INTO v_supervisor_id
  FROM auth.users
  WHERE raw_app_meta_data->>'role' = 'supervisor'
  LIMIT 1;

  IF v_supervisor_id IS NULL THEN
    v_supervisor_id := v_admin_id;
  END IF;

  -- ───────────────────────────────────
  -- MEXICO - Bufete Rodriguez (4 facturas)
  -- ───────────────────────────────────

  -- LIQ-MX-001: APPROVED
  INSERT INTO public.liquidations (id, correspondent_id, certificate_id, amount, currency, concept, reference, status, created_by, approved_by)
  VALUES (liq_mx_001, 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
          45000.00, 'MXN', 'Due diligence - Adquisicion inmobiliaria Queretaro', 'BRAR-2025-0089',
          'approved', v_admin_id, v_supervisor_id);

  -- LIQ-MX-002: PENDING_APPROVAL
  INSERT INTO public.liquidations (id, correspondent_id, certificate_id, amount, currency, concept, reference, status, created_by)
  VALUES (liq_mx_002, 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
          78500.00, 'MXN', 'Asesoria fiscal - Reestructuracion corporativa', 'BRAR-2025-0102',
          'pending_approval', v_admin_id);

  -- LIQ-MX-003: DRAFT
  INSERT INTO public.liquidations (id, correspondent_id, amount, currency, concept, reference, status, created_by)
  VALUES (liq_mx_003, 'a1000000-0000-0000-0000-000000000001',
          125000.00, 'MXN', 'Litigio comercial - Honorarios Q4 2025', 'BRAR-2025-0118',
          'draft', v_admin_id);

  -- LIQ-MX-004: PAID
  INSERT INTO public.liquidations (id, correspondent_id, certificate_id, amount, currency, concept, reference, status, created_by, approved_by)
  VALUES (liq_mx_004, 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
          32000.00, 'USD', 'Constitucion de sociedad - Fintech Mexico', 'BRAR-2026-0003',
          'paid', v_admin_id, v_supervisor_id);

  -- ───────────────────────────────────
  -- CHILE - Estudio Juridico Pacifico (4 facturas)
  -- ───────────────────────────────────

  -- LIQ-CL-001: PAID
  INSERT INTO public.liquidations (id, correspondent_id, certificate_id, amount, currency, concept, reference, status, created_by, approved_by)
  VALUES (liq_cl_001, 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
          18500.00, 'USD', 'Arbitraje internacional - Caso minero Atacama', 'EJP-2025-ARB-044',
          'paid', v_admin_id, v_supervisor_id);

  -- LIQ-CL-002: PAYMENT_REQUESTED
  INSERT INTO public.liquidations (id, correspondent_id, certificate_id, amount, currency, concept, reference, status, created_by, approved_by)
  VALUES (liq_cl_002, 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
          42000000.00, 'CLP', 'M&A advisory - Fusion cadena retail', 'EJP-2025-MA-007',
          'payment_requested', v_admin_id, v_supervisor_id);

  -- LIQ-CL-003: APPROVED
  INSERT INTO public.liquidations (id, correspondent_id, certificate_id, amount, currency, concept, reference, status, created_by, approved_by)
  VALUES (liq_cl_003, 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
          15750000.00, 'CLP', 'Compliance y gobierno corporativo 2025', 'EJP-2025-COMP-012',
          'approved', v_admin_id, v_supervisor_id);

  -- LIQ-CL-004: PENDING_APPROVAL
  INSERT INTO public.liquidations (id, correspondent_id, certificate_id, amount, currency, concept, reference, status, created_by)
  VALUES (liq_cl_004, 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
          8200000.00, 'CLP', 'Defensa laboral colectiva - Sector salmon', 'EJP-2026-LAB-001',
          'pending_approval', v_admin_id);

  -- ───────────────────────────────────
  -- CHINA - Zhu & Partners (4 facturas)
  -- ───────────────────────────────────

  -- LIQ-CN-001: PAID
  INSERT INTO public.liquidations (id, correspondent_id, certificate_id, amount, currency, concept, reference, status, created_by, approved_by)
  VALUES (liq_cn_001, 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
          85000.00, 'USD', 'M&A transfronterizo - Proveedor automotriz aleman', 'ZP-2025-INTL-0034',
          'paid', v_admin_id, v_supervisor_id);

  -- LIQ-CN-002: APPROVED
  INSERT INTO public.liquidations (id, correspondent_id, certificate_id, amount, currency, concept, reference, status, created_by, approved_by)
  VALUES (liq_cn_002, 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
          38000.00, 'USD', 'Registro PI - 47 marcas Greater China', 'ZP-2025-IP-0089',
          'approved', v_admin_id, v_supervisor_id);

  -- LIQ-CN-003: PAYMENT_REQUESTED
  INSERT INTO public.liquidations (id, correspondent_id, certificate_id, amount, currency, concept, reference, status, created_by, approved_by)
  VALUES (liq_cn_003, 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
          52000.00, 'USD', 'Compliance inversion extranjera - WFOE Suzhou', 'ZP-2026-FDI-0002',
          'payment_requested', v_admin_id, v_supervisor_id);

  -- LIQ-CN-004: DRAFT
  INSERT INTO public.liquidations (id, correspondent_id, amount, currency, concept, reference, status, created_by)
  VALUES (liq_cn_004, 'a1000000-0000-0000-0000-000000000003',
          120000.00, 'USD', 'Resolucion de disputas - CIETAC Beijing', 'ZP-2026-ARB-0001',
          'draft', v_admin_id);

  -- ───────────────────────────────────
  -- USA - Thompson & Reed (4 facturas)
  -- ───────────────────────────────────

  -- LIQ-US-001: PAID
  INSERT INTO public.liquidations (id, correspondent_id, certificate_id, amount, currency, concept, reference, status, created_by, approved_by)
  VALUES (liq_us_001, 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004',
          175000.00, 'USD', 'Litigio de valores - Sector biotech', 'TR-2025-LIT-0456',
          'paid', v_admin_id, v_supervisor_id);

  -- LIQ-US-002: APPROVED
  INSERT INTO public.liquidations (id, correspondent_id, certificate_id, amount, currency, concept, reference, status, created_by, approved_by)
  VALUES (liq_us_002, 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004',
          95000.00, 'USD', 'Reestructuracion corporativa - Chapter 11 advisory', 'TR-2025-REST-0078',
          'approved', v_admin_id, v_supervisor_id);

  -- LIQ-US-003: PENDING_APPROVAL (bloqueada por cert expiring_soon)
  INSERT INTO public.liquidations (id, correspondent_id, amount, currency, concept, reference, status, created_by)
  VALUES (liq_us_003, 'a1000000-0000-0000-0000-000000000004',
          28500.00, 'USD', 'Inmigracion - Procesamiento visados H-1B y L-1 Q1', 'TR-2026-IMM-0012',
          'pending_approval', v_admin_id);

  -- LIQ-US-004: DRAFT (bloqueada por cert expiring_soon)
  INSERT INTO public.liquidations (id, correspondent_id, amount, currency, concept, reference, status, created_by)
  VALUES (liq_us_004, 'a1000000-0000-0000-0000-000000000004',
          45000.00, 'USD', 'Inmobiliario - Arrendamiento comercial Manhattan', 'TR-2026-RE-0004',
          'draft', v_admin_id);

  -- ───────────────────────────────────
  -- COLOMBIA - Mendoza Arias (4 facturas)
  -- ───────────────────────────────────

  -- LIQ-CO-001: PAID
  INSERT INTO public.liquidations (id, correspondent_id, certificate_id, amount, currency, concept, reference, status, created_by, approved_by)
  VALUES (liq_co_001, 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005',
          45000000.00, 'COP', 'Litigio administrativo - Superintendencia', 'MAC-2025-ADM-0234',
          'paid', v_admin_id, v_supervisor_id);

  -- LIQ-CO-002: REJECTED
  INSERT INTO public.liquidations (id, correspondent_id, amount, currency, concept, reference, status, created_by)
  VALUES (liq_co_002, 'a1000000-0000-0000-0000-000000000005',
          72000000.00, 'COP', 'Due diligence - Planta manufacturera Medellin', 'MAC-2025-DD-0067',
          'rejected', v_admin_id);

  -- LIQ-CO-003: DRAFT (bloqueada por cert expired)
  INSERT INTO public.liquidations (id, correspondent_id, amount, currency, concept, reference, status, created_by)
  VALUES (liq_co_003, 'a1000000-0000-0000-0000-000000000005',
          38500000.00, 'COP', 'Asesoria tributaria - Planificacion fiscal 2026', 'MAC-2026-TAX-0001',
          'draft', v_admin_id);

  -- LIQ-CO-004: DRAFT (bloqueada por cert expired)
  INSERT INTO public.liquidations (id, correspondent_id, amount, currency, concept, reference, status, created_by)
  VALUES (liq_co_004, 'a1000000-0000-0000-0000-000000000005',
          22000000.00, 'COP', 'Propiedad intelectual - Registro marca andina', 'MAC-2026-PI-0003',
          'draft', v_admin_id);

  -- ───────────────────────────────────
  -- PAYMENT_REQUESTS (para liquidaciones paid y payment_requested)
  -- ───────────────────────────────────

  -- MX-004: PAID
  INSERT INTO public.payment_requests (id, liquidation_id, status, requested_at, processed_at, processed_by, notes)
  VALUES ('d1000000-0000-0000-0000-000000000001', liq_mx_004, 'paid',
          NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days', v_supervisor_id,
          'Pago procesado via transferencia SWIFT');

  -- CL-001: PAID
  INSERT INTO public.payment_requests (id, liquidation_id, status, requested_at, processed_at, processed_by, notes)
  VALUES ('d1000000-0000-0000-0000-000000000002', liq_cl_001, 'paid',
          NOW() - INTERVAL '45 days', NOW() - INTERVAL '40 days', v_supervisor_id,
          'Pago procesado en USD via corresponsal bancario');

  -- CL-002: PENDING (payment_requested)
  INSERT INTO public.payment_requests (id, liquidation_id, status, requested_at, notes)
  VALUES ('d1000000-0000-0000-0000-000000000003', liq_cl_002, 'pending',
          NOW() - INTERVAL '5 days',
          'Pendiente procesamiento - Importe elevado requiere autorizacion adicional');

  -- CN-001: PAID
  INSERT INTO public.payment_requests (id, liquidation_id, status, requested_at, processed_at, processed_by, notes)
  VALUES ('d1000000-0000-0000-0000-000000000004', liq_cn_001, 'paid',
          NOW() - INTERVAL '60 days', NOW() - INTERVAL '55 days', v_supervisor_id,
          'Pago procesado via SWIFT a cuenta Shanghai');

  -- CN-003: PENDING (payment_requested)
  INSERT INTO public.payment_requests (id, liquidation_id, status, requested_at, notes)
  VALUES ('d1000000-0000-0000-0000-000000000005', liq_cn_003, 'pending',
          NOW() - INTERVAL '3 days',
          'En tramite - Verificacion compliance inversion extranjera');

  -- US-001: PAID
  INSERT INTO public.payment_requests (id, liquidation_id, status, requested_at, processed_at, processed_by, notes)
  VALUES ('d1000000-0000-0000-0000-000000000006', liq_us_001, 'paid',
          NOW() - INTERVAL '90 days', NOW() - INTERVAL '85 days', v_supervisor_id,
          'Pago procesado via ACH a cuenta New York');

  -- CO-001: PAID
  INSERT INTO public.payment_requests (id, liquidation_id, status, requested_at, processed_at, processed_by, notes)
  VALUES ('d1000000-0000-0000-0000-000000000007', liq_co_001, 'paid',
          NOW() - INTERVAL '120 days', NOW() - INTERVAL '115 days', v_supervisor_id,
          'Pago procesado via transferencia a cuenta Bogota');

  RAISE NOTICE 'Seed completado: 5 corresponsales, 5 certificados, 20 liquidaciones, 7 payment_requests';
END $$;
