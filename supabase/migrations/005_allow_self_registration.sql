-- ============================================
-- LIQUIDA360 - Allow Self-Registration INSERT
-- Version: 005
-- Fecha: 2026-02-07
-- Fix: new users (no role yet) could not insert
--      their own correspondent record at signup.
-- ============================================

-- Allow any authenticated user WITHOUT a role to insert a correspondent
-- record linked to their own auth.uid(). This covers the registration
-- flow where signUp() succeeds but the user has no app_metadata.role yet.
CREATE POLICY "New user can self-register as correspondent"
  ON public.correspondents FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.get_user_role() IS NULL
  );
