/**
 * G-Invoice Seed Data — populates all ginv_ tables with realistic test data
 * covering every workflow state. Uses service_role key (bypasses RLS).
 *
 * v1.0: g_invoice datos test/Simulación_de_Corresponsales_y_Facturas.docx.md
 * v2.0: g_invoice datos test/nuevo set documentos prueba/
 * Schema authority: supabase/migrations/009_ginvoice_schema.sql
 */
import { supabaseAdmin } from './supabase-admin'

// ── User IDs (from Supabase auth) ──────────────────────────────────
const USERS = {
  admin: '357343cd-173e-4336-adaf-77aacdf0eae7',       // ginv.admin
  operador: '08a6bb65-ca1b-4d47-9d47-af792fb36a25',    // ginv.operador
  socio: '1e6e98df-3fe7-4429-b9a2-c4e9930cbed6',       // ginv.socio_aprobador
  bpo: '5bf57825-ab3e-4dbf-af06-8b54a5154a30',         // ginv.bpo_facturacion
  compliance: '43856584-897c-480c-aea9-391c53db96d3',   // ginv.compliance_uttai
}

// Prefix for easy cleanup
const P = 'SEED'

// ── Helper: upsert-safe insert (skip if exists) ────────────────────
async function safeInsert<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
    .select()
  if (error) {
    console.warn(`⚠ ${table}: ${error.message}`)
    return []
  }
  return data ?? []
}

