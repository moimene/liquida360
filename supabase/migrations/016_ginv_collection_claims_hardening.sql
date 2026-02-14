-- ============================================
-- 016_ginv_collection_claims_hardening
-- Endurece flujo CxC: separacion de funciones y transiciones permitidas
-- Fecha: 2026-02-14
-- ============================================

-- 1) Refuerzo de politicas UPDATE para separar capacidades por rol.
DROP POLICY IF EXISTS "ginv_bpo_facturacion can manage collection claims"
  ON public.ginv_collection_claims;

CREATE POLICY "ginv_bpo_facturacion can manage own claim workflow"
  ON public.ginv_collection_claims FOR UPDATE
  TO authenticated
  USING (public.get_ginv_role() IN ('ginv_bpo_facturacion', 'ginv_admin'))
  WITH CHECK (
    public.get_ginv_role() = 'ginv_admin'
    OR (
      public.get_ginv_role() = 'ginv_bpo_facturacion'
      AND status IN ('pending_approval', 'sent')
    )
  );

DROP POLICY IF EXISTS "ginv_socio can approve collection claims"
  ON public.ginv_collection_claims;

CREATE POLICY "ginv_socio can approve collection claims"
  ON public.ginv_collection_claims FOR UPDATE
  TO authenticated
  USING (public.get_ginv_role() IN ('ginv_socio_aprobador', 'ginv_admin'))
  WITH CHECK (
    public.get_ginv_role() = 'ginv_admin'
    OR (
      public.get_ginv_role() = 'ginv_socio_aprobador'
      AND status IN ('approved', 'rejected')
    )
  );

-- 2) Trigger guard para impedir saltos de estado fuera del flujo:
-- pending_approval -> approved/rejected -> sent
-- Nota: se aplica cuando hay contexto auth (auth.uid), dejando mantenimiento
-- SQL interno sin bloqueo.
CREATE OR REPLACE FUNCTION public.ginv_guard_collection_claim_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  actor_role TEXT;
  approval_fields_changed BOOLEAN;
  delivery_fields_changed BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  actor_role := public.get_ginv_role();
  IF actor_role IS NULL THEN
    RAISE EXCEPTION 'No autorizado para actualizar reclamaciones CxC';
  END IF;

  approval_fields_changed :=
    NEW.approval_notes IS DISTINCT FROM OLD.approval_notes
    OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
    OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
    OR NEW.rejected_by IS DISTINCT FROM OLD.rejected_by
    OR NEW.rejected_at IS DISTINCT FROM OLD.rejected_at;

  delivery_fields_changed :=
    NEW.sent_by IS DISTINCT FROM OLD.sent_by
    OR NEW.sent_at IS DISTINCT FROM OLD.sent_at
    OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'pending_approval' AND NEW.status IN ('approved', 'rejected') THEN
      IF actor_role NOT IN ('ginv_socio_aprobador', 'ginv_admin') THEN
        RAISE EXCEPTION 'Solo socio aprobador/admin pueden aprobar o rechazar reclamaciones';
      END IF;
    ELSIF OLD.status = 'approved' AND NEW.status = 'sent' THEN
      IF actor_role NOT IN ('ginv_bpo_facturacion', 'ginv_admin') THEN
        RAISE EXCEPTION 'Solo BPO facturacion/admin pueden enviar reclamaciones';
      END IF;
    ELSE
      RAISE EXCEPTION 'Transicion de estado no permitida: % -> %', OLD.status, NEW.status;
    END IF;
  END IF;

  IF approval_fields_changed AND actor_role NOT IN ('ginv_socio_aprobador', 'ginv_admin') THEN
    RAISE EXCEPTION 'Solo socio aprobador/admin pueden modificar datos de aprobacion';
  END IF;

  IF delivery_fields_changed THEN
    IF actor_role NOT IN ('ginv_bpo_facturacion', 'ginv_admin') THEN
      RAISE EXCEPTION 'Solo BPO facturacion/admin pueden registrar el envio';
    END IF;
    IF NOT (OLD.status = 'approved' AND NEW.status = 'sent') AND actor_role <> 'ginv_admin' THEN
      RAISE EXCEPTION 'El envio solo es valido desde estado approved';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ginv_guard_collection_claim_transition
  ON public.ginv_collection_claims;

CREATE TRIGGER trg_ginv_guard_collection_claim_transition
  BEFORE UPDATE ON public.ginv_collection_claims
  FOR EACH ROW EXECUTE FUNCTION public.ginv_guard_collection_claim_transition();
