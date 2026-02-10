/**
 * LIQUIDA360 - G-Invoice Demo Seed
 * Cleans all ginv_* tables, inserts 167 records with real demo user IDs,
 * uploads 68 real PDFs to Supabase Storage, and links them to DB records.
 *
 * Usage: npx tsx scripts/seed-ginv.ts
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY in .env (or environment)
 * Source data: e2e/helpers/ginv-seed.ts (adapted for demo users)
 * PDF source: g_invoice datos test/ (v1.0 + v2.0)
 */
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ── Config ───────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vrzmkxjvzjphdeshmmzl.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const BUCKET = 'ginv-documents'
const P = 'SEED'

// PDF source directories
const V1_DIR = path.resolve(__dirname, '../g_invoice datos test/ginvoice_facturas')
const V2_DIR = path.resolve(__dirname, '../g_invoice datos test/nuevo set documentos prueba/ginvoice_v2')

// ── Helper: resolve demo user IDs ────────────────────────────────────
interface DemoUsers {
  admin: string
  operador: string
  socio: string
  bpo: string
  compliance: string
}

async function resolveDemoUsers(): Promise<DemoUsers> {
  console.log('🔍 Resolving G-Invoice demo user IDs...')

  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) throw new Error(`Failed to list users: ${error.message}`)

  const users = data?.users || []

  const findUser = (email: string): string => {
    const user = users.find((u) => u.email === email)
    if (!user) throw new Error(`Demo user not found: ${email}. Run scripts/create-ginv-demo-users.sh first.`)
    return user.id
  }

  const resolved: DemoUsers = {
    admin: findUser('ginv.admin@liquida360.demo'),
    operador: findUser('ginv.operador@liquida360.demo'),
    socio: findUser('ginv.socio@liquida360.demo'),
    bpo: findUser('ginv.bpo@liquida360.demo'),
    compliance: findUser('ginv.compliance@liquida360.demo'),
  }

  console.log(`  ✓ admin:      ${resolved.admin}`)
  console.log(`  ✓ operador:   ${resolved.operador}`)
  console.log(`  ✓ socio:      ${resolved.socio}`)
  console.log(`  ✓ bpo:        ${resolved.bpo}`)
  console.log(`  ✓ compliance: ${resolved.compliance}`)

  return resolved
}

// ── Step 1: Cleanup ──────────────────────────────────────────────────
async function cleanupAll() {
  console.log('\n🗑️  Cleaning ALL ginv_* data...')

  // Delete in FK order: children → parents
  const tables = [
    'ginv_platform_tasks',
    'ginv_deliveries',
    'ginv_client_invoices',
    'ginv_billing_batch_items',
    'ginv_billing_batches',
    'ginv_sap_postings',
    'ginv_intake_items',
    'ginv_uttai_requests',
    'ginv_vendor_documents',
    'ginv_vendors',
    'ginv_jobs',
  ]

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) {
      console.warn(`  ⚠ ${table}: ${error.message}`)
    } else {
      console.log(`  ✓ ${table} cleared`)
    }
  }

  // Clean storage bucket
  console.log('  Cleaning storage bucket...')
  const folders = ['vendor_invoices', 'official_fees', 'client_invoices', 'compliance_docs', 'platforms']
  for (const folder of folders) {
    const { data: files } = await supabase.storage.from(BUCKET).list(folder)
    if (files?.length) {
      const paths = files.map((f) => `${folder}/${f.name}`)
      await supabase.storage.from(BUCKET).remove(paths)
      console.log(`  ✓ ${BUCKET}/${folder}: ${paths.length} files removed`)
    }
  }

  console.log('  ✓ Cleanup complete')
}

