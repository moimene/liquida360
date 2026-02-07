-- ============================================
-- LIQUIDA360 - Create documents storage bucket
-- Version: 006
-- Fecha: 2026-02-07
-- Fix: The 'documents' bucket for certificate files was never created
-- ============================================

-- 1. Create the 'documents' bucket (public for download via URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS policies for documents bucket
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can view documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Admin can delete documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
