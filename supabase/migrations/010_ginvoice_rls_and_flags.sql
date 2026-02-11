-- ============================================
-- 010_ginvoice_rls_and_flags
-- Ajustes RLS y feature-flag mínimo para G-Invoice
-- Fecha: 2026-02-11
-- ============================================

-- Permitir a ginv_operador actualizar sus propios intake items más allá de 'draft'
-- (manteniendo la policy existente). Esto destraba el flujo submit/aprobación.
CREATE POLICY "ginv_operador can manage own intake lifecycle"
  ON public.ginv_intake_items FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Feature flag por usuario (campo app_metadata.ginv_enabled). Expuesto vía función helper.
CREATE OR REPLACE FUNCTION public.is_ginvoice_enabled()
RETURNS boolean AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'ginv_enabled')::boolean, true);
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