// ── Step 2: Insert data ──────────────────────────────────────────────
async function insertData(USERS: DemoUsers) {
  console.log('\n📌 Inserting 167 records across 11 tables...')

  // ─── 1. JOBS (14) ──────────────────────────────────────────────────
  const jobs = [
    { id: 'a0000001-0001-4000-8000-000000000001', job_code: `${P}-MAT-2025-0234`, client_code: 'NVP-001', client_name: 'Grupo Farmaceutico Novapharma S.A.', uttai_status: 'clear', uttai_subject_obliged: true, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000002', job_code: `${P}-MAT-2025-0412`, client_code: 'IAC-002', client_name: 'Inversiones Atlantico Capital S.L.', uttai_status: 'blocked', uttai_subject_obliged: null, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000003', job_code: `${P}-MAT-2025-0589`, client_code: 'CME-003', client_name: 'Constructora Mediterraneo S.A.U.', uttai_status: 'clear', uttai_subject_obliged: false, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000004', job_code: `${P}-MAT-2026-0023`, client_code: 'TVE-004', client_name: 'Tech Ventures Europe B.V.', uttai_status: 'clear', uttai_subject_obliged: true, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000005', job_code: `${P}-MAT-2026-0045`, client_code: 'ERS-005', client_name: 'Energias Renovables del Sur S.A.', uttai_status: 'pending_review', uttai_subject_obliged: null, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000006', job_code: `${P}-MAT-2025-0678`, client_code: 'BCR-006', client_name: 'Banco Cooperativo Regional', uttai_status: 'clear', uttai_subject_obliged: true, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000007', job_code: `${P}-MAT-2026-0089`, client_code: 'BPH-007', client_name: 'BioPharm Holdings Inc.', uttai_status: 'clear', uttai_subject_obliged: true, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000008', job_code: `${P}-MAT-2026-0091`, client_code: 'BPH-007', client_name: 'BioPharm Holdings Inc.', uttai_status: 'clear', uttai_subject_obliged: true, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000009', job_code: `${P}-MAT-2026-0095`, client_code: 'BPH-007', client_name: 'BioPharm Holdings Inc.', uttai_status: 'pending_review', uttai_subject_obliged: null, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000010', job_code: `${P}-MAT-2026-0102`, client_code: 'MGA-008', client_name: 'Mutua General de Aseguradoras S.A.', uttai_status: 'clear', uttai_subject_obliged: true, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000011', job_code: `${P}-MAT-2026-0115`, client_code: 'FTI-009', client_name: 'FinTech Innovations DAC', uttai_status: 'blocked', uttai_subject_obliged: null, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000012', job_code: `${P}-MAT-2026-0123`, client_code: 'NMC-010', client_name: 'Nippon Motor Corporation', uttai_status: 'clear', uttai_subject_obliged: true, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000013', job_code: `${P}-MAT-2026-0134`, client_code: 'HFA-011', client_name: 'Fundacion Humanitas para Africa', uttai_status: 'clear', uttai_subject_obliged: false, owner_user_id: USERS.socio, status: 'active' },
    { id: 'a0000001-0001-4000-8000-000000000014', job_code: `${P}-MAT-2026-0145`, client_code: 'JVS-012', client_name: 'JV Solar Hispano-Japonesa S.L.', uttai_status: 'pending_review', uttai_subject_obliged: null, owner_user_id: USERS.socio, status: 'active' },
  ]
  await upsert('ginv_jobs', jobs)

  // ─── 2. VENDORS (13) ──────────────────────────────────────────────
  const vendors = [
    { id: 'b0000001-0001-4000-8000-000000000001', name: `${P} Registradores de Barcelona S.L.`, tax_id: 'B08567891', country: 'Espana', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000002', name: `${P} Notaria Perez-Llorca Madrid`, tax_id: 'E28345678', country: 'Espana', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000003', name: `${P} PatentMax GmbH`, tax_id: 'DE298765432', country: 'Alemania', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000004', name: `${P} Sullivan & Partners LLP`, tax_id: 'GB987654321', country: 'Reino Unido', compliance_status: 'expiring_soon' },
    { id: 'b0000001-0001-4000-8000-000000000005', name: `${P} Chen & Associates`, tax_id: '91310115MA1K3LXX2H', country: 'China', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000006', name: `${P} Studio Legale Bianchi`, tax_id: 'IT02345678901', country: 'Italia', compliance_status: 'non_compliant' },
    { id: 'b0000001-0001-4000-8000-000000000007', name: `${P} OEPM`, tax_id: 'Q2801019A', country: 'Espana', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000009', name: `${P} Morrison & Blake LLP`, tax_id: '13-5678901', country: 'Estados Unidos', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000010', name: `${P} Tanaka & Yamamoto`, tax_id: 'T1234567890123', country: 'Japon', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000011', name: `${P} Helvetia Tax Advisors AG`, tax_id: 'CHE-123.456.789', country: 'Suiza', compliance_status: 'expiring_soon' },
    { id: 'b0000001-0001-4000-8000-000000000012', name: `${P} Souza & Ferreira Advogados`, tax_id: '12.345.678/0001-90', country: 'Brasil', compliance_status: 'non_compliant' },
    { id: 'b0000001-0001-4000-8000-000000000013', name: `${P} Sharma IP Associates`, tax_id: 'AABCS1234F', country: 'India', compliance_status: 'compliant' },
    { id: 'b0000001-0001-4000-8000-000000000014', name: `${P} Al-Rashid Legal Consultants`, tax_id: '100234567890003', country: 'Emiratos Arabes', compliance_status: 'non_compliant' },
  ]
  await upsert('ginv_vendors', vendors)

  // ─── 3. VENDOR DOCUMENTS (15) ─────────────────────────────────────
  const vendorDocs = [
    { id: 'c0000001-0001-4000-8000-000000000001', vendor_id: vendors[2].id, doc_type: 'tax_residency_certificate', issued_at: '2025-06-15', expires_at: '2026-06-15', status: 'compliant' },
    { id: 'c0000001-0001-4000-8000-000000000002', vendor_id: vendors[3].id, doc_type: 'tax_residency_certificate', issued_at: '2025-03-10', expires_at: '2026-03-10', status: 'expiring_soon' },
    { id: 'c0000001-0001-4000-8000-000000000003', vendor_id: vendors[4].id, doc_type: 'tax_residency_certificate', issued_at: '2025-09-01', expires_at: '2026-09-01', status: 'compliant' },
    { id: 'c0000001-0001-4000-8000-000000000004', vendor_id: vendors[4].id, doc_type: 'partners_letter', issued_at: '2025-09-01', expires_at: '2026-09-01', status: 'compliant' },
    { id: 'c0000001-0001-4000-8000-000000000005', vendor_id: vendors[5].id, doc_type: 'tax_residency_certificate', issued_at: '2024-11-15', expires_at: '2025-11-15', status: 'non_compliant' },
    { id: 'c0000001-0001-4000-8000-000000000006', vendor_id: vendors[7].id, doc_type: 'tax_residency_certificate', issued_at: '2025-04-15', expires_at: '2026-04-15', status: 'compliant', file_path: 'vendors/V009_US_FORM6166_2025.pdf' },
    { id: 'c0000001-0001-4000-8000-000000000007', vendor_id: vendors[7].id, doc_type: 'other', issued_at: '2025-04-15', expires_at: '2026-04-15', status: 'compliant', file_path: 'vendors/V009_US_APOSTILLE_2025.pdf' },
    { id: 'c0000001-0001-4000-8000-000000000008', vendor_id: vendors[8].id, doc_type: 'tax_residency_certificate', issued_at: '2025-08-01', expires_at: '2026-08-01', status: 'compliant', file_path: 'vendors/V010_JP_CERT_2025.pdf' },
    { id: 'c0000001-0001-4000-8000-000000000009', vendor_id: vendors[8].id, doc_type: 'other', issued_at: '2025-08-01', expires_at: '2027-08-01', status: 'compliant', file_path: 'vendors/V010_JP_TRADUCCION_2025.pdf' },
    { id: 'c0000001-0001-4000-8000-000000000010', vendor_id: vendors[9].id, doc_type: 'tax_residency_certificate', issued_at: '2025-02-25', expires_at: '2026-02-25', status: 'expiring_soon', file_path: 'vendors/V011_CH_CERT_2025.pdf' },
    { id: 'c0000001-0001-4000-8000-000000000011', vendor_id: vendors[10].id, doc_type: 'tax_residency_certificate', issued_at: '2024-11-10', expires_at: '2025-11-10', status: 'non_compliant', file_path: 'vendors/V012_BR_CERT_2024_EXPIRED.pdf' },
    { id: 'c0000001-0001-4000-8000-000000000012', vendor_id: vendors[11].id, doc_type: 'tax_residency_certificate', issued_at: '2025-07-01', expires_at: '2026-06-30', status: 'compliant', file_path: 'vendors/V013_IN_CERT_2025.pdf' },
    { id: 'c0000001-0001-4000-8000-000000000013', vendor_id: vendors[11].id, doc_type: 'other', issued_at: '2025-07-01', expires_at: '2026-06-30', status: 'compliant', file_path: 'vendors/V013_IN_FORM10F_2025.pdf' },
    { id: 'c0000001-0001-4000-8000-000000000015', vendor_id: vendors[5].id, doc_type: 'tax_residency_certificate', issued_at: '2026-02-05', expires_at: '2027-02-05', status: 'compliant', file_path: 'vendors/V006_IT_CERT_2026.pdf' },
    { id: 'c0000001-0001-4000-8000-000000000016', vendor_id: vendors[2].id, doc_type: 'other', issued_at: '2025-01-15', expires_at: null, status: 'compliant', file_path: 'vendors/V003_DE_PODER_2025.pdf' },
  ]
  await upsert('ginv_vendor_documents', vendorDocs)

  // ─── 4. INTAKE ITEMS (51) ─────────────────────────────────────────
  const J = (n: number) => jobs[n - 1].id
  const V = (n: number) => vendors[n - 1].id

  const intakeItems = [
    // ══ v1.0 INTAKE ITEMS (indices 0-24) ══
    // Drafts (0-1)
    { id: 'd0000001-0001-4000-8000-000000000001', type: 'vendor_invoice', vendor_id: V(3), job_id: J(1), invoice_number: 'PM-2026-0089', invoice_date: '2026-01-28', amount: 4250.00, currency: 'EUR', concept_text: `${P} Registro marca comunitaria Clase 5`, status: 'draft', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000002', type: 'vendor_invoice', vendor_id: V(6), job_id: J(3), invoice_number: 'SLB-2026-112', invoice_date: '2026-02-01', amount: 8900.00, currency: 'EUR', concept_text: `${P} Due diligence subsidiaria italiana`, status: 'draft', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'non_compliant', created_by: USERS.operador },
    // Submitted (2-3)
    { id: 'd0000001-0001-4000-8000-000000000003', type: 'vendor_invoice', vendor_id: V(1), job_id: J(1), invoice_number: 'RB-2026-2341', invoice_date: '2026-01-15', amount: 1245.80, currency: 'EUR', concept_text: `${P} Inscripcion aumento capital`, approver_user_id: USERS.socio, status: 'submitted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000004', type: 'vendor_invoice', vendor_id: V(4), job_id: J(4), invoice_number: 'SP-2026-0456', invoice_date: '2026-01-22', amount: 12500.00, currency: 'GBP', concept_text: `${P} Asesoramiento adquisicion startup UK`, approver_user_id: USERS.socio, status: 'submitted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'expiring_soon', created_by: USERS.operador },
    // Needs info (4)
    { id: 'd0000001-0001-4000-8000-000000000005', type: 'vendor_invoice', vendor_id: V(2), job_id: J(3), invoice_number: 'NPL-2026-0078', invoice_date: '2026-01-10', amount: 3890.00, currency: 'EUR', concept_text: `${P} Escritura compraventa terreno industrial`, status: 'needs_info', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // Pending approval (5-7)
    { id: 'd0000001-0001-4000-8000-000000000007', type: 'vendor_invoice', vendor_id: V(3), job_id: J(1), invoice_number: 'PM-2026-0045', invoice_date: '2025-12-20', amount: 6780.00, currency: 'EUR', concept_text: `${P} Oposicion marca EU`, approver_user_id: USERS.socio, status: 'pending_approval', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000008', type: 'vendor_invoice', vendor_id: V(1), job_id: J(6), invoice_number: 'RB-2026-1892', invoice_date: '2026-01-28', amount: 890.50, currency: 'EUR', concept_text: `${P} Nota simple informativa 5 fincas`, approver_user_id: USERS.socio, status: 'pending_approval', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000009', type: 'vendor_invoice', vendor_id: V(4), job_id: J(2), invoice_number: 'SP-2026-0501', invoice_date: '2026-01-18', amount: 45000.00, currency: 'GBP', concept_text: `${P} Due diligence fondo inversion`, approver_user_id: USERS.socio, status: 'pending_approval', uttai_status_snapshot: 'blocked', vendor_compliance_snapshot: 'expiring_soon', created_by: USERS.operador },
    // Approved (8-10)
    { id: 'd0000001-0001-4000-8000-000000000010', type: 'vendor_invoice', vendor_id: V(2), job_id: J(3), invoice_number: 'NPL-2026-0091', invoice_date: '2026-02-01', amount: 2450.00, currency: 'EUR', concept_text: `${P} Poderes notariales consejeros`, approver_user_id: USERS.socio, status: 'approved', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000011', type: 'vendor_invoice', vendor_id: V(3), job_id: J(4), invoice_number: 'PM-2026-0067', invoice_date: '2026-02-02', amount: 5200.00, currency: 'EUR', concept_text: `${P} Renovacion cartera marcas EU`, approver_user_id: USERS.socio, status: 'approved', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000012', type: 'vendor_invoice', vendor_id: V(5), job_id: J(1), invoice_number: 'CA-2026-0034', invoice_date: '2026-02-03', amount: 15800.00, currency: 'USD', concept_text: `${P} Asesoramiento importacion API farmaceutico`, approver_user_id: USERS.socio, status: 'approved', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // Sent to accounting (11-12)
    { id: 'd0000001-0001-4000-8000-000000000014', type: 'vendor_invoice', vendor_id: V(1), job_id: J(6), invoice_number: 'RB-2026-1756', invoice_date: '2026-01-25', amount: 567.30, currency: 'EUR', concept_text: `${P} Nota simple registral`, approver_user_id: USERS.socio, status: 'sent_to_accounting', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000015', type: 'vendor_invoice', vendor_id: V(2), job_id: J(1), invoice_number: 'NPL-2026-0082', invoice_date: '2026-01-27', amount: 4120.00, currency: 'EUR', concept_text: `${P} Escritura protocolizacion`, approver_user_id: USERS.socio, status: 'sent_to_accounting', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // Posted (13-16)
    { id: 'd0000001-0001-4000-8000-000000000017', type: 'vendor_invoice', vendor_id: V(1), job_id: J(1), invoice_number: 'RB-2026-1678', invoice_date: '2026-01-20', amount: 1890.00, currency: 'EUR', concept_text: `${P} Notas simples`, approver_user_id: USERS.socio, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000018', type: 'vendor_invoice', vendor_id: V(2), job_id: J(3), invoice_number: 'NPL-2026-0056', invoice_date: '2026-01-22', amount: 6780.00, currency: 'EUR', concept_text: `${P} Escritura compraventa`, approver_user_id: USERS.socio, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000019', type: 'vendor_invoice', vendor_id: V(3), job_id: J(4), invoice_number: 'PM-2026-0034', invoice_date: '2026-01-24', amount: 8900.00, currency: 'EUR', concept_text: `${P} Registro patentes EU`, approver_user_id: USERS.socio, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000020', type: 'vendor_invoice', vendor_id: V(5), job_id: J(4), invoice_number: 'CA-2026-0012', invoice_date: '2026-01-26', amount: 22500.00, currency: 'USD', concept_text: `${P} Constitucion WFOE`, approver_user_id: USERS.socio, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // Ready to bill (17-18)
    { id: 'd0000001-0001-4000-8000-000000000021', type: 'vendor_invoice', vendor_id: V(1), job_id: J(1), invoice_number: 'RB-2026-1590', invoice_date: '2026-01-18', amount: 2340.00, currency: 'EUR', concept_text: `${P} Inscripcion escritura`, approver_user_id: USERS.socio, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000022', type: 'vendor_invoice', vendor_id: V(2), job_id: J(1), invoice_number: 'NPL-2026-0045', invoice_date: '2026-01-19', amount: 5670.00, currency: 'EUR', concept_text: `${P} Acta protocolizacion`, approver_user_id: USERS.socio, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // v1.0 Official fees (19-24)
    { id: 'd0000001-0001-4000-8000-000000000030', type: 'official_fee', vendor_id: V(7), job_id: J(1), invoice_number: 'OEPM-2026-001', invoice_date: '2026-01-10', amount: 144.58, currency: 'EUR', concept_text: `${P} Tasa solicitud marca nacional Clase 5`, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-0000000000b1', type: 'official_fee', vendor_id: V(7), job_id: J(1), invoice_number: 'OEPM-2026-002', invoice_date: '2026-01-15', amount: 178.35, currency: 'EUR', concept_text: `${P} Tasa renovacion marca`, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-0000000000b2', type: 'official_fee', vendor_id: V(1), job_id: J(1), invoice_number: 'RM-2026-003', invoice_date: '2026-01-20', amount: 89.50, currency: 'EUR', concept_text: `${P} Inscripcion aumento capital`, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-0000000000b3', type: 'official_fee', vendor_id: null, job_id: J(4), invoice_number: 'OEPM-2026-006', invoice_date: '2026-02-01', amount: 652.34, currency: 'EUR', concept_text: `${P} Tasa solicitud patente nacional`, status: 'sent_to_accounting', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-0000000000a7', type: 'official_fee', vendor_id: null, job_id: J(3), invoice_number: 'RP-2026-007', invoice_date: '2026-02-03', amount: 45.20, currency: 'EUR', concept_text: `${P} Anotacion preventiva embargo`, status: 'approved', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000035', type: 'official_fee', vendor_id: null, job_id: J(4), invoice_number: 'EPO-2026-010', invoice_date: '2026-02-07', amount: 1875.00, currency: 'EUR', concept_text: `${P} Tasa examen patente europea`, status: 'draft', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },

    // ══ v2.0 INTAKE ITEMS (indices 25+) ══
    // Rejected (25-27)
    { id: 'd0000001-0001-4000-8000-000000000025', type: 'vendor_invoice', vendor_id: vendors[9].id, job_id: J(10), invoice_number: 'HTA-2026-0034', invoice_date: '2026-01-20', amount: 45000.00, currency: 'CHF', concept_text: `${P} Asesoramiento fiscal reestructuracion Solvencia II`, approver_user_id: USERS.socio, status: 'rejected', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'expiring_soon', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000026', type: 'vendor_invoice', vendor_id: vendors[7].id, job_id: J(7), invoice_number: 'MB-2026-0089', invoice_date: '2026-01-15', amount: 125000.00, currency: 'USD', concept_text: `${P} Legal fees Q4 2025 — Patent litigation`, approver_user_id: USERS.socio, status: 'rejected', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000027', type: 'vendor_invoice', vendor_id: vendors[12].id, job_id: J(12), invoice_number: 'ARL-2026-0012', invoice_date: '2026-01-25', amount: 18500.00, currency: 'USD', concept_text: `${P} Corporate advisory — Dubai subsidiary`, approver_user_id: USERS.socio, status: 'rejected', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'non_compliant', created_by: USERS.operador },
    // Billed (28-30)
    { id: 'd0000001-0001-4000-8000-000000000028', type: 'vendor_invoice', vendor_id: V(1), job_id: J(1), invoice_number: 'RB-2025-8934', invoice_date: '2025-11-20', amount: 1450.00, currency: 'EUR', concept_text: `${P} Inscripcion escritura constitucion`, approver_user_id: USERS.socio, status: 'billed', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000029', type: 'vendor_invoice', vendor_id: V(2), job_id: J(3), invoice_number: 'NPL-2025-0234', invoice_date: '2025-12-10', amount: 3780.00, currency: 'EUR', concept_text: `${P} Escritura compraventa nave industrial`, approver_user_id: USERS.socio, status: 'billed', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-0000000000a0', type: 'vendor_invoice', vendor_id: V(3), job_id: J(4), invoice_number: 'PM-2025-0189', invoice_date: '2025-12-15', amount: 7200.00, currency: 'EUR', concept_text: `${P} Renovacion marcas EU lote diciembre`, approver_user_id: USERS.socio, status: 'billed', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // Archived (31-33)
    { id: 'd0000001-0001-4000-8000-000000000031', type: 'vendor_invoice', vendor_id: V(4), job_id: J(4), invoice_number: 'SP-2025-0345', invoice_date: '2025-10-15', amount: 22000.00, currency: 'GBP', concept_text: `${P} Due diligence target UK`, approver_user_id: USERS.socio, status: 'archived', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000032', type: 'vendor_invoice', vendor_id: V(5), job_id: J(1), invoice_number: 'CA-2025-0156', invoice_date: '2025-11-01', amount: 8500.00, currency: 'USD', concept_text: `${P} WFOE compliance review`, approver_user_id: USERS.socio, status: 'archived', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000033', type: 'vendor_invoice', vendor_id: V(1), job_id: J(6), invoice_number: 'RB-2026-1234', invoice_date: '2026-01-20', amount: 890.00, currency: 'EUR', concept_text: `${P} Nota simple fincas — duplicada`, status: 'archived', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // Rejection/re-submit scenarios (34-39)
    { id: 'd0000001-0001-4000-8000-000000000034', type: 'vendor_invoice', vendor_id: vendors[8].id, job_id: J(12), invoice_number: 'TY-2026-0045', invoice_date: '2026-01-20', amount: 2850000.00, currency: 'JPY', concept_text: `${P} Registro patentes Japon (15 patentes)`, approver_user_id: USERS.socio, status: 'rejected', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000134', type: 'vendor_invoice', vendor_id: vendors[8].id, job_id: J(12), invoice_number: 'TY-2026-0045-R1', invoice_date: '2026-01-30', amount: 2100000.00, currency: 'JPY', concept_text: `${P} Registro patentes Japon (11 patentes) — 4 excluidas`, approver_user_id: USERS.socio, status: 'pending_approval', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-0000000000a1', type: 'vendor_invoice', vendor_id: vendors[11].id, job_id: J(7), invoice_number: 'SIA-2026-0078', invoice_date: '2026-01-25', amount: 485000.00, currency: 'INR', concept_text: `${P} Trademark registration classes 5, 35, 42 — BIOPHARMA mark India`, approver_user_id: USERS.socio, status: 'sent_to_accounting', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000036', type: 'vendor_invoice', vendor_id: vendors[10].id, job_id: J(3), invoice_number: 'SF-2026-0023', invoice_date: '2026-02-01', amount: 45000.00, currency: 'BRL', concept_text: `${P} Representacion procesal demanda laboral Sao Paulo`, approver_user_id: USERS.socio, status: 'pending_approval', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000037', type: 'vendor_invoice', vendor_id: vendors[7].id, job_id: J(11), invoice_number: 'MB-2026-0112', invoice_date: '2026-01-28', amount: 78000.00, currency: 'USD', concept_text: `${P} Regulatory advisory — PSD2 compliance review`, approver_user_id: USERS.socio, status: 'sent_to_accounting', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000038', type: 'vendor_invoice', vendor_id: vendors[12].id, job_id: J(12), invoice_number: 'ARL-2026-0034', invoice_date: '2026-01-15', amount: 35000.00, currency: 'USD', concept_text: `${P} Corporate setup Dubai free zone`, approver_user_id: USERS.socio, status: 'archived', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'non_compliant', created_by: USERS.operador },
    // Batch intake items (40-45)
    { id: 'd0000001-0001-4000-8000-000000000039', type: 'vendor_invoice', vendor_id: vendors[7].id, job_id: J(7), invoice_number: 'MB-2026-0134', invoice_date: '2026-02-05', amount: 8500.00, currency: 'USD', concept_text: `${P} Patent prosecution fees Q1 2026`, approver_user_id: USERS.socio, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000040', type: 'vendor_invoice', vendor_id: vendors[11].id, job_id: J(7), invoice_number: 'SIA-2026-0089', invoice_date: '2026-02-06', amount: 3950.00, currency: 'USD', concept_text: `${P} TM class 5 prosecution India`, approver_user_id: USERS.socio, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000041', type: 'vendor_invoice', vendor_id: vendors[9].id, job_id: J(10), invoice_number: 'HTA-2026-0056', invoice_date: '2026-02-03', amount: 12500.00, currency: 'CHF', concept_text: `${P} Asesoramiento Solvencia II trimestral`, approver_user_id: USERS.socio, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'expiring_soon', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000042', type: 'vendor_invoice', vendor_id: V(2), job_id: J(10), invoice_number: 'NPL-2026-0112', invoice_date: '2026-02-04', amount: 6250.00, currency: 'EUR', concept_text: `${P} Escritura ampliacion objeto social`, approver_user_id: USERS.socio, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000043', type: 'vendor_invoice', vendor_id: V(1), job_id: J(1), invoice_number: 'RB-2026-1601', invoice_date: '2026-02-01', amount: 456.00, currency: 'EUR', concept_text: `${P} Nota simple — duplicado GINV-028`, approver_user_id: USERS.socio, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000044', type: 'vendor_invoice', vendor_id: V(3), job_id: J(1), invoice_number: 'PM-2026-0098', invoice_date: '2026-02-02', amount: 3200.00, currency: 'EUR', concept_text: `${P} Registro marcas adicionales`, approver_user_id: USERS.socio, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: 'compliant', created_by: USERS.operador },
    // v2.0 Official fees (46-51)
    { id: 'd0000001-0001-4000-8000-000000000045', type: 'official_fee', vendor_id: null, job_id: J(7), invoice_number: 'USPTO-2026-001', invoice_date: '2026-02-01', amount: 1820.00, currency: 'USD', concept_text: `${P} Filing fee patent application USPTO`, status: 'posted', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000046', type: 'official_fee', vendor_id: null, job_id: J(12), invoice_number: 'JPO-2026-001', invoice_date: '2026-01-25', amount: 324000.00, currency: 'JPY', concept_text: `${P} Patent filing fee JPO`, status: 'ready_to_bill', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000047', type: 'official_fee', vendor_id: null, job_id: J(10), invoice_number: 'IPI-2026-001', invoice_date: '2026-02-03', amount: 550.00, currency: 'CHF', concept_text: `${P} Trademark registration fee Swiss IPI`, status: 'sent_to_accounting', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000048', type: 'official_fee', vendor_id: null, job_id: J(7), invoice_number: 'ITMR-2026-001', invoice_date: '2026-01-28', amount: 27000.00, currency: 'INR', concept_text: `${P} TM-1 application 3 classes India`, status: 'approved', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000049', type: 'official_fee', vendor_id: null, job_id: J(3), invoice_number: 'INPI-2026-001', invoice_date: '2026-02-05', amount: 1100.00, currency: 'BRL', concept_text: `${P} Taxa de pedido de patente INPI Brasil`, status: 'draft', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
    { id: 'd0000001-0001-4000-8000-000000000050', type: 'official_fee', vendor_id: null, job_id: J(13), invoice_number: 'DGT-2026-001', invoice_date: '2026-01-20', amount: 0.01, currency: 'EUR', concept_text: `${P} Tasa exencion IVA fundaciones DGT`, status: 'billed', uttai_status_snapshot: 'clear', vendor_compliance_snapshot: null, created_by: USERS.operador },
  ]
  await upsert('ginv_intake_items', intakeItems)

  // ─── 5. SAP POSTINGS (14) ─────────────────────────────────────────
  const sapPostings = [
    { id: 'e0000001-0001-4000-8000-000000000001', intake_item_id: intakeItems[13].id, sap_reference: '5100012345', posted_at: '2026-01-28T10:00:00Z', posted_by: USERS.bpo },
    { id: 'e0000001-0001-4000-8000-000000000002', intake_item_id: intakeItems[14].id, sap_reference: '5100012389', posted_at: '2026-01-30T10:00:00Z', posted_by: USERS.bpo },
    { id: 'e0000001-0001-4000-8000-000000000003', intake_item_id: intakeItems[15].id, sap_reference: '5100012401', posted_at: '2026-02-01T10:00:00Z', posted_by: USERS.bpo },
    { id: 'e0000001-0001-4000-8000-000000000004', intake_item_id: intakeItems[16].id, sap_reference: '5100012456', posted_at: '2026-02-03T10:00:00Z', posted_by: USERS.bpo },
    { id: 'e0000001-0001-4000-8000-000000000005', intake_item_id: intakeItems[19].id, sap_reference: '5100011890', posted_at: '2026-01-10T10:00:00Z', posted_by: USERS.bpo },
    { id: 'e0000001-0001-4000-8000-000000000006', intake_item_id: intakeItems[20].id, sap_reference: '5100011923', posted_at: '2026-01-15T10:00:00Z', posted_by: USERS.bpo },
    // v2.0 SAP postings for billed items
    { id: 'e0000001-0001-4000-8000-000000000007', intake_item_id: intakeItems[28].id, sap_reference: '5100011123', posted_at: '2025-12-15T10:00:00Z', posted_by: USERS.bpo },
    { id: 'e0000001-0001-4000-8000-000000000008', intake_item_id: intakeItems[29].id, sap_reference: '5100011156', posted_at: '2025-12-20T10:00:00Z', posted_by: USERS.bpo },
    { id: 'e0000001-0001-4000-8000-000000000009', intake_item_id: intakeItems[30].id, sap_reference: '5100011189', posted_at: '2025-12-28T10:00:00Z', posted_by: USERS.bpo },
    // v2.0 batch items GINV-041, GINV-042
    { id: 'e0000001-0001-4000-8000-000000000010', intake_item_id: intakeItems[42].id, sap_reference: '5100012567', posted_at: '2026-02-05T10:00:00Z', posted_by: USERS.bpo },
    { id: 'e0000001-0001-4000-8000-000000000011', intake_item_id: intakeItems[43].id, sap_reference: '5100012589', posted_at: '2026-02-06T10:00:00Z', posted_by: USERS.bpo },
    // v2.0 TASA-013 (posted)
    { id: 'e0000001-0001-4000-8000-000000000012', intake_item_id: intakeItems[46].id, sap_reference: '5100012601', posted_at: '2026-02-01T10:00:00Z', posted_by: USERS.bpo },
    // v2.0 TASA-014 (ready_to_bill)
    { id: 'e0000001-0001-4000-8000-000000000013', intake_item_id: intakeItems[47].id, sap_reference: '5100012623', posted_at: '2026-01-25T10:00:00Z', posted_by: USERS.bpo },
    // v2.0 TASA-018 (billed)
    { id: 'e0000001-0001-4000-8000-000000000014', intake_item_id: intakeItems[51].id, sap_reference: '5100012456', posted_at: '2026-01-20T10:00:00Z', posted_by: USERS.bpo },
  ]
  await upsert('ginv_sap_postings', sapPostings)

  // ─── 6. BILLING BATCHES (13) ──────────────────────────────────────
  const batches = [
    // v1.0
    { id: 'f0000001-0001-4000-8000-000000000001', job_id: J(1), status: 'pending_partner_approval', uttai_subject_obliged: true, total_amount: 8010.00, total_fees: 89.50, created_by: USERS.bpo },
    { id: 'f0000001-0001-4000-8000-000000000002', job_id: J(3), status: 'ready_for_sap', uttai_subject_obliged: false, total_amount: 4560.00, total_fees: 320.00, created_by: USERS.bpo },
    { id: 'f0000001-0001-4000-8000-000000000003', job_id: J(4), status: 'issued', uttai_subject_obliged: true, total_amount: 31400.00, total_fees: null, created_by: USERS.bpo },
    { id: 'f0000001-0001-4000-8000-000000000004', job_id: J(6), status: 'delivered', uttai_subject_obliged: true, total_amount: 1890.00, total_fees: 322.93, created_by: USERS.bpo },
    // v2.0
    { id: 'f0000001-0001-4000-8000-000000000005', job_id: J(1), status: 'delivered', uttai_subject_obliged: true, total_amount: 1450.00, total_fees: null, created_by: USERS.bpo },
    { id: 'f0000001-0001-4000-8000-000000000006', job_id: J(7), status: 'invoice_draft', uttai_subject_obliged: true, total_amount: 48102.34, total_fees: 652.34, created_by: USERS.bpo },
    { id: 'f0000001-0001-4000-8000-000000000007', job_id: J(10), status: 'ready_for_sap', uttai_subject_obliged: true, total_amount: 40750.00, total_fees: 0.00, created_by: USERS.bpo },
    { id: 'f0000001-0001-4000-8000-000000000008', job_id: J(4), status: 'ready_for_sap', uttai_subject_obliged: true, total_amount: 18900.00, total_fees: null, created_by: USERS.bpo },
    { id: 'f0000001-0001-4000-8000-000000000009', job_id: J(1), status: 'ready_for_sap', uttai_subject_obliged: true, total_amount: 3200.00, total_fees: null, created_by: USERS.bpo },
    { id: 'f0000001-0001-4000-8000-000000000010', job_id: J(3), status: 'delivered', uttai_subject_obliged: false, total_amount: 28450.00, total_fees: null, created_by: USERS.bpo },
    { id: 'f0000001-0001-4000-8000-000000000011', job_id: J(12), status: 'platform_required', uttai_subject_obliged: true, total_amount: 4250000.00, total_fees: null, created_by: USERS.bpo },
    { id: 'f0000001-0001-4000-8000-000000000012', job_id: J(5), status: 'platform_completed', uttai_subject_obliged: null, total_amount: 18900.00, total_fees: null, created_by: USERS.bpo },
    { id: 'f0000001-0001-4000-8000-000000000013', job_id: J(13), status: 'delivered', uttai_subject_obliged: false, total_amount: 850.00, total_fees: null, created_by: USERS.bpo },
  ]
  await upsert('ginv_billing_batches', batches)

  // ─── 7. BILLING BATCH ITEMS (15) ──────────────────────────────────
  const batchItems = [
    // v1.0
    { id: 'f1000001-0001-4000-8000-000000000001', batch_id: batches[0].id, intake_item_id: intakeItems[17].id, decision: 'emit' },
    { id: 'f1000001-0001-4000-8000-000000000002', batch_id: batches[0].id, intake_item_id: intakeItems[18].id, decision: 'emit' },
    { id: 'f1000001-0001-4000-8000-000000000003', batch_id: batches[2].id, intake_item_id: intakeItems[15].id, decision: 'emit' },
    { id: 'f1000001-0001-4000-8000-000000000004', batch_id: batches[2].id, intake_item_id: intakeItems[16].id, decision: 'transfer' },
    { id: 'f1000001-0001-4000-8000-000000000005', batch_id: batches[3].id, intake_item_id: intakeItems[13].id, decision: 'emit' },
    // v2.0
    { id: 'f1000001-0001-4000-8000-000000000006', batch_id: batches[4].id, intake_item_id: intakeItems[28].id, decision: 'emit' },
    { id: 'f1000001-0001-4000-8000-000000000007', batch_id: batches[5].id, intake_item_id: intakeItems[40].id, decision: null },
    { id: 'f1000001-0001-4000-8000-000000000008', batch_id: batches[5].id, intake_item_id: intakeItems[41].id, decision: null },
    { id: 'f1000001-0001-4000-8000-000000000009', batch_id: batches[5].id, intake_item_id: intakeItems[46].id, decision: null },
    { id: 'f1000001-0001-4000-8000-000000000010', batch_id: batches[6].id, intake_item_id: intakeItems[42].id, decision: 'emit' },
    { id: 'f1000001-0001-4000-8000-000000000011', batch_id: batches[6].id, intake_item_id: intakeItems[43].id, decision: 'emit' },
    { id: 'f1000001-0001-4000-8000-000000000012', batch_id: batches[7].id, intake_item_id: intakeItems[18].id, decision: 'transfer' },
    { id: 'f1000001-0001-4000-8000-000000000013', batch_id: batches[8].id, intake_item_id: intakeItems[44].id, decision: 'discard' },
    { id: 'f1000001-0001-4000-8000-000000000014', batch_id: batches[8].id, intake_item_id: intakeItems[45].id, decision: 'emit' },
    { id: 'f1000001-0001-4000-8000-000000000015', batch_id: batches[9].id, intake_item_id: intakeItems[29].id, decision: 'emit' },
  ]
  await upsert('ginv_billing_batch_items', batchItems)

  // ─── 8. CLIENT INVOICES (9) ───────────────────────────────────────
  const clientInvoices = [
    // v1.0
    { id: 'a7000001-0001-4000-8000-000000000001', batch_id: batches[2].id, sap_invoice_number: `${P}-F-2026-0234`, sap_invoice_date: '2026-02-03', status: 'issued', created_by: USERS.bpo },
    { id: 'a7000001-0001-4000-8000-000000000002', batch_id: batches[3].id, sap_invoice_number: `${P}-F-2026-0189`, sap_invoice_date: '2026-01-30', status: 'delivered', created_by: USERS.bpo },
    { id: 'a7000001-0001-4000-8000-000000000003', batch_id: null, sap_invoice_number: `${P}-F-2026-0145`, sap_invoice_date: '2026-01-15', status: 'platform_completed', created_by: USERS.bpo },
    { id: 'a7000001-0001-4000-8000-000000000004', batch_id: batches[0].id, sap_invoice_number: null, sap_invoice_date: null, status: 'invoice_draft', created_by: USERS.bpo },
    // v2.0
    { id: 'a7000001-0001-4000-8000-000000000005', batch_id: batches[9].id, sap_invoice_number: `${P}-F-2026-0098`, sap_invoice_date: '2026-01-08', status: 'delivered', created_by: USERS.bpo },
    { id: 'a7000001-0001-4000-8000-000000000006', batch_id: batches[10].id, sap_invoice_number: `${P}-F-2026-0345`, sap_invoice_date: '2026-02-08', status: 'platform_required', created_by: USERS.bpo },
    { id: 'a7000001-0001-4000-8000-000000000007', batch_id: batches[6].id, sap_invoice_number: `${P}-F-2026-0289`, sap_invoice_date: '2026-02-07', status: 'platform_required', created_by: USERS.bpo },
    { id: 'a7000001-0001-4000-8000-000000000008', batch_id: batches[11].id, sap_invoice_number: `${P}-F-2026-0312`, sap_invoice_date: '2026-02-05', status: 'platform_completed', created_by: USERS.bpo },
    { id: 'a7000001-0001-4000-8000-000000000009', batch_id: batches[12].id, sap_invoice_number: `${P}-F-2026-0156`, sap_invoice_date: '2026-02-06', status: 'delivered', created_by: USERS.bpo },
  ]
  await upsert('ginv_client_invoices', clientInvoices)

  // ─── 9. DELIVERIES (5) ────────────────────────────────────────────
  const deliveries = [
    { id: 'a8000001-0001-4000-8000-000000000001', client_invoice_id: clientInvoices[0].id, delivery_type: 'email', recipients: JSON.stringify([{ name: 'Jan van der Berg', email: 'invoices@techventures.eu' }]), subject: `${P} Factura F-2026-0234 — Tech Ventures`, body: 'Adjuntamos factura correspondiente.', status: 'sent', sent_at: '2026-02-04T10:30:00Z', sent_by: USERS.bpo },
    { id: 'a8000001-0001-4000-8000-000000000002', client_invoice_id: clientInvoices[1].id, delivery_type: 'email', recipients: JSON.stringify([{ name: 'Carmen Iglesias', email: 'proveedores@bancocooperativo.es' }]), subject: `${P} Factura F-2026-0189 — Banco Cooperativo`, body: 'Adjuntamos factura y justificantes.', status: 'sent', sent_at: '2026-01-31T09:15:00Z', sent_by: USERS.bpo },
    { id: 'a8000001-0001-4000-8000-000000000003', client_invoice_id: clientInvoices[4].id, delivery_type: 'email', recipients: JSON.stringify([{ name: 'Contabilidad CME', email: 'contabilidad@constructoramediterraneo.es' }, { name: 'Ana Martinez', email: 'amartinez@garrigues.com' }, { name: 'Marta Vidal', email: 'mvidal@constructoramediterraneo.es' }]), subject: `${P} Factura F-2026-0098 — Constructora Mediterraneo`, body: 'Adjuntamos factura y justificantes de tasas.', status: 'sent', sent_at: '2026-01-10T09:45:00Z', sent_by: USERS.bpo },
    { id: 'a8000001-0001-4000-8000-000000000004', client_invoice_id: clientInvoices[8].id, delivery_type: 'email', recipients: JSON.stringify([{ name: 'Carmen Lopez', email: 'administracion@humanitasafrica.org' }, { name: 'Ana Martinez', email: 'amartinez@garrigues.com' }]), subject: `${P} Factura F-2026-0156 — Fundacion Humanitas (Pro Bono)`, body: 'Adjuntamos factura pro bono.', status: 'sent', sent_at: '2026-02-06T14:20:00Z', sent_by: USERS.bpo },
    { id: 'a8000001-0001-4000-8000-000000000005', client_invoice_id: clientInvoices[5].id, delivery_type: 'platform', recipients: JSON.stringify([]), subject: null, body: null, status: 'pending', sent_at: null, sent_by: null },
  ]
  await upsert('ginv_deliveries', deliveries)

  // ─── 10. PLATFORM TASKS (8) ───────────────────────────────────────
  const platformTasks = [
    { id: 'a9000001-0001-4000-8000-000000000001', client_invoice_id: clientInvoices[2].id, platform_name: `${P} Ascent`, client_platform_code: 'ERS-ASCENT-4521', invoice_number: 'F-2026-0145', order_number: 'PO-2026-00234', status: 'completed', assigned_to: USERS.bpo, sla_due_at: '2026-01-18T23:59:59Z', completed_at: '2026-01-17T16:00:00Z' },
    { id: 'a9000001-0001-4000-8000-000000000002', client_invoice_id: clientInvoices[0].id, platform_name: `${P} Ariba`, client_platform_code: 'BCR-ARIBA-7890', invoice_number: 'F-2026-0278', order_number: 'REQ-2026-11234', status: 'pending', assigned_to: USERS.bpo, sla_due_at: '2026-02-12T23:59:59Z' },
    { id: 'a9000001-0001-4000-8000-000000000003', client_invoice_id: clientInvoices[0].id, platform_name: `${P} Coupa`, client_platform_code: 'NVP-COUPA-1234', invoice_number: 'F-2026-0312', order_number: 'PO-NVP-2026-0089', status: 'in_progress', assigned_to: USERS.bpo, sla_due_at: '2026-02-10T23:59:59Z' },
    { id: 'a9000001-0001-4000-8000-000000000004', client_invoice_id: clientInvoices[1].id, platform_name: `${P} Tungsten`, client_platform_code: 'TVE-TUNG-5678', invoice_number: 'F-2026-0298', status: 'blocked', assigned_to: USERS.bpo, sla_due_at: '2026-02-08T23:59:59Z', notes: 'Error: PO no encontrada en sistema cliente' },
    { id: 'a9000001-0001-4000-8000-000000000005', client_invoice_id: clientInvoices[5].id, platform_name: `${P} SAP Business Network`, client_platform_code: 'NMC-SAPBN-789012', invoice_number: 'F-2026-0345', order_number: '4500012345', status: 'pending', assigned_to: USERS.bpo, sla_due_at: '2026-02-15T23:59:59Z', notes: 'Primera factura a cliente via SAP BN' },
    { id: 'a9000001-0001-4000-8000-000000000006', client_invoice_id: clientInvoices[6].id, platform_name: `${P} Basware`, client_platform_code: 'MGA-BASWARE-4567', invoice_number: 'F-2026-0289', order_number: 'REQ-2026-0089', status: 'blocked', assigned_to: USERS.bpo, sla_due_at: '2026-02-05T23:59:59Z', notes: 'SLA VENCIDO. Error: PO line amount mismatch.' },
    { id: 'a9000001-0001-4000-8000-000000000007', client_invoice_id: clientInvoices[7].id, platform_name: `${P} Ivalua`, client_platform_code: 'ERS-IVALUA-2345', invoice_number: 'F-2026-0312', order_number: 'PO-ERS-2026-0056', status: 'completed', assigned_to: USERS.bpo, sla_due_at: '2026-02-08T23:59:59Z', completed_at: '2026-02-07T12:00:00Z', evidence_file_path: 'platforms/PLAT-007_confirmation.pdf', notes: 'Subido correctamente 2026-02-07' },
    { id: 'a9000001-0001-4000-8000-000000000008', client_invoice_id: clientInvoices[8].id, platform_name: `${P} Manual/Email`, invoice_number: 'F-2026-0156', status: 'completed', assigned_to: USERS.bpo, completed_at: '2026-02-06T14:20:00Z', notes: 'Entrega manual por email a ONG' },
  ]
  await upsert('ginv_platform_tasks', platformTasks)

  // ─── 11. UTTAI REQUESTS (9) ───────────────────────────────────────
  const uttaiRequests = [
    { id: 'ab000001-0001-4000-8000-000000000001', job_id: J(2), requested_by: USERS.operador, status: 'pending', notes: `${P} Pendiente nuevo certificado beneficiario final` },
    { id: 'ab000001-0001-4000-8000-000000000002', job_id: J(5), requested_by: USERS.operador, status: 'in_progress', notes: `${P} Revision cambio accionarial en curso` },
    { id: 'ab000001-0001-4000-8000-000000000003', job_id: J(2), requested_by: USERS.operador, status: 'resolved', resolved_by: USERS.compliance, resolved_at: '2025-11-25T10:00:00Z', notes: `${P} Documentacion aportada — desbloqueado` },
    { id: 'ab000001-0001-4000-8000-000000000004', job_id: J(11), requested_by: USERS.operador, status: 'resolved', resolved_by: USERS.compliance, resolved_at: '2026-02-09T10:00:00Z', notes: `${P} KYC completa. Cliente aporto estructura societaria y UBOs. Verificado.` },
    { id: 'ab000001-0001-4000-8000-000000000005', job_id: J(9), requested_by: USERS.operador, status: 'pending', notes: `${P} Alerta cambio accionarial: venta 30% a fondo PE. Pendiente verificar UBOs.` },
    { id: 'ab000001-0001-4000-8000-000000000006', job_id: J(1), requested_by: USERS.operador, status: 'resolved', resolved_by: USERS.compliance, resolved_at: '2026-02-08T16:00:00Z', notes: `${P} Falso positivo. Novapharma S.A. distinta de Nova Pharma LLC (Rusia). Verificado.` },
    { id: 'ab000001-0001-4000-8000-000000000007', job_id: J(12), requested_by: USERS.operador, status: 'in_progress', notes: `${P} Traduccion jurada pendiente. Plazo estimado: 2026-02-20.` },
    { id: 'ab000001-0001-4000-8000-000000000008', job_id: J(14), requested_by: USERS.socio, status: 'in_progress', notes: `${P} Escalado a comite compliance. JV compleja, 4 niveles societarios. Proxima reunion: 2026-02-15.` },
    { id: 'ab000001-0001-4000-8000-000000000009', job_id: J(2), requested_by: USERS.socio, status: 'resolved', resolved_by: USERS.compliance, resolved_at: '2026-02-10T10:00:00Z', notes: `${P} Desbloqueo parcial. Revision trimestral obligatoria. Proxima: 2026-05-10.` },
  ]
  await upsert('ginv_uttai_requests', uttaiRequests)

  console.log('  ✓ All 167 records inserted')
}

// ── Step 3: Upload PDFs ──────────────────────────────────────────────
async function uploadPDFs() {
  console.log('\n📄 Uploading real PDFs to Supabase Storage...')

  // Map: { localPath, storagePath }
  const pdfMappings: { local: string; storage: string }[] = []

  // ── v1.0 vendor invoices (20) ──
  const v1VendorInvoices = [
    'GINV-001_PM-2026-0089.pdf', 'GINV-002_SLB-2026-112.pdf',
    'GINV-003_RB-2026-2341.pdf', 'GINV-004_SP-2026-0456.pdf',
    'GINV-005_NPL-2026-0078.pdf', 'GINV-006_CA-2026-0023.pdf',
    'GINV-007_PM-2026-0045.pdf', 'GINV-008_RB-2026-1892.pdf',
    'GINV-009_SP-2026-0501.pdf', 'GINV-010_NPL-2026-0091.pdf',
    'GINV-011_PM-2026-0067.pdf', 'GINV-012_CA-2026-0034.pdf',
    'GINV-017_RB-2026-1678.pdf', 'GINV-018_NPL-2026-0056.pdf',
    'GINV-019_PM-2026-0034.pdf', 'GINV-020_CA-2026-0012.pdf',
    'GINV-021_RB-2026-1590.pdf', 'GINV-022_NPL-2026-0045.pdf',
    'GINV-023_PM-2026-0023.pdf', 'GINV-024_SP-2026-0234.pdf',
  ]
  for (const f of v1VendorInvoices) {
    pdfMappings.push({ local: path.join(V1_DIR, 'vendor_invoices', f), storage: `vendor_invoices/${f}` })
  }

  // ── v1.0 official fees (12) ──
  const v1OfficialFees = [
    'TASA-001_OEPM-2026-001.pdf', 'TASA-002_OEPM-2026-002.pdf',
    'TASA-003_RM-2026-003.pdf', 'TASA-004_TS-2026-004.pdf',
    'TASA-005_EUIPO-2026-005.pdf', 'TASA-006_OEPM-2026-006.pdf',
    'TASA-007_RP-2026-007.pdf', 'TASA-008_AEAT-600-2026-008.pdf',
    'TASA-009_CNMV-2026-009.pdf', 'TASA-010_EPO-2026-010.pdf',
    'TASA-011_RC-2025-011.pdf', 'TASA-012_TSJ-2026-012.pdf',
  ]
  for (const f of v1OfficialFees) {
    pdfMappings.push({ local: path.join(V1_DIR, 'official_fees', f), storage: `official_fees/${f}` })
  }

  // ── v1.0 client invoices (3) ──
  const v1ClientInvoices = [
    'CINV-001_F-2026-0234.pdf', 'CINV-002_F-2026-0189.pdf', 'CINV-003_F-2026-0145.pdf',
  ]
  for (const f of v1ClientInvoices) {
    pdfMappings.push({ local: path.join(V1_DIR, 'client_invoices', f), storage: `client_invoices/${f}` })
  }

  // ── v1.0 compliance docs (5) ──
  const v1ComplianceDocs = [
    { file: 'VDOC-001_PatentMax_GmbH.pdf', storage: 'VDOC-001_PatentMax_GmbH.pdf' },
    { file: 'VDOC-002_Sullivan_and_Partners_LLP.pdf', storage: 'VDOC-002_Sullivan_and_Partners_LLP.pdf' },
    { file: 'VDOC-003_Chen_and_Associates_\u9648\u5f8b\u5e08\u4e8b\u52a1\u6240.pdf', storage: 'VDOC-003_Chen_and_Associates.pdf' },
    { file: 'VDOC-004_Chen_and_Associates_\u9648\u5f8b\u5e08\u4e8b\u52a1\u6240.pdf', storage: 'VDOC-004_Chen_and_Associates.pdf' },
    { file: 'VDOC-005_Studio_Legale_Bianchi.pdf', storage: 'VDOC-005_Studio_Legale_Bianchi.pdf' },
  ]
  for (const { file, storage } of v1ComplianceDocs) {
    pdfMappings.push({ local: path.join(V1_DIR, 'compliance_docs', file), storage: `compliance_docs/${storage}` })
  }

  // ── v2.0 vendor invoices (18) ──
  const v2VendorInvoices = [
    'GINV-025_MB-2026-0089.pdf', 'GINV-026_TY-2026-0034.pdf',
    'GINV-027_HTA-2026-0012.pdf', 'GINV-028_SF-2026-0023.pdf',
    'GINV-029_SIA-2026-0078.pdf', 'GINV-030_ARL-2026-0034.pdf',
    'GINV-034_TY-2026-0045.pdf', 'GINV-034-R1_TY-2026-0045-R1.pdf',
    'GINV-035_SIA-2026-0078.pdf', 'GINV-036_SF-2026-0023.pdf',
    'GINV-037_MB-2026-0112.pdf', 'GINV-038_ARL-2026-0034.pdf',
    'GINV-039_MB-2026-0134.pdf', 'GINV-040_SIA-2026-0089.pdf',
    'GINV-041_HTA-2026-0023.pdf', 'GINV-042_NPL-2026-0123.pdf',
    'GINV-043_RB-2026-2456.pdf', 'GINV-044_PM-2026-0123.pdf',
  ]
  for (const f of v2VendorInvoices) {
    pdfMappings.push({ local: path.join(V2_DIR, 'vendor_invoices', f), storage: `vendor_invoices/${f}` })
  }

  // ── v2.0 official fees (6) ──
  const v2OfficialFees = [
    'TASA-013_USPTO-2026-013.pdf', 'TASA-014_JPO-2026-014.pdf',
    'TASA-015_IPI-2026-015.pdf', 'TASA-016_INTM-2026-016.pdf',
    'TASA-017_INPI-2026-017.pdf', 'TASA-018_DGT-2026-018.pdf',
  ]
  for (const f of v2OfficialFees) {
    pdfMappings.push({ local: path.join(V2_DIR, 'official_fees', f), storage: `official_fees/${f}` })
  }

  // ── v2.0 client invoices (5) ──
  const v2ClientInvoices = [
    'CINV-004_F-2026-0098.pdf', 'CINV-005_F-2026-0345.pdf',
    'CINV-006_F-2026-0289.pdf', 'CINV-007_F-2026-0312.pdf',
    'CINV-008_F-2026-0156.pdf',
  ]
  for (const f of v2ClientInvoices) {
    pdfMappings.push({ local: path.join(V2_DIR, 'client_invoices', f), storage: `client_invoices/${f}` })
  }

  console.log(`  Total PDFs to upload: ${pdfMappings.length}`)

  let uploaded = 0
  let skipped = 0

  for (const { local, storage } of pdfMappings) {
    if (!fs.existsSync(local)) {
      console.warn(`  ⚠ Missing: ${local}`)
      skipped++
      continue
    }

    const fileBuffer = fs.readFileSync(local)
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storage, fileBuffer, { contentType: 'application/pdf', upsert: true })

    if (error) {
      console.warn(`  ⚠ Upload failed ${storage}: ${error.message}`)
      skipped++
    } else {
      uploaded++
    }
  }

  console.log(`  ✓ ${uploaded} PDFs uploaded, ${skipped} skipped`)
}

// ── Step 4: Link PDFs to DB records ──────────────────────────────────
async function linkPDFsToRecords() {
  console.log('\n🔗 Linking PDFs to DB records...')

  // ── Intake items → file_path ──
  // Map intake item ID → storage path (vendor_invoices/ or official_fees/)
  const intakeFilePaths: Record<string, string> = {
    // v1.0 vendor invoices
    'd0000001-0001-4000-8000-000000000001': 'vendor_invoices/GINV-001_PM-2026-0089.pdf',
    'd0000001-0001-4000-8000-000000000002': 'vendor_invoices/GINV-002_SLB-2026-112.pdf',
    'd0000001-0001-4000-8000-000000000003': 'vendor_invoices/GINV-003_RB-2026-2341.pdf',
    'd0000001-0001-4000-8000-000000000004': 'vendor_invoices/GINV-004_SP-2026-0456.pdf',
    'd0000001-0001-4000-8000-000000000005': 'vendor_invoices/GINV-005_NPL-2026-0078.pdf',
    'd0000001-0001-4000-8000-000000000007': 'vendor_invoices/GINV-007_PM-2026-0045.pdf',
    'd0000001-0001-4000-8000-000000000008': 'vendor_invoices/GINV-008_RB-2026-1892.pdf',
    'd0000001-0001-4000-8000-000000000009': 'vendor_invoices/GINV-009_SP-2026-0501.pdf',
    'd0000001-0001-4000-8000-000000000010': 'vendor_invoices/GINV-010_NPL-2026-0091.pdf',
    'd0000001-0001-4000-8000-000000000011': 'vendor_invoices/GINV-011_PM-2026-0067.pdf',
    'd0000001-0001-4000-8000-000000000012': 'vendor_invoices/GINV-012_CA-2026-0034.pdf',
    'd0000001-0001-4000-8000-000000000017': 'vendor_invoices/GINV-017_RB-2026-1678.pdf',
    'd0000001-0001-4000-8000-000000000018': 'vendor_invoices/GINV-018_NPL-2026-0056.pdf',
    'd0000001-0001-4000-8000-000000000019': 'vendor_invoices/GINV-019_PM-2026-0034.pdf',
    'd0000001-0001-4000-8000-000000000020': 'vendor_invoices/GINV-020_CA-2026-0012.pdf',
    'd0000001-0001-4000-8000-000000000021': 'vendor_invoices/GINV-021_RB-2026-1590.pdf',
    'd0000001-0001-4000-8000-000000000022': 'vendor_invoices/GINV-022_NPL-2026-0045.pdf',
    // v1.0 official fees
    'd0000001-0001-4000-8000-000000000030': 'official_fees/TASA-001_OEPM-2026-001.pdf',
    'd0000001-0001-4000-8000-0000000000b1': 'official_fees/TASA-002_OEPM-2026-002.pdf',
    'd0000001-0001-4000-8000-0000000000b2': 'official_fees/TASA-003_RM-2026-003.pdf',
    'd0000001-0001-4000-8000-0000000000b3': 'official_fees/TASA-006_OEPM-2026-006.pdf',
    'd0000001-0001-4000-8000-0000000000a7': 'official_fees/TASA-007_RP-2026-007.pdf',
    'd0000001-0001-4000-8000-000000000035': 'official_fees/TASA-010_EPO-2026-010.pdf',
    // v2.0 vendor invoices
    'd0000001-0001-4000-8000-000000000025': 'vendor_invoices/GINV-027_HTA-2026-0012.pdf',
    'd0000001-0001-4000-8000-000000000026': 'vendor_invoices/GINV-025_MB-2026-0089.pdf',
    'd0000001-0001-4000-8000-000000000027': 'vendor_invoices/GINV-030_ARL-2026-0034.pdf',
    'd0000001-0001-4000-8000-000000000028': 'vendor_invoices/GINV-028_SF-2026-0023.pdf',
    'd0000001-0001-4000-8000-000000000029': 'vendor_invoices/GINV-029_SIA-2026-0078.pdf',
    'd0000001-0001-4000-8000-0000000000a0': 'vendor_invoices/GINV-026_TY-2026-0034.pdf',
    'd0000001-0001-4000-8000-000000000034': 'vendor_invoices/GINV-034_TY-2026-0045.pdf',
    'd0000001-0001-4000-8000-000000000134': 'vendor_invoices/GINV-034-R1_TY-2026-0045-R1.pdf',
    'd0000001-0001-4000-8000-0000000000a1': 'vendor_invoices/GINV-035_SIA-2026-0078.pdf',
    'd0000001-0001-4000-8000-000000000036': 'vendor_invoices/GINV-036_SF-2026-0023.pdf',
    'd0000001-0001-4000-8000-000000000037': 'vendor_invoices/GINV-037_MB-2026-0112.pdf',
    'd0000001-0001-4000-8000-000000000038': 'vendor_invoices/GINV-038_ARL-2026-0034.pdf',
    'd0000001-0001-4000-8000-000000000039': 'vendor_invoices/GINV-039_MB-2026-0134.pdf',
    'd0000001-0001-4000-8000-000000000040': 'vendor_invoices/GINV-040_SIA-2026-0089.pdf',
    'd0000001-0001-4000-8000-000000000041': 'vendor_invoices/GINV-041_HTA-2026-0023.pdf',
    'd0000001-0001-4000-8000-000000000042': 'vendor_invoices/GINV-042_NPL-2026-0123.pdf',
    'd0000001-0001-4000-8000-000000000043': 'vendor_invoices/GINV-043_RB-2026-2456.pdf',
    'd0000001-0001-4000-8000-000000000044': 'vendor_invoices/GINV-044_PM-2026-0123.pdf',
    // v2.0 official fees
    'd0000001-0001-4000-8000-000000000045': 'official_fees/TASA-013_USPTO-2026-013.pdf',
    'd0000001-0001-4000-8000-000000000046': 'official_fees/TASA-014_JPO-2026-014.pdf',
    'd0000001-0001-4000-8000-000000000047': 'official_fees/TASA-015_IPI-2026-015.pdf',
    'd0000001-0001-4000-8000-000000000048': 'official_fees/TASA-016_INTM-2026-016.pdf',
    'd0000001-0001-4000-8000-000000000049': 'official_fees/TASA-017_INPI-2026-017.pdf',
    'd0000001-0001-4000-8000-000000000050': 'official_fees/TASA-018_DGT-2026-018.pdf',
  }

  let linked = 0
  for (const [id, filePath] of Object.entries(intakeFilePaths)) {
    const { error } = await supabase
      .from('ginv_intake_items')
      .update({ file_path: filePath })
      .eq('id', id)
    if (error) {
      console.warn(`  ⚠ intake_items ${id}: ${error.message}`)
    } else {
      linked++
    }
  }
  console.log(`  ✓ ${linked} intake items linked to PDFs`)

  // ── Vendor documents → file_path (v1.0 compliance docs) ──
  const vendorDocPaths: Record<string, string> = {
    'c0000001-0001-4000-8000-000000000001': 'compliance_docs/VDOC-001_PatentMax_GmbH.pdf',
    'c0000001-0001-4000-8000-000000000002': 'compliance_docs/VDOC-002_Sullivan_and_Partners_LLP.pdf',
    'c0000001-0001-4000-8000-000000000003': 'compliance_docs/VDOC-003_Chen_and_Associates.pdf',
    'c0000001-0001-4000-8000-000000000004': 'compliance_docs/VDOC-004_Chen_and_Associates.pdf',
    'c0000001-0001-4000-8000-000000000005': 'compliance_docs/VDOC-005_Studio_Legale_Bianchi.pdf',
  }

  let vendorLinked = 0
  for (const [id, filePath] of Object.entries(vendorDocPaths)) {
    const { error } = await supabase
      .from('ginv_vendor_documents')
      .update({ file_path: filePath })
      .eq('id', id)
    if (error) {
      console.warn(`  ⚠ vendor_documents ${id}: ${error.message}`)
    } else {
      vendorLinked++
    }
  }
  console.log(`  ✓ ${vendorLinked} vendor documents linked to PDFs`)

  // ── Client invoices → pdf_file_path ──
  const clientInvoicePaths: Record<string, string> = {
    'a7000001-0001-4000-8000-000000000001': 'client_invoices/CINV-001_F-2026-0234.pdf',
    'a7000001-0001-4000-8000-000000000002': 'client_invoices/CINV-002_F-2026-0189.pdf',
    'a7000001-0001-4000-8000-000000000003': 'client_invoices/CINV-003_F-2026-0145.pdf',
    'a7000001-0001-4000-8000-000000000005': 'client_invoices/CINV-004_F-2026-0098.pdf',
    'a7000001-0001-4000-8000-000000000006': 'client_invoices/CINV-005_F-2026-0345.pdf',
    'a7000001-0001-4000-8000-000000000007': 'client_invoices/CINV-006_F-2026-0289.pdf',
    'a7000001-0001-4000-8000-000000000008': 'client_invoices/CINV-007_F-2026-0312.pdf',
    'a7000001-0001-4000-8000-000000000009': 'client_invoices/CINV-008_F-2026-0156.pdf',
  }

  let invoiceLinked = 0
  for (const [id, filePath] of Object.entries(clientInvoicePaths)) {
    const { error } = await supabase
      .from('ginv_client_invoices')
      .update({ pdf_file_path: filePath })
      .eq('id', id)
    if (error) {
      console.warn(`  ⚠ client_invoices ${id}: ${error.message}`)
    } else {
      invoiceLinked++
    }
  }
  console.log(`  ✓ ${invoiceLinked} client invoices linked to PDFs`)
}

// ── Step 5: Verify ───────────────────────────────────────────────────
async function verify() {
  console.log('\n🔍 Verifying...')

  const tables = [
    'ginv_jobs', 'ginv_vendors', 'ginv_vendor_documents',
    'ginv_intake_items', 'ginv_sap_postings', 'ginv_billing_batches',
    'ginv_billing_batch_items', 'ginv_client_invoices', 'ginv_deliveries',
    'ginv_platform_tasks', 'ginv_uttai_requests',
  ]
  const expected = [14, 13, 15, 52, 14, 13, 15, 9, 5, 8, 9]

  let total = 0
  for (let i = 0; i < tables.length; i++) {
    const { count } = await supabase.from(tables[i]).select('*', { count: 'exact', head: true })
    const c = count ?? 0
    total += c
    const status = c === expected[i] ? '✓' : '✗'
    console.log(`  ${status} ${tables[i]}: ${c} (expected ${expected[i]})`)
  }
  console.log(`  Total records: ${total} (expected 167)`)

  // Check storage
  let storageCount = 0
  for (const folder of ['vendor_invoices', 'official_fees', 'client_invoices', 'compliance_docs']) {
    const { data: files } = await supabase.storage.from(BUCKET).list(folder)
    storageCount += files?.length ?? 0
  }
  console.log(`  Storage PDFs: ${storageCount} (expected 69)`)

  // Check file_path linkage
  const { count: linkedIntake } = await supabase
    .from('ginv_intake_items')
    .select('*', { count: 'exact', head: true })
    .not('file_path', 'is', null)
  console.log(`  Intake items with file_path: ${linkedIntake ?? 0}`)

  const { count: linkedInvoices } = await supabase
    .from('ginv_client_invoices')
    .select('*', { count: 'exact', head: true })
    .not('pdf_file_path', 'is', null)
  console.log(`  Client invoices with pdf_file_path: ${linkedInvoices ?? 0}`)
}

// ── Helper: upsert with error handling ───────────────────────────────
async function upsert(table: string, rows: Record<string, unknown>[]) {
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })
  if (error) {
    console.error(`  ✗ ${table}: ${error.message}`)
    throw new Error(`Insert failed for ${table}`)
  }
  console.log(`  ✓ ${table}: ${rows.length} rows`)
}

// ── MAIN ─────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  LIQUIDA360 — G-Invoice Demo Seed')
  console.log('═══════════════════════════════════════════')

  const USERS = await resolveDemoUsers()
  await cleanupAll()
  await insertData(USERS)
  await uploadPDFs()
  await linkPDFsToRecords()
  await verify()

  console.log('\n🎉 G-Invoice demo seed complete!')
}

main().catch((err) => {
  console.error('\n💥 Fatal:', err.message || err)
  process.exit(1)
})