// ── MAIN SEED FUNCTION ─────────────────────────────────────────────
export async function seedGInvTestData() {
  console.log('🌱 Seeding G-Invoice test data (v1.0 + v2.0)...')

  // ─── 1. JOBS ─────────────────────────────────────────────────────
  const jobs = [
    // ── v1.0 Jobs (J001–J006) ──
    { id: 'a0000001-0001-4000-8000-000000000001', job_code: `${P}-MAT-2025-0234`, client_code: 'NVP-001', client_name: 'Grupo Farmacéutico Novapharma S.A.', uttai_status: 'clear', uttai_subject_obliged: true, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000002', job_code: `${P}-MAT-2025-0412`, client_code: 'IAC-002', client_name: 'Inversiones Atlántico Capital S.L.', uttai_status: 'blocked', uttai_subject_obliged: null, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000003', job_code: `${P}-MAT-2025-0589`, client_code: 'CME-003', client_name: 'Constructora Mediterráneo S.A.U.', uttai_status: 'clear', uttai_subject_obliged: false, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000004', job_code: `${P}-MAT-2026-0023`, client_code: 'TVE-004', client_name: 'Tech Ventures Europe B.V.', uttai_status: 'clear', uttai_subject_obliged: true, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000005', job_code: `${P}-MAT-2026-0045`, client_code: 'ERS-005', client_name: 'Energías Renovables del Sur S.A.', uttai_status: 'pending_review', uttai_subject_obliged: null, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000006', job_code: `${P}-MAT-2025-0678`, client_code: 'BCR-006', client_name: 'Banco Cooperativo Regional', uttai_status: 'clear', uttai_subject_obliged: true, owner_user_id: USERS.socio, status: 'active' },
    // ── v2.0 Jobs (J007–J014) ──
    { id: 'a0000001-0001-4000-8000-000000000007', job_code: `${P}-MAT-2026-0089`, client_code: 'BPH-007', client_name: 'BioPharm Holdings Inc.', uttai_status: 'clear', uttai_subject_obliged: true, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000008', job_code: `${P}-MAT-2026-0091`, client_code: 'BPH-007', client_name: 'BioPharm Holdings Inc.', uttai_status: 'clear', uttai_subject_obliged: true, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000009', job_code: `${P}-MAT-2026-0095`, client_code: 'BPH-007', client_name: 'BioPharm Holdings Inc.', uttai_status: 'pending_review', uttai_subject_obliged: null, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000010', job_code: `${P}-MAT-2026-0102`, client_code: 'MGA-008', client_name: 'Mutua General de Aseguradoras S.A.', uttai_status: 'clear', uttai_subject_obliged: true, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000011', job_code: `${P}-MAT-2026-0115`, client_code: 'FTI-009', client_name: 'FinTech Innovations DAC', uttai_status: 'blocked', uttai_subject_obliged: null, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000012', job_code: `${P}-MAT-2026-0123`, client_code: 'NMC-010', client_name: 'Nippon Motor Corporation', uttai_status: 'clear', uttai_subject_obliged: true, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000013', job_code: `${P}-MAT-2026-0134`, client_code: 'HFA-011', client_name: 'Fundación Humanitas para África', uttai_status: 'clear', uttai_subject_obliged: false, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000014', job_code: `${P}-MAT-2026-0145`, client_code: 'JVS-012', client_name: 'JV Solar Hispano-Japonesa S.L.', uttai_status: 'pending_review', uttai_subject_obliged: null, owner_user_id: USERS.socio, status: 'active' },
  ]
  await safeInsert('ginv_jobs', jobs)
  console.log(`  ✓ ${jobs.length} jobs (6 v1.0 + 8 v2.0)`)

  // ─── 2. VENDORS ──────────────────────────────────────────────────
  const vendors = [
    // ── v1.0 Vendors (V001–V007) ──
    { id: 'b0000001-0001-4000-8000-000000000001', name: `${P} Registradores de Barcelona S.L.`, tax_id: 'B08567891', country: 'España', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000002', name: `${P} Notaría Pérez-Llorca Madrid`, tax_id: 'E28345678', country: 'España', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000003', name: `${P} PatentMax GmbH`, tax_id: 'DE298765432', country: 'Alemania', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000004', name: `${P} Sullivan & Partners LLP`, tax_id: 'GB987654321', country: 'Reino Unido', compliance_status: 'expiring_soon' },
    { id: 'b0000001-0001-4000-8000-000000000005', name: `${P} Chen & Associates`, tax_id: '91310115MA1K3LXX2H', country: 'China', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000006', name: `${P} Studio Legale Bianchi`, tax_id: 'IT02345678901', country: 'Italia', compliance_status: 'non_compliant' },
    { id: 'b0000001-0001-4000-8000-000000000007', name: `${P} OEPM`, tax_id: 'Q2801019A', country: 'España', compliance_status: 'compliant' },
    // ── v2.0 Vendors (V009–V014) ──
    { id: 'b0000001-0001-4000-8000-000000000009', name: `${P} Morrison & Blake LLP`, tax_id: '13-5678901', country: 'Estados Unidos', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000010', name: `${P} Tanaka & Yamamoto`, tax_id: 'T1234567890123', country: 'Japón', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000011', name: `${P} Helvetia Tax Advisors AG`, tax_id: 'CHE-123.456.789', country: 'Suiza', compliance_status: 'expiring_soon' },
    { id: 'b0000001-0001-4000-8000-000000000012', name: `${P} Souza & Ferreira Advogados`, tax_id: '12.345.678/0001-90', country: 'Brasil', compliance_status: 'non_compliant' },
    { id: 'b0000001-0001-4000-8000-000000000013', name: `${P} Sharma IP Associates`, tax_id: 'AABCS1234F', country: 'India', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000014', name: `${P} Al-Rashid Legal Consultants`, tax_id: '100234567890003', country: 'Emiratos Árabes', compliance_status: 'non_compliant' },
  ]
  await safeInsert('ginv_vendors', vendors)
  console.log(`  ✓ ${vendors.length} vendors (7 v1.0 + 6 v2.0)`)

  // ─── 3. VENDOR DOCUMENTS ─────────────────────────────────────────
  const vendorDocs = [
    // ── v1.0 Docs (VDOC-001 to VDOC-005) ──
    { id: 'c0000001-0001-4000-8000-000000000001', vendor_id: vendors[2].id, doc_type: 'tax_residency_certificate', issued_at: '2025-06-15', expires_at: '2026-06-15', status: 'compliant' },
    { id: 'c0000001-0001-4000-8000-000000000002', vendor_id: vendors[3].id, doc_type: 'tax_residency_certificate', issued_at: '2025-03-10', expires_at: '2026-03-10', status: 'expiring_soon' },
    { id: 'c0000001-0001-4000-8000-000000000003', vendor_id: vendors[4].id, doc_type: 'tax_residency_certificate', issued_at: '2025-09-01', expires_at: '2026-09-01', status: 'compliant' },
    { id: 'c0000001-0001-4000-8000-000000000004', vendor_id: vendors[4].id, doc_type: 'partners_letter', issued_at: '2025-09-01', expires_at: '2026-09-01', status: 'compliant' },
    { id: 'c0000001-0001-4000-8000-000000000005', vendor_id: vendors[5].id, doc_type: 'tax_residency_certificate', issued_at: '2024-11-15', expires_at: '2025-11-15', status: 'non_compliant' },
    // ── v2.0 Docs (VDOC-006 to VDOC-013, VDOC-015, VDOC-016) ──
    // V009 Morrison & Blake — Form 6166
    { id: 'c0000001-0001-4000-8000-000000000006', vendor_id: vendors[7].id, doc_type: 'tax_residency_certificate', issued_at: '2025-04-15', expires_at: '2026-04-15', status: 'compliant', file_path: 'vendors/V009_US_FORM6166_2025.pdf' },
    // V009 Morrison & Blake — Apostilla
    { id: 'c0000001-0001-4000-8000-000000000007', vendor_id: vendors[7].id, doc_type: 'other', issued_at: '2025-04-15', expires_at: '2026-04-15', status: 'compliant', file_path: 'vendors/V009_US_APOSTILLE_2025.pdf' },
    // V010 Tanaka & Yamamoto — Cert residencia
    { id: 'c0000001-0001-4000-8000-000000000008', vendor_id: vendors[8].id, doc_type: 'tax_residency_certificate', issued_at: '2025-08-01', expires_at: '2026-08-01', status: 'compliant', file_path: 'vendors/V010_JP_CERT_2025.pdf' },
    // V010 Tanaka & Yamamoto — Traducción jurada
    { id: 'c0000001-0001-4000-8000-000000000009', vendor_id: vendors[8].id, doc_type: 'other', issued_at: '2025-08-01', expires_at: '2027-08-01', status: 'compliant', file_path: 'vendors/V010_JP_TRADUCCION_2025.pdf' },
    // V011 Helvetia Tax — Cert residencia (expiring_soon, 15 days)
    { id: 'c0000001-0001-4000-8000-000000000010', vendor_id: vendors[9].id, doc_type: 'tax_residency_certificate', issued_at: '2025-02-25', expires_at: '2026-02-25', status: 'expiring_soon', file_path: 'vendors/V011_CH_CERT_2025.pdf' },
    // V012 Souza & Ferreira — Cert vencido (3 meses)
    { id: 'c0000001-0001-4000-8000-000000000011', vendor_id: vendors[10].id, doc_type: 'tax_residency_certificate', issued_at: '2024-11-10', expires_at: '2025-11-10', status: 'non_compliant', file_path: 'vendors/V012_BR_CERT_2024_EXPIRED.pdf' },
    // V013 Sharma IP — Cert residencia
    { id: 'c0000001-0001-4000-8000-000000000012', vendor_id: vendors[11].id, doc_type: 'tax_residency_certificate', issued_at: '2025-07-01', expires_at: '2026-06-30', status: 'compliant', file_path: 'vendors/V013_IN_CERT_2025.pdf' },
    // V013 Sharma IP — Form 10F
    { id: 'c0000001-0001-4000-8000-000000000013', vendor_id: vendors[11].id, doc_type: 'other', issued_at: '2025-07-01', expires_at: '2026-06-30', status: 'compliant', file_path: 'vendors/V013_IN_FORM10F_2025.pdf' },
    // VDOC-015: Renewed cert for Studio Legale Bianchi (V006)
    { id: 'c0000001-0001-4000-8000-000000000015', vendor_id: vendors[5].id, doc_type: 'tax_residency_certificate', issued_at: '2026-02-05', expires_at: '2027-02-05', status: 'compliant', file_path: 'vendors/V006_IT_CERT_2026.pdf' },
    // VDOC-016: Power of attorney for PatentMax (V003), no expiry
    { id: 'c0000001-0001-4000-8000-000000000016', vendor_id: vendors[2].id, doc_type: 'other', issued_at: '2025-01-15', expires_at: null, status: 'compliant', file_path: 'vendors/V003_DE_PODER_2025.pdf' },
  ]
  await safeInsert('ginv_vendor_documents', vendorDocs)
  console.log(`  ✓ ${vendorDocs.length} vendor documents (5 v1.0 + 10 v2.0)`)

  // ─── 4. INTAKE ITEMS ─────────────────────────────────────────────
  // Helpers for referencing by index
  const J = (n: number) => jobs[n - 1].id
  const V = (n: number) => vendors[n - 1].id

  const intakeItems = [
    // ════════════════════════════════════════════════════════════════
    // v1.0 INTAKE ITEMS (indices 0–24)
    // ════════════════════════════════════════════════════════════════

    // Drafts (0–1)
    { id: 'd0000001-0001-4000-8000-000000000001', type: 'vendor_invoice', vendor_id: V(3), job_id: J(1), invoice_number: 'PM-2026-0089', invoice_date: '2026-01-28', amount: 4250.00, currency: 'EUR', concept_text: `${P} Registro marca comunitaria Clase 5`, status: 'draft', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000002', type: 'vendor_invoice', vendor_id: V(6), job_id: J(3), invoice_number: 'SLB-2026-112', invoice_date: '2026-02-01', amount: 8900.00, currency: 'EUR', concept_text: `${P} Due diligence subsidiaria italiana`, status: 'draft', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'non_compliant', created_by: USERS.operador },
    // Submitted (2–3)
    { id: 'd0000001-0001-4000-8000-000000000003', type: 'vendor_invoice', vendor_id: V(1), job_id: J(1), invoice_number: 'RB-2026-2341', invoice_date: '2026-01-15', amount: 1245.80, currency: 'EUR', concept_text: `${P} Inscripción aumento capital`, approver_user_id: USERS.socio, status: 'submitted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000004', type: 'vendor_invoice', vendor_id: V(4), job_id: J(4), invoice_number: 'SP-2026-0456', invoice_date: '2026-01-22', amount: 12500.00, currency: 'GBP', concept_text: `${P} Asesoramiento adquisición startup UK`, approver_user_id: USERS.socio, status: 'submitted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'expiring_soon', created_by: USERS.operador },
    // Needs info (4)
    { id: 'd0000001-0001-4000-8000-000000000005', type: 'vendor_invoice', vendor_id: V(2), job_id: J(3), invoice_number: 'NPL-2026-0078', invoice_date: '2026-01-10', amount: 3890.00, currency: 'EUR', concept_text: `${P} Escritura compraventa terreno industrial`, status: 'needs_info', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // Pending approval (5–7)
    { id: 'd0000001-0001-4000-8000-000000000007', type: 'vendor_invoice', vendor_id: V(3), job_id: J(1), invoice_number: 'PM-2026-0045', invoice_date: '2025-12-20', amount: 6780.00, currency: 'EUR', concept_text: `${P} Oposición marca EU`, approver_user_id: USERS.socio, status: 'pending_approval', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000008', type: 'vendor_invoice', vendor_id: V(1), job_id: J(6), invoice_number: 'RB-2026-1892', invoice_date: '2026-01-28', amount: 890.50, currency: 'EUR', concept_text: `${P} Nota simple informativa 5 fincas`, approver_user_id: USERS.socio, status: 'pending_approval', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000009', type: 'vendor_invoice', vendor_id: V(4), job_id: J(2), invoice_number: 'SP-2026-0501', invoice_date: '2026-01-18', amount: 45000.00, currency: 'GBP', concept_text: `${P} Due diligence fondo inversión`, approver_user_id: USERS.socio, status: 'pending_approval', uttai_status_snapshot: 'blocked', vendor_compliance_snapshot: 'expiring_soon', created_by: USERS.operador },
    // Approved (8–10)
    { id: 'd0000001-0001-4000-8000-000000000010', type: 'vendor_invoice', vendor_id: V(2), job_id: J(3), invoice_number: 'NPL-2026-0091', invoice_date: '2026-02-01', amount: 2450.00, currency: 'EUR', concept_text: `${P} Poderes notariales consejeros`, approver_user_id: USERS.socio, status: 'approved', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000011', type: 'vendor_invoice', vendor_id: V(3), job_id: J(4), invoice_number: 'PM-2026-0067', invoice_date: '2026-02-02', amount: 5200.00, currency: 'EUR', concept_text: `${P} Renovación cartera marcas EU`, approver_user_id: USERS.socio, status: 'approved', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000012', type: 'vendor_invoice', vendor_id: V(5), job_id: J(1), invoice_number: 'CA-2026-0034', invoice_date: '2026-02-03', amount: 15800.00, currency: 'USD', concept_text: `${P} Asesoramiento importación API farmacéutico`, approver_user_id: USERS.socio, status: 'approved', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // Sent to accounting (11–12)
    { id: 'd0000001-0001-4000-8000-000000000014', type: 'vendor_invoice', vendor_id: V(1), job_id: J(6), invoice_number: 'RB-2026-1756', invoice_date: '2026-01-25', amount: 567.30, currency: 'EUR', concept_text: `${P} Nota simple registral`, approver_user_id: USERS.socio, status: 'sent_to_accounting', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000015', type: 'vendor_invoice', vendor_id: V(2), job_id: J(1), invoice_number: 'NPL-2026-0082', invoice_date: '2026-01-27', amount: 4120.00, currency: 'EUR', concept_text: `${P} Escritura protocolización`, approver_user_id: USERS.socio, status: 'sent_to_accounting', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // Posted (13–16)
    { id: 'd0000001-0001-4000-8000-000000000017', type: 'vendor_invoice', vendor_id: V(1), job_id: J(1), invoice_number: 'RB-2026-1678', invoice_date: '2026-01-20', amount: 1890.00, currency: 'EUR', concept_text: `${P} Notas simples`, approver_user_id: USERS.socio, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000018', type: 'vendor_invoice', vendor_id: V(2), job_id: J(3), invoice_number: 'NPL-2026-0056', invoice_date: '2026-01-22', amount: 6780.00, currency: 'EUR', concept_text: `${P} Escritura compraventa`, approver_user_id: USERS.socio, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000019', type: 'vendor_invoice', vendor_id: V(3), job_id: J(4), invoice_number: 'PM-2026-0034', invoice_date: '2026-01-24', amount: 8900.00, currency: 'EUR', concept_text: `${P} Registro patentes EU`, approver_user_id: USERS.socio, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000020', type: 'vendor_invoice', vendor_id: V(5), job_id: J(4), invoice_number: 'CA-2026-0012', invoice_date: '2026-01-26', amount: 22500.00, currency: 'USD', concept_text: `${P} Constitución WFOE`, approver_user_id: USERS.socio, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // Ready to bill (17–18)
    { id: 'd0000001-0001-4000-8000-000000000021', type: 'vendor_invoice', vendor_id: V(1), job_id: J(1), invoice_number: 'RB-2026-1590', invoice_date: '2026-01-18', amount: 2340.00, currency: 'EUR', concept_text: `${P} Inscripción escritura`, approver_user_id: USERS.socio, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000022', type: 'vendor_invoice', vendor_id: V(2), job_id: J(1), invoice_number: 'NPL-2026-0045', invoice_date: '2026-01-19', amount: 5670.00, currency: 'EUR', concept_text: `${P} Acta protocolización`, approver_user_id: USERS.socio, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // v1.0 Official fees (19–24)
    { id: 'd0000001-0001-4000-8000-000000000030', type: 'official_fee', vendor_id: V(7), job_id: J(1), invoice_number: 'OEPM-2026-001', invoice_date: '2026-01-10', amount: 144.58, currency: 'EUR', concept_text: `${P} Tasa solicitud marca nacional Clase 5`, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000031', type: 'official_fee', vendor_id: V(7), job_id: J(1), invoice_number: 'OEPM-2026-002', invoice_date: '2026-01-15', amount: 178.35, currency: 'EUR', concept_text: `${P} Tasa renovación marca`, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000032', type: 'official_fee', vendor_id: V(1), job_id: J(1), invoice_number: 'RM-2026-003', invoice_date: '2026-01-20', amount: 89.50, currency: 'EUR', concept_text: `${P} Inscripción aumento capital`, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000033', type: 'official_fee', vendor_id: null, job_id: J(4), invoice_number: 'OEPM-2026-006', invoice_date: '2026-02-01', amount: 652.34, currency: 'EUR', concept_text: `${P} Tasa solicitud patente nacional`, status: 'sent_to_accounting', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000034', type: 'official_fee', vendor_id: null, job_id: J(3), invoice_number: 'RP-2026-007', invoice_date: '2026-02-03', amount: 45.20, currency: 'EUR', concept_text: `${P} Anotación preventiva embargo`, status: 'approved', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000035', type: 'official_fee', vendor_id: null, job_id: J(4), invoice_number: 'EPO-2026-010', invoice_date: '2026-02-07', amount: 1875.00, currency: 'EUR', concept_text: `${P} Tasa examen patente europea`, status: 'draft', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },

    // ════════════════════════════════════════════════════════════════
    // v2.0 INTAKE ITEMS (indices 25+)
    // ════════════════════════════════════════════════════════════════

    // ── Rejected (GINV-025 to GINV-027) ──
    { id: 'd0000001-0001-4000-8000-000000000025', type: 'vendor_invoice', vendor_id: vendors[9].id, job_id: J(10), invoice_number: 'HTA-2026-0034', invoice_date: '2026-01-20', amount: 45000.00, currency: 'CHF', concept_text: `${P} Asesoramiento fiscal reestructuración Solvencia II`, approver_user_id: USERS.socio, status: 'rejected', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'expiring_soon', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000026', type: 'vendor_invoice', vendor_id: vendors[7].id, job_id: J(7), invoice_number: 'MB-2026-0089', invoice_date: '2026-01-15', amount: 125000.00, currency: 'USD', concept_text: `${P} Legal fees Q4 2025 — Patent litigation`, approver_user_id: USERS.socio, status: 'rejected', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000027', type: 'vendor_invoice', vendor_id: vendors[12].id, job_id: J(12), invoice_number: 'ARL-2026-0012', invoice_date: '2026-01-25', amount: 18500.00, currency: 'USD', concept_text: `${P} Corporate advisory — Dubai subsidiary`, approver_user_id: USERS.socio, status: 'rejected', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'non_compliant', created_by: USERS.operador },

    // ── Billed (GINV-028 to GINV-030) ──
    { id: 'd0000001-0001-4000-8000-000000000028', type: 'vendor_invoice', vendor_id: V(1), job_id: J(1), invoice_number: 'RB-2025-8934', invoice_date: '2025-11-20', amount: 1450.00, currency: 'EUR', concept_text: `${P} Inscripción escritura constitución`, approver_user_id: USERS.socio, status: 'billed', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000029', type: 'vendor_invoice', vendor_id: V(2), job_id: J(3), invoice_number: 'NPL-2025-0234', invoice_date: '2025-12-10', amount: 3780.00, currency: 'EUR', concept_text: `${P} Escritura compraventa nave industrial`, approver_user_id: USERS.socio, status: 'billed', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-0000000000a0', type: 'vendor_invoice', vendor_id: V(3), job_id: J(4), invoice_number: 'PM-2025-0189', invoice_date: '2025-12-15', amount: 7200.00, currency: 'EUR', concept_text: `${P} Renovación marcas EU lote diciembre`, approver_user_id: USERS.socio, status: 'billed', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },

    // ── Archived (GINV-031 to GINV-033) ──
    { id: 'd0000001-0001-4000-8000-000000000031', type: 'vendor_invoice', vendor_id: V(4), job_id: J(4), invoice_number: 'SP-2025-0345', invoice_date: '2025-10-15', amount: 22000.00, currency: 'GBP', concept_text: `${P} Due diligence target UK`, approver_user_id: USERS.socio, status: 'archived', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000032', type: 'vendor_invoice', vendor_id: V(5), job_id: J(1), invoice_number: 'CA-2025-0156', invoice_date: '2025-11-01', amount: 8500.00, currency: 'USD', concept_text: `${P} WFOE compliance review`, approver_user_id: USERS.socio, status: 'archived', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000033', type: 'vendor_invoice', vendor_id: V(1), job_id: J(6), invoice_number: 'RB-2026-1234', invoice_date: '2026-01-20', amount: 890.00, currency: 'EUR', concept_text: `${P} Nota simple fincas — duplicada`, status: 'archived', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },

    // ── Rejection/re-submit scenarios ──
    // GINV-034: rejected by amount
    { id: 'd0000001-0001-4000-8000-000000000034', type: 'vendor_invoice', vendor_id: vendors[8].id, job_id: J(12), invoice_number: 'TY-2026-0045', invoice_date: '2026-01-20', amount: 2850000.00, currency: 'JPY', concept_text: `${P} Registro patentes Japón (15 patentes)`, approver_user_id: USERS.socio, status: 'rejected', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // GINV-034-R1: corrected version, pending approval
    { id: 'd0000001-0001-4000-8000-000000000134', type: 'vendor_invoice', vendor_id: vendors[8].id, job_id: J(12), invoice_number: 'TY-2026-0045-R1', invoice_date: '2026-01-30', amount: 2100000.00, currency: 'JPY', concept_text: `${P} Registro patentes Japón (11 patentes) — 4 excluidas`, approver_user_id: USERS.socio, status: 'pending_approval', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // GINV-035: needs_info → corrected → sent_to_accounting
    { id: 'd0000001-0001-4000-8000-0000000000a1', type: 'vendor_invoice', vendor_id: vendors[11].id, job_id: J(7), invoice_number: 'SIA-2026-0078', invoice_date: '2026-01-25', amount: 485000.00, currency: 'INR', concept_text: `${P} Trademark registration classes 5, 35, 42 — BIOPHARMA mark India`, approver_user_id: USERS.socio, status: 'sent_to_accounting', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // GINV-036: compliance blocked → resolved → pending_approval
    { id: 'd0000001-0001-4000-8000-000000000036', type: 'vendor_invoice', vendor_id: vendors[10].id, job_id: J(3), invoice_number: 'SF-2026-0023', invoice_date: '2026-02-01', amount: 45000.00, currency: 'BRL', concept_text: `${P} Representación procesal demanda laboral São Paulo`, approver_user_id: USERS.socio, status: 'pending_approval', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // GINV-037: UTTAI blocked → resolved → sent_to_accounting
    { id: 'd0000001-0001-4000-8000-000000000037', type: 'vendor_invoice', vendor_id: vendors[7].id, job_id: J(11), invoice_number: 'MB-2026-0112', invoice_date: '2026-01-28', amount: 78000.00, currency: 'USD', concept_text: `${P} Regulatory advisory — PSD2 compliance review`, approver_user_id: USERS.socio, status: 'sent_to_accounting', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // GINV-038: double rejection → archived
    { id: 'd0000001-0001-4000-8000-000000000038', type: 'vendor_invoice', vendor_id: vendors[12].id, job_id: J(12), invoice_number: 'ARL-2026-0034', invoice_date: '2026-01-15', amount: 35000.00, currency: 'USD', concept_text: `${P} Corporate setup Dubai free zone`, approver_user_id: USERS.socio, status: 'archived', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'non_compliant', created_by: USERS.operador },

    // ── Batch intake items (GINV-039 to GINV-044) ──
    { id: 'd0000001-0001-4000-8000-000000000039', type: 'vendor_invoice', vendor_id: vendors[7].id, job_id: J(7), invoice_number: 'MB-2026-0134', invoice_date: '2026-02-05', amount: 8500.00, currency: 'USD', concept_text: `${P} Patent prosecution fees Q1 2026`, approver_user_id: USERS.socio, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000040', type: 'vendor_invoice', vendor_id: vendors[11].id, job_id: J(7), invoice_number: 'SIA-2026-0089', invoice_date: '2026-02-06', amount: 3950.00, currency: 'USD', concept_text: `${P} TM class 5 prosecution India`, approver_user_id: USERS.socio, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000041', type: 'vendor_invoice', vendor_id: vendors[9].id, job_id: J(10), invoice_number: 'HTA-2026-0056', invoice_date: '2026-02-03', amount: 12500.00, currency: 'CHF', concept_text: `${P} Asesoramiento Solvencia II trimestral`, approver_user_id: USERS.socio, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'expiring_soon', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000042', type: 'vendor_invoice', vendor_id: V(2), job_id: J(10), invoice_number: 'NPL-2026-0112', invoice_date: '2026-02-04', amount: 6250.00, currency: 'EUR', concept_text: `${P} Escritura ampliación objeto social`, approver_user_id: USERS.socio, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000043', type: 'vendor_invoice', vendor_id: V(1), job_id: J(1), invoice_number: 'RB-2026-1601', invoice_date: '2026-02-01', amount: 456.00, currency: 'EUR', concept_text: `${P} Nota simple — duplicado GINV-028`, approver_user_id: USERS.socio, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000044', type: 'vendor_invoice', vendor_id: V(3), job_id: J(1), invoice_number: 'PM-2026-0098', invoice_date: '2026-02-02', amount: 3200.00, currency: 'EUR', concept_text: `${P} Registro marcas adicionales`, approver_user_id: USERS.socio, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },

    // ── v2.0 Official fees (TASA-013 to TASA-018) ──
    { id: 'd0000001-0001-4000-8000-000000000045', type: 'official_fee', vendor_id: null, job_id: J(7), invoice_number: 'USPTO-2026-001', invoice_date: '2026-02-01', amount: 1820.00, currency: 'USD', concept_text: `${P} Filing fee patent application USPTO`, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000046', type: 'official_fee', vendor_id: null, job_id: J(12), invoice_number: 'JPO-2026-001', invoice_date: '2026-01-25', amount: 324000.00, currency: 'JPY', concept_text: `${P} Patent filing fee JPO`, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000047', type: 'official_fee', vendor_id: null, job_id: J(10), invoice_number: 'IPI-2026-001', invoice_date: '2026-02-03', amount: 550.00, currency: 'CHF', concept_text: `${P} Trademark registration fee Swiss IPI`, status: 'sent_to_accounting', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000048', type: 'official_fee', vendor_id: null, job_id: J(7), invoice_number: 'ITMR-2026-001', invoice_date: '2026-01-28', amount: 27000.00, currency: 'INR', concept_text: `${P} TM-1 application 3 classes India`, status: 'approved', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000049', type: 'official_fee', vendor_id: null, job_id: J(3), invoice_number: 'INPI-2026-001', invoice_date: '2026-02-05', amount: 1100.00, currency: 'BRL', concept_text: `${P} Taxa de pedido de patente INPI Brasil`, status: 'draft', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
    // TASA-018: 0.00 EUR in v2.0 doc but CHECK(amount > 0), use 0.01
    { id: 'd0000001-0001-4000-8000-000000000050', type: 'official_fee', vendor_id: null, job_id: J(13), invoice_number: 'DGT-2026-001', invoice_date: '2026-01-20', amount: 0.01, currency: 'EUR', concept_text: `${P} Tasa exención IVA fundaciones DGT`, status: 'billed', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
  ]
  await safeInsert('ginv_intake_items', intakeItems)
  console.log(`  ✓ ${intakeItems.length} intake items (25 v1.0 + v2.0)`)

  // ─── 5. SAP POSTINGS ─────────────────────────────────────────────
  const sapPostings = [
    // ── v1.0 SAP postings ──
    { id: 'e0000001-0001-4000-8000-000000000001', intake_item_id: intakeItems[13].id, sap_reference: '5100012345', posted_at: '2026-01-28T10:00:00Z', posted_by: USERS.bpo },
    { id: 'e0000001-0001-4000-8000-000000000002', intake_item_id: intakeItems[14].id, sap_reference: '5100012389', posted_at: '2026-01-30T10:00:00Z', posted_by: USERS.bpo },
    { id: 'e0000001-0001-4000-8000-000000000003', intake_item_id: intakeItems[15].id, sap_reference: '5100012401', posted_at: '2026-02-01T10:00:00Z', posted_by: USERS.bpo },
    { id: 'e0000001-0001-4000-8000-000000000004', intake_item_id: intakeItems[16].id, sap_reference: '5100012456', posted_at: '2026-02-03T10:00:00Z', posted_by: USERS.bpo },
    { id: 'e0000001-0001-4000-8000-000000000005', intake_item_id: intakeItems[19].id, sap_reference: '5100011890', posted_at: '2026-01-10T10:00:00Z', posted_by: USERS.bpo },
    { id: 'e0000001-0001-4000-8000-000000000006', intake_item_id: intakeItems[20].id, sap_reference: '5100011923', posted_at: '2026-01-15T10:00:00Z', posted_by: USERS.bpo },
    // ── v2.0 SAP postings for billed items ──
    // Billed items are at indices 28, 29, 30 (GINV-028, GINV-029, GINV-030)
    // Note: index 25=GINV-025(rejected), 26=GINV-026(rejected), 27=GINV-027(rejected)
    //       28=GINV-028(billed), 29=GINV-029(billed), 30=GINV-030(billed, id ...a0)
    { id: 'e0000001-0001-4000-8000-000000000007', intake_item_id: intakeItems[28].id, sap_reference: '5100011123', posted_at: '2025-12-15T10:00:00Z', posted_by: USERS.bpo }, // GINV-028
    { id: 'e0000001-0001-4000-8000-000000000008', intake_item_id: intakeItems[29].id, sap_reference: '5100011156', posted_at: '2025-12-20T10:00:00Z', posted_by: USERS.bpo }, // GINV-029
    { id: 'e0000001-0001-4000-8000-000000000009', intake_item_id: intakeItems[30].id, sap_reference: '5100011189', posted_at: '2025-12-28T10:00:00Z', posted_by: USERS.bpo }, // GINV-030
    // v2.0 SAP postings for batch items GINV-041, GINV-042
    // Indices: 31-33=archived, 34=GINV-034(rej), 35=GINV-034-R1, 36=GINV-035, 37=GINV-036
    //          38=GINV-037, 39=GINV-038(arch), 40=GINV-039, 41=GINV-040
    //          42=GINV-041(posted), 43=GINV-042(posted)
    { id: 'e0000001-0001-4000-8000-000000000010', intake_item_id: intakeItems[42].id, sap_reference: '5100012567', posted_at: '2026-02-05T10:00:00Z', posted_by: USERS.bpo }, // GINV-041
    { id: 'e0000001-0001-4000-8000-000000000011', intake_item_id: intakeItems[43].id, sap_reference: '5100012589', posted_at: '2026-02-06T10:00:00Z', posted_by: USERS.bpo }, // GINV-042
    // v2.0 SAP for TASA-013 (posted) — index 46
    { id: 'e0000001-0001-4000-8000-000000000012', intake_item_id: intakeItems[46].id, sap_reference: '5100012601', posted_at: '2026-02-01T10:00:00Z', posted_by: USERS.bpo },
    // v2.0 SAP for TASA-014 (ready_to_bill) — index 47
    { id: 'e0000001-0001-4000-8000-000000000013', intake_item_id: intakeItems[47].id, sap_reference: '5100012623', posted_at: '2026-01-25T10:00:00Z', posted_by: USERS.bpo },
    // v2.0 SAP for TASA-018 (billed) — index 51
    { id: 'e0000001-0001-4000-8000-000000000014', intake_item_id: intakeItems[51].id, sap_reference: '5100012456', posted_at: '2026-01-20T10:00:00Z', posted_by: USERS.bpo },
  ]
  await safeInsert('ginv_sap_postings', sapPostings)
  console.log(`  ✓ ${sapPostings.length} SAP postings`)

  // ─── 6. BILLING BATCHES ──────────────────────────────────────────
  const batches = [
    // ── v1.0 batches (BATCH-001 to BATCH-004) ──
    { id: 'f0000001-0001-4000-8000-000000000001', job_id: J(1), status: 'pending_partner_approval', uttai_subject_obliged: true, total_amount: 8010.00, total_fees: 89.50, created_by: USERS.bpo },
    { id: 'f0000001-0001-4000-8000-000000000002', job_id: J(3), status: 'ready_for_sap', uttai_subject_obliged: false, total_amount: 4560.00, total_fees: 320.00, created_by: USERS.bpo },
    { id: 'f0000001-0001-4000-8000-000000000003', job_id: J(4), status: 'issued', uttai_subject_obliged: true, total_amount: 31400.00, total_fees: null, created_by: USERS.bpo },
    { id: 'f0000001-0001-4000-8000-000000000004', job_id: J(6), status: 'delivered', uttai_subject_obliged: true, total_amount: 1890.00, total_fees: 322.93, created_by: USERS.bpo },
    // ── v2.0 batches (BATCH-005 to BATCH-013) ──
    // BATCH-005: for billed items GINV-028 (J001/Novapharma)
    { id: 'f0000001-0001-4000-8000-000000000005', job_id: J(1), status: 'delivered', uttai_subject_obliged: true, total_amount: 1450.00, total_fees: null, created_by: USERS.bpo },
    // BATCH-006: invoice_draft (BioPharm)
    { id: 'f0000001-0001-4000-8000-000000000006', job_id: J(7), status: 'invoice_draft', uttai_subject_obliged: true, total_amount: 48102.34, total_fees: 652.34, created_by: USERS.bpo },
    // BATCH-007: ready_for_sap (Mutua General)
    { id: 'f0000001-0001-4000-8000-000000000007', job_id: J(10), status: 'ready_for_sap', uttai_subject_obliged: true, total_amount: 40750.00, total_fees: 0.00, created_by: USERS.bpo },
    // BATCH-008: ready_for_sap (transfer scenario, J004 → J008)
    { id: 'f0000001-0001-4000-8000-000000000008', job_id: J(4), status: 'ready_for_sap', uttai_subject_obliged: true, total_amount: 18900.00, total_fees: null, created_by: USERS.bpo },
    // BATCH-009: ready_for_sap (discard scenario, J001/Novapharma)
    { id: 'f0000001-0001-4000-8000-000000000009', job_id: J(1), status: 'ready_for_sap', uttai_subject_obliged: true, total_amount: 3200.00, total_fees: null, created_by: USERS.bpo },
    // BATCH-010: for CINV-004 (Constructora Med, delivered)
    { id: 'f0000001-0001-4000-8000-000000000010', job_id: J(3), status: 'delivered', uttai_subject_obliged: false, total_amount: 28450.00, total_fees: null, created_by: USERS.bpo },
    // BATCH-011: for CINV-005 (Nippon Motor, platform_required)
    { id: 'f0000001-0001-4000-8000-000000000011', job_id: J(12), status: 'platform_required', uttai_subject_obliged: true, total_amount: 4250000.00, total_fees: null, created_by: USERS.bpo },
    // BATCH-012: for CINV-007 (Energías Renovables, platform_completed)
    { id: 'f0000001-0001-4000-8000-000000000012', job_id: J(5), status: 'platform_completed', uttai_subject_obliged: null, total_amount: 18900.00, total_fees: null, created_by: USERS.bpo },
    // BATCH-013: for CINV-008 (Fundación Humanitas, delivered)
    { id: 'f0000001-0001-4000-8000-000000000013', job_id: J(13), status: 'delivered', uttai_subject_obliged: false, total_amount: 850.00, total_fees: null, created_by: USERS.bpo },
  ]
  await safeInsert('ginv_billing_batches', batches)
  console.log(`  ✓ ${batches.length} billing batches (4 v1.0 + 9 v2.0)`)

  // ─── 7. BILLING BATCH ITEMS ──────────────────────────────────────
  const batchItems = [
    // ── v1.0 batch items ──
    { id: 'f1000001-0001-4000-8000-000000000001', batch_id: batches[0].id, intake_item_id: intakeItems[17].id, decision: 'emit' },
    { id: 'f1000001-0001-4000-8000-000000000002', batch_id: batches[0].id, intake_item_id: intakeItems[18].id, decision: 'emit' },
    { id: 'f1000001-0001-4000-8000-000000000003', batch_id: batches[2].id, intake_item_id: intakeItems[15].id, decision: 'emit' },
    { id: 'f1000001-0001-4000-8000-000000000004', batch_id: batches[2].id, intake_item_id: intakeItems[16].id, decision: 'transfer' },
    { id: 'f1000001-0001-4000-8000-000000000005', batch_id: batches[3].id, intake_item_id: intakeItems[13].id, decision: 'emit' },
    // ── v2.0 batch items ──
    // BATCH-005 items (billed GINV-028 = index 28)
    { id: 'f1000001-0001-4000-8000-000000000006', batch_id: batches[4].id, intake_item_id: intakeItems[28].id, decision: 'emit' },
    // BATCH-006 items (GINV-039=idx40, GINV-040=idx41, TASA-013=idx46)
    { id: 'f1000001-0001-4000-8000-000000000007', batch_id: batches[5].id, intake_item_id: intakeItems[40].id, decision: null },
    { id: 'f1000001-0001-4000-8000-000000000008', batch_id: batches[5].id, intake_item_id: intakeItems[41].id, decision: null },
    { id: 'f1000001-0001-4000-8000-000000000009', batch_id: batches[5].id, intake_item_id: intakeItems[46].id, decision: null },
    // BATCH-007 items (GINV-041=idx42, GINV-042=idx43)
    { id: 'f1000001-0001-4000-8000-000000000010', batch_id: batches[6].id, intake_item_id: intakeItems[42].id, decision: 'emit' },
    { id: 'f1000001-0001-4000-8000-000000000011', batch_id: batches[6].id, intake_item_id: intakeItems[43].id, decision: 'emit' },
    // BATCH-008 items (v1.0 item NPL-2026-0045 = idx18, transfer)
    { id: 'f1000001-0001-4000-8000-000000000012', batch_id: batches[7].id, intake_item_id: intakeItems[18].id, decision: 'transfer' },
    // BATCH-009 items (GINV-043=idx44 discard, GINV-044=idx45 emit)
    { id: 'f1000001-0001-4000-8000-000000000013', batch_id: batches[8].id, intake_item_id: intakeItems[44].id, decision: 'discard' },
    { id: 'f1000001-0001-4000-8000-000000000014', batch_id: batches[8].id, intake_item_id: intakeItems[45].id, decision: 'emit' },
    // BATCH-010 items (GINV-029=idx29 billed for Constructora)
    { id: 'f1000001-0001-4000-8000-000000000015', batch_id: batches[9].id, intake_item_id: intakeItems[29].id, decision: 'emit' },
  ]
  await safeInsert('ginv_billing_batch_items', batchItems)
  console.log(`  ✓ ${batchItems.length} batch items`)

  // ─── 8. CLIENT INVOICES ──────────────────────────────────────────
  const clientInvoices = [
    // ── v1.0 client invoices (CINV-001 to CINV-004 draft) ──
    { id: 'a7000001-0001-4000-8000-000000000001', batch_id: batches[2].id, sap_invoice_number: `${P}-F-2026-0234`, sap_invoice_date: '2026-02-03', status: 'issued', created_by: USERS.bpo },
    { id: 'a7000001-0001-4000-8000-000000000002', batch_id: batches[3].id, sap_invoice_number: `${P}-F-2026-0189`, sap_invoice_date: '2026-01-30', status: 'delivered', created_by: USERS.bpo },
    { id: 'a7000001-0001-4000-8000-000000000003', batch_id: null, sap_invoice_number: `${P}-F-2026-0145`, sap_invoice_date: '2026-01-15', status: 'platform_completed', created_by: USERS.bpo },
    { id: 'a7000001-0001-4000-8000-000000000004', batch_id: batches[0].id, sap_invoice_number: null, sap_invoice_date: null, status: 'invoice_draft', created_by: USERS.bpo },
    // ── v2.0 client invoices (CINV-004 to CINV-008) ──
    // CINV-004: Constructora Med, delivered
    { id: 'a7000001-0001-4000-8000-000000000005', batch_id: batches[9].id, sap_invoice_number: `${P}-F-2026-0098`, sap_invoice_date: '2026-01-08', status: 'delivered', created_by: USERS.bpo },
    // CINV-005: Nippon Motor, platform_required (JPY)
    { id: 'a7000001-0001-4000-8000-000000000006', batch_id: batches[10].id, sap_invoice_number: `${P}-F-2026-0345`, sap_invoice_date: '2026-02-08', status: 'platform_required', created_by: USERS.bpo },
    // CINV-006: Mutua General, platform_required
    { id: 'a7000001-0001-4000-8000-000000000007', batch_id: batches[6].id, sap_invoice_number: `${P}-F-2026-0289`, sap_invoice_date: '2026-02-07', status: 'platform_required', created_by: USERS.bpo },
    // CINV-007: Energías Renovables, platform_completed
    { id: 'a7000001-0001-4000-8000-000000000008', batch_id: batches[11].id, sap_invoice_number: `${P}-F-2026-0312`, sap_invoice_date: '2026-02-05', status: 'platform_completed', created_by: USERS.bpo },
    // CINV-008: Fundación Humanitas, delivered (pro bono)
    { id: 'a7000001-0001-4000-8000-000000000009', batch_id: batches[12].id, sap_invoice_number: `${P}-F-2026-0156`, sap_invoice_date: '2026-02-06', status: 'delivered', created_by: USERS.bpo },
  ]
  await safeInsert('ginv_client_invoices', clientInvoices)
  console.log(`  ✓ ${clientInvoices.length} client invoices (4 v1.0 + 5 v2.0)`)

  // ─── 9. DELIVERIES ───────────────────────────────────────────────
  const deliveries = [
    // ── v1.0 deliveries ──
    { id: 'a8000001-0001-4000-8000-000000000001', client_invoice_id: clientInvoices[0].id, delivery_type: 'email', recipients: JSON.stringify([{ name: 'Jan van der Berg', email: 'invoices@techventures.eu' }]), subject: `${P} Factura F-2026-0234 — Tech Ventures`, body: 'Adjuntamos factura correspondiente.', status: 'sent', sent_at: '2026-02-04T10:30:00Z', sent_by: USERS.bpo },
    { id: 'a8000001-0001-4000-8000-000000000002', client_invoice_id: clientInvoices[1].id, delivery_type: 'email', recipients: JSON.stringify([{ name: 'Carmen Iglesias', email: 'proveedores@bancocooperativo.es' }]), subject: `${P} Factura F-2026-0189 — Banco Cooperativo`, body: 'Adjuntamos factura y justificantes.', status: 'sent', sent_at: '2026-01-31T09:15:00Z', sent_by: USERS.bpo },
    // ── v2.0 deliveries ──
    // DEL-004: Multi-recipient (Constructora Med)
    { id: 'a8000001-0001-4000-8000-000000000003', client_invoice_id: clientInvoices[4].id, delivery_type: 'email', recipients: JSON.stringify([{ name: 'Contabilidad CME', email: 'contabilidad@constructoramediterraneo.es' }, { name: 'Ana Martínez', email: 'amartinez@garrigues.com' }, { name: 'Marta Vidal', email: 'mvidal@constructoramediterraneo.es' }]), subject: `${P} Factura F-2026-0098 — Constructora Mediterráneo`, body: 'Adjuntamos factura y justificantes de tasas.', status: 'sent', sent_at: '2026-01-10T09:45:00Z', sent_by: USERS.bpo },
    // DEL-005: ONG delivery (Fundación Humanitas)
    { id: 'a8000001-0001-4000-8000-000000000004', client_invoice_id: clientInvoices[8].id, delivery_type: 'email', recipients: JSON.stringify([{ name: 'Carmen López', email: 'administracion@humanitasafrica.org' }, { name: 'Ana Martínez', email: 'amartinez@garrigues.com' }]), subject: `${P} Factura F-2026-0156 — Fundación Humanitas (Pro Bono)`, body: 'Adjuntamos factura pro bono.', status: 'sent', sent_at: '2026-02-06T14:20:00Z', sent_by: USERS.bpo },
    // DEL-006: Platform delivery (Nippon Motor)
    { id: 'a8000001-0001-4000-8000-000000000005', client_invoice_id: clientInvoices[5].id, delivery_type: 'platform', recipients: JSON.stringify([]), subject: null, body: null, status: 'pending', sent_at: null, sent_by: null },
  ]
  await safeInsert('ginv_deliveries', deliveries)
  console.log(`  ✓ ${deliveries.length} deliveries (2 v1.0 + 3 v2.0)`)

  // ─── 10. PLATFORM TASKS ──────────────────────────────────────────
  const platformTasks = [
    // ── v1.0 platform tasks ──
    { id: 'a9000001-0001-4000-8000-000000000001', client_invoice_id: clientInvoices[2].id, platform_name: `${P} Ascent`, client_platform_code: 'ERS-ASCENT-4521', invoice_number: 'F-2026-0145', order_number: 'PO-2026-00234', status: 'completed', assigned_to: USERS.bpo, sla_due_at: '2026-01-18T23:59:59Z', completed_at: '2026-01-17T16:00:00Z' },
    { id: 'a9000001-0001-4000-8000-000000000002', client_invoice_id: clientInvoices[0].id, platform_name: `${P} Ariba`, client_platform_code: 'BCR-ARIBA-7890', invoice_number: 'F-2026-0278', order_number: 'REQ-2026-11234', status: 'pending', assigned_to: USERS.bpo, sla_due_at: '2026-02-12T23:59:59Z' },
    { id: 'a9000001-0001-4000-8000-000000000003', client_invoice_id: clientInvoices[0].id, platform_name: `${P} Coupa`, client_platform_code: 'NVP-COUPA-1234', invoice_number: 'F-2026-0312', order_number: 'PO-NVP-2026-0089', status: 'in_progress', assigned_to: USERS.bpo, sla_due_at: '2026-02-10T23:59:59Z' },
    { id: 'a9000001-0001-4000-8000-000000000004', client_invoice_id: clientInvoices[1].id, platform_name: `${P} Tungsten`, client_platform_code: 'TVE-TUNG-5678', invoice_number: 'F-2026-0298', status: 'blocked', assigned_to: USERS.bpo, sla_due_at: '2026-02-08T23:59:59Z', notes: 'Error: PO no encontrada en sistema cliente' },
    // ── v2.0 platform tasks ──
    // PLAT-005: SAP Business Network (Nippon Motor)
    { id: 'a9000001-0001-4000-8000-000000000005', client_invoice_id: clientInvoices[5].id, platform_name: `${P} SAP Business Network`, client_platform_code: 'NMC-SAPBN-789012', invoice_number: 'F-2026-0345', order_number: '4500012345', status: 'pending', assigned_to: USERS.bpo, sla_due_at: '2026-02-15T23:59:59Z', notes: 'Primera factura a cliente vía SAP BN' },
    // PLAT-006: Basware with SLA overdue (Mutua General)
    { id: 'a9000001-0001-4000-8000-000000000006', client_invoice_id: clientInvoices[6].id, platform_name: `${P} Basware`, client_platform_code: 'MGA-BASWARE-4567', invoice_number: 'F-2026-0289', order_number: 'REQ-2026-0089', status: 'blocked', assigned_to: USERS.bpo, sla_due_at: '2026-02-05T23:59:59Z', notes: 'SLA VENCIDO. Error: PO line amount mismatch.' },
    // PLAT-007: Ivalua with evidence (Energías Renovables)
    { id: 'a9000001-0001-4000-8000-000000000007', client_invoice_id: clientInvoices[7].id, platform_name: `${P} Ivalua`, client_platform_code: 'ERS-IVALUA-2345', invoice_number: 'F-2026-0312', order_number: 'PO-ERS-2026-0056', status: 'completed', assigned_to: USERS.bpo, sla_due_at: '2026-02-08T23:59:59Z', completed_at: '2026-02-07T12:00:00Z', evidence_file_path: 'platforms/PLAT-007_confirmation.pdf', notes: 'Subido correctamente 2026-02-07' },
    // PLAT-008: Manual email delivery (Humanitas ONG)
    { id: 'a9000001-0001-4000-8000-000000000008', client_invoice_id: clientInvoices[8].id, platform_name: `${P} Manual/Email`, invoice_number: 'F-2026-0156', status: 'completed', assigned_to: USERS.bpo, completed_at: '2026-02-06T14:20:00Z', notes: 'Entrega manual por email a ONG' },
  ]
  await safeInsert('ginv_platform_tasks', platformTasks)
  console.log(`  ✓ ${platformTasks.length} platform tasks (4 v1.0 + 4 v2.0)`)

  // ─── 11. UTTAI REQUESTS ──────────────────────────────────────────
  const uttaiRequests = [
    // ── v1.0 UTTAI requests ──
    { id: 'ab000001-0001-4000-8000-000000000001', job_id: J(2), requested_by: USERS.operador, status: 'pending', notes: `${P} Pendiente nuevo certificado beneficiario final` },
    { id: 'ab000001-0001-4000-8000-000000000002', job_id: J(5), requested_by: USERS.operador, status: 'in_progress', notes: `${P} Revisión cambio accionarial en curso` },
    { id: 'ab000001-0001-4000-8000-000000000003', job_id: J(2), requested_by: USERS.operador, status: 'resolved', resolved_by: USERS.compliance, resolved_at: '2025-11-25T10:00:00Z', notes: `${P} Documentación aportada — desbloqueado` },
    // ── v2.0 UTTAI requests (TKT-008 to TKT-013) ──
    // TKT-008: resolved (J011 FinTech Innovations unblock)
    { id: 'ab000001-0001-4000-8000-000000000004', job_id: J(11), requested_by: USERS.operador, status: 'resolved', resolved_by: USERS.compliance, resolved_at: '2026-02-09T10:00:00Z', notes: `${P} KYC completa. Cliente aportó estructura societaria y UBOs. Verificado.` },
    // TKT-009: pending (J009 BioPharm shareholding change)
    { id: 'ab000001-0001-4000-8000-000000000005', job_id: J(9), requested_by: USERS.operador, status: 'pending', notes: `${P} Alerta cambio accionarial: venta 30% a fondo PE. Pendiente verificar UBOs.` },
    // TKT-010: resolved (J001 Novapharma false positive)
    { id: 'ab000001-0001-4000-8000-000000000006', job_id: J(1), requested_by: USERS.operador, status: 'resolved', resolved_by: USERS.compliance, resolved_at: '2026-02-08T16:00:00Z', notes: `${P} Falso positivo. Novapharma S.A. distinta de Nova Pharma LLC (Rusia). Verificado.` },
    // TKT-011: in_progress (J012 Nippon Motor translation pending)
    { id: 'ab000001-0001-4000-8000-000000000007', job_id: J(12), requested_by: USERS.operador, status: 'in_progress', notes: `${P} Traducción jurada pendiente. Plazo estimado: 2026-02-20.` },
    // TKT-012: in_progress (J014 JV Solar escalation to committee)
    { id: 'ab000001-0001-4000-8000-000000000008', job_id: J(14), requested_by: USERS.socio, status: 'in_progress', notes: `${P} Escalado a comité compliance. JV compleja, 4 niveles societarios. Próxima reunión: 2026-02-15.` },
    // TKT-013: resolved (J002 Atlántico partial unblock)
    { id: 'ab000001-0001-4000-8000-000000000009', job_id: J(2), requested_by: USERS.socio, status: 'resolved', resolved_by: USERS.compliance, resolved_at: '2026-02-10T10:00:00Z', notes: `${P} Desbloqueo parcial. Revisión trimestral obligatoria. Próxima: 2026-05-10.` },
  ]
  await safeInsert('ginv_uttai_requests', uttaiRequests)
  console.log(`  ✓ ${uttaiRequests.length} UTTAI requests (3 v1.0 + 6 v2.0)`)

  console.log('🌱 G-Invoice seed complete! (v1.0 + v2.0)')
}

// ── CLEANUP ────────────────────────────────────────────────────────
export async function cleanupGInvSeedData() {
  console.log('🧹 Cleaning up G-Invoice seed data...')

  // Delete in FK order (children first)
  await supabaseAdmin.from('ginv_platform_tasks').delete().ilike('platform_name', `${P}%`)

  const { data: invoices } = await supabaseAdmin
    .from('ginv_client_invoices')
    .select('id')
    .ilike('sap_invoice_number', `${P}%`)
  if (invoices?.length) {
    const invIds = invoices.map((i) => i.id)
    await supabaseAdmin.from('ginv_deliveries').delete().in('client_invoice_id', invIds)
    await supabaseAdmin.from('ginv_client_invoices').delete().in('id', invIds)
  }
  // Also delete client invoices without sap_invoice_number (drafts)
  const draftInvoiceIds = [
    'a7000001-0001-4000-8000-000000000004',
  ]
  await supabaseAdmin.from('ginv_deliveries').delete().in('client_invoice_id', draftInvoiceIds)
  await supabaseAdmin.from('ginv_client_invoices').delete().in('id', draftInvoiceIds)

  const { data: testJobs } = await supabaseAdmin
    .from('ginv_jobs')
    .select('id')
    .ilike('job_code', `${P}%`)
  if (testJobs?.length) {
    const jobIds = testJobs.map((j) => j.id)
    const { data: batches } = await supabaseAdmin
      .from('ginv_billing_batches')
      .select('id')
      .in('job_id', jobIds)
    if (batches?.length) {
      const batchIds = batches.map((b) => b.id)
      await supabaseAdmin.from('ginv_billing_batch_items').delete().in('batch_id', batchIds)
      // Delete client invoices tied to batches
      const { data: batchInvoices } = await supabaseAdmin
        .from('ginv_client_invoices')
        .select('id')
        .in('batch_id', batchIds)
      if (batchInvoices?.length) {
        const batchInvIds = batchInvoices.map((i) => i.id)
        await supabaseAdmin.from('ginv_platform_tasks').delete().in('client_invoice_id', batchInvIds)
        await supabaseAdmin.from('ginv_deliveries').delete().in('client_invoice_id', batchInvIds)
        await supabaseAdmin.from('ginv_client_invoices').delete().in('id', batchInvIds)
      }
      await supabaseAdmin.from('ginv_billing_batches').delete().in('id', batchIds)
    }
  }

  const { data: intakeItems } = await supabaseAdmin
    .from('ginv_intake_items')
    .select('id')
    .ilike('concept_text', `${P}%`)
  if (intakeItems?.length) {
    const itemIds = intakeItems.map((i) => i.id)
    await supabaseAdmin.from('ginv_sap_postings').delete().in('intake_item_id', itemIds)
    await supabaseAdmin.from('ginv_intake_items').delete().in('id', itemIds)
  }

  await supabaseAdmin.from('ginv_uttai_requests').delete().ilike('notes', `${P}%`)

  if (testJobs?.length) {
    const jobIds = testJobs.map((j) => j.id)
    await supabaseAdmin.from('ginv_uttai_requests').delete().in('job_id', jobIds)
    await supabaseAdmin.from('ginv_jobs').delete().in('id', jobIds)
  }

  const { data: vendors } = await supabaseAdmin
    .from('ginv_vendors')
    .select('id')
    .ilike('name', `${P}%`)
  if (vendors?.length) {
    const vendorIds = vendors.map((v) => v.id)
    await supabaseAdmin.from('ginv_vendor_documents').delete().in('vendor_id', vendorIds)
    await supabaseAdmin.from('ginv_vendors').delete().in('id', vendorIds)
  }

  console.log('🧹 Cleanup complete!')
}
