-- ============================================
-- 012_ginv_billing_lifecycle_rls
-- Permisos para cerrar el ciclo billed/archived desde Facturacion
-- Fecha: 2026-02-14
-- ============================================

CREATE POLICY "ginv_bpo_facturacion can update intake billing lifecycle"
  ON public.ginv_intake_items FOR UPDATE
  TO authenticated
  USING (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_admin'))
  WITH CHECK (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_admin'));
