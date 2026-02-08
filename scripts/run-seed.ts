/**
 * LIQUIDA360 - Seed runner
 * Executes seed.sql logic via Supabase JS client (service_role).
 * Usage: npx tsx scripts/run-seed.ts
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vrzmkxjvzjphdeshmmzl.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Deterministic UUIDs
const CORRESPONDENTS = {
  MX: 'a1000000-0000-0000-0000-000000000001',
  CL: 'a1000000-0000-0000-0000-000000000002',
  CN: 'a1000000-0000-0000-0000-000000000003',
  US: 'a1000000-0000-0000-0000-000000000004',
  CO: 'a1000000-0000-0000-0000-000000000005',
}

const CERTIFICATES = {
  MX: 'b1000000-0000-0000-0000-000000000001',
  CL: 'b1000000-0000-0000-0000-000000000002',
  CN: 'b1000000-0000-0000-0000-000000000003',
  US: 'b1000000-0000-0000-0000-000000000004',
  CO: 'b1000000-0000-0000-0000-000000000005',
}

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function daysAgo(days: number): string {
  return daysFromNow(-days)
}

async function main() {
  console.log('🗑️  Cleaning existing data...')

  // Delete in FK order
  await supabase.from('audit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('payment_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('liquidations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('certificates').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('correspondents').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('✅ Data cleaned')

  // ── 1. Insert correspondents ──
  console.log('📌 Inserting 5 correspondents...')
  const { error: corrErr } = await supabase.from('correspondents').insert([
    {
      id: CORRESPONDENTS.MX,
      name: 'Bufete Rodriguez & Asociados S.C.',
      country: 'MX',
      tax_id: 'ROAM850312QX7',
      address: 'Av. Reforma 505, Col. Cuauhtemoc, CDMX 06500, Mexico',
      email: 'contacto@bufeterodriguez.mx',
      phone: '+52 55 1234 5678',
      status: 'active',
    },
    {
      id: CORRESPONDENTS.CL,
      name: 'Estudio Juridico Pacifico SpA',
      country: 'CL',
      tax_id: '76.543.210-K',
      address: 'Av. Providencia 1234, Of. 501, Santiago, Chile',
      email: 'info@ejpacifico.cl',
      phone: '+56 2 9876 5432',
      status: 'active',
    },
    {
      id: CORRESPONDENTS.CN,
      name: 'Zhu & Partners Law Firm',
      country: 'CN',
      tax_id: '91310000MA1K4LXX3J',
      address: '88 Century Avenue, Floor 32, Pudong, Shanghai 200120, China',
      email: 'contact@zhupartners.cn',
      phone: '+86 21 5888 9999',
      status: 'active',
    },
    {
      id: CORRESPONDENTS.US,
      name: 'Thompson & Reed LLP',
      country: 'US',
      tax_id: '84-3456789',
      address: '745 Fifth Avenue, Suite 2100, New York, NY 10151, USA',
      email: 'info@thompsonreed.com',
      phone: '+1 212 555 0199',
      status: 'active',
    },
    {
      id: CORRESPONDENTS.CO,
      name: 'Mendoza Arias & Cia. S.A.S.',
      country: 'CO',
      tax_id: '900.876.543-1',
      address: 'Carrera 7 No. 71-52, Torre B, Of. 1201, Bogota, Colombia',
      email: 'administracion@mendozaarias.co',
      phone: '+57 601 345 6789',
      status: 'active',
    },
  ])
  if (corrErr) { console.error('❌ correspondents:', corrErr.message); process.exit(1) }
  console.log('✅ 5 correspondents inserted')

  // ── 2. Insert certificates ──
  console.log('📌 Inserting 5 certificates...')
  const { error: certErr } = await supabase.from('certificates').insert([
    {
      id: CERTIFICATES.MX,
      correspondent_id: CORRESPONDENTS.MX,
      issuing_country: 'MX',
      issue_date: daysAgo(330),
      expiry_date: daysFromNow(395),
      status: 'valid',
    },
    {
      id: CERTIFICATES.CL,
      correspondent_id: CORRESPONDENTS.CL,
      issuing_country: 'CL',
      issue_date: daysAgo(210),
      expiry_date: daysFromNow(135),
      status: 'valid',
    },
    {
      id: CERTIFICATES.CN,
      correspondent_id: CORRESPONDENTS.CN,
      issuing_country: 'CN',
      issue_date: daysAgo(150),
      expiry_date: daysFromNow(210),
      status: 'valid',
    },
    {
      id: CERTIFICATES.US,
      correspondent_id: CORRESPONDENTS.US,
      issuing_country: 'US',
      issue_date: daysAgo(340),
      expiry_date: daysFromNow(25),
      status: 'expiring_soon',
    },
    {
      id: CERTIFICATES.CO,
      correspondent_id: CORRESPONDENTS.CO,
      issuing_country: 'CO',
      issue_date: daysAgo(450),
      expiry_date: daysAgo(85),
      status: 'expired',
    },
  ])
  if (certErr) { console.error('❌ certificates:', certErr.message); process.exit(1) }
  console.log('✅ 5 certificates inserted')

  // ── 3. Find admin user ──
  console.log('🔍 Looking for admin user...')
  const { data: usersData } = await supabase.auth.admin.listUsers()
  const users = usersData?.users || []
  const adminUser = users.find((u) => u.app_metadata?.role === 'admin') || users[0]
  if (!adminUser) {
    console.error('❌ No users found in auth.users. Create at least one user first.')
    process.exit(1)
  }
  const adminId = adminUser.id
  const supervisorUser = users.find((u) => u.app_metadata?.role === 'supervisor')
  const supervisorId = supervisorUser?.id || adminId
  console.log(`✅ Using admin: ${adminUser.email} (${adminId})`)

  // ── 4. Insert liquidations ──
  console.log('📌 Inserting 20 liquidations...')

  const liquidations = [
    // Mexico (4)
    { id: 'c1000000-0000-0000-0000-000000000001', correspondent_id: CORRESPONDENTS.MX, certificate_id: CERTIFICATES.MX, amount: 45000, currency: 'MXN', concept: 'Due diligence - Adquisicion inmobiliaria Queretaro', reference: 'BRAR-2025-0089', status: 'approved', created_by: adminId, approved_by: supervisorId },
    { id: 'c1000000-0000-0000-0000-000000000002', correspondent_id: CORRESPONDENTS.MX, certificate_id: CERTIFICATES.MX, amount: 78500, currency: 'MXN', concept: 'Asesoria fiscal - Reestructuracion corporativa', reference: 'BRAR-2025-0102', status: 'pending_approval', created_by: adminId },
    { id: 'c1000000-0000-0000-0000-000000000003', correspondent_id: CORRESPONDENTS.MX, amount: 125000, currency: 'MXN', concept: 'Litigio comercial - Honorarios Q4 2025', reference: 'BRAR-2025-0118', status: 'draft', created_by: adminId },
    { id: 'c1000000-0000-0000-0000-000000000004', correspondent_id: CORRESPONDENTS.MX, certificate_id: CERTIFICATES.MX, amount: 32000, currency: 'USD', concept: 'Constitucion de sociedad - Fintech Mexico', reference: 'BRAR-2026-0003', status: 'paid', created_by: adminId, approved_by: supervisorId },
    // Chile (4)
    { id: 'c1000000-0000-0000-0000-000000000005', correspondent_id: CORRESPONDENTS.CL, certificate_id: CERTIFICATES.CL, amount: 18500, currency: 'USD', concept: 'Arbitraje internacional - Caso minero Atacama', reference: 'EJP-2025-ARB-044', status: 'paid', created_by: adminId, approved_by: supervisorId },
    { id: 'c1000000-0000-0000-0000-000000000006', correspondent_id: CORRESPONDENTS.CL, certificate_id: CERTIFICATES.CL, amount: 42000000, currency: 'CLP', concept: 'M&A advisory - Fusion cadena retail', reference: 'EJP-2025-MA-007', status: 'payment_requested', created_by: adminId, approved_by: supervisorId },
    { id: 'c1000000-0000-0000-0000-000000000007', correspondent_id: CORRESPONDENTS.CL, certificate_id: CERTIFICATES.CL, amount: 15750000, currency: 'CLP', concept: 'Compliance y gobierno corporativo 2025', reference: 'EJP-2025-COMP-012', status: 'approved', created_by: adminId, approved_by: supervisorId },
    { id: 'c1000000-0000-0000-0000-000000000008', correspondent_id: CORRESPONDENTS.CL, certificate_id: CERTIFICATES.CL, amount: 8200000, currency: 'CLP', concept: 'Defensa laboral colectiva - Sector salmon', reference: 'EJP-2026-LAB-001', status: 'pending_approval', created_by: adminId },
    // China (4)
    { id: 'c1000000-0000-0000-0000-000000000009', correspondent_id: CORRESPONDENTS.CN, certificate_id: CERTIFICATES.CN, amount: 85000, currency: 'USD', concept: 'M&A transfronterizo - Proveedor automotriz aleman', reference: 'ZP-2025-INTL-0034', status: 'paid', created_by: adminId, approved_by: supervisorId },
    { id: 'c1000000-0000-0000-0000-000000000010', correspondent_id: CORRESPONDENTS.CN, certificate_id: CERTIFICATES.CN, amount: 38000, currency: 'USD', concept: 'Registro PI - 47 marcas Greater China', reference: 'ZP-2025-IP-0089', status: 'approved', created_by: adminId, approved_by: supervisorId },
    { id: 'c1000000-0000-0000-0000-000000000011', correspondent_id: CORRESPONDENTS.CN, certificate_id: CERTIFICATES.CN, amount: 52000, currency: 'USD', concept: 'Compliance inversion extranjera - WFOE Suzhou', reference: 'ZP-2026-FDI-0002', status: 'payment_requested', created_by: adminId, approved_by: supervisorId },
    { id: 'c1000000-0000-0000-0000-000000000012', correspondent_id: CORRESPONDENTS.CN, amount: 120000, currency: 'USD', concept: 'Resolucion de disputas - CIETAC Beijing', reference: 'ZP-2026-ARB-0001', status: 'draft', created_by: adminId },
    // USA (4)
    { id: 'c1000000-0000-0000-0000-000000000013', correspondent_id: CORRESPONDENTS.US, certificate_id: CERTIFICATES.US, amount: 175000, currency: 'USD', concept: 'Litigio de valores - Sector biotech', reference: 'TR-2025-LIT-0456', status: 'paid', created_by: adminId, approved_by: supervisorId },
    { id: 'c1000000-0000-0000-0000-000000000014', correspondent_id: CORRESPONDENTS.US, certificate_id: CERTIFICATES.US, amount: 95000, currency: 'USD', concept: 'Reestructuracion corporativa - Chapter 11 advisory', reference: 'TR-2025-REST-0078', status: 'approved', created_by: adminId, approved_by: supervisorId },
    { id: 'c1000000-0000-0000-0000-000000000015', correspondent_id: CORRESPONDENTS.US, amount: 28500, currency: 'USD', concept: 'Inmigracion - Procesamiento visados H-1B y L-1 Q1', reference: 'TR-2026-IMM-0012', status: 'pending_approval', created_by: adminId },
    { id: 'c1000000-0000-0000-0000-000000000016', correspondent_id: CORRESPONDENTS.US, amount: 45000, currency: 'USD', concept: 'Inmobiliario - Arrendamiento comercial Manhattan', reference: 'TR-2026-RE-0004', status: 'draft', created_by: adminId },
    // Colombia (4)
    { id: 'c1000000-0000-0000-0000-000000000017', correspondent_id: CORRESPONDENTS.CO, certificate_id: CERTIFICATES.CO, amount: 45000000, currency: 'COP', concept: 'Litigio administrativo - Superintendencia', reference: 'MAC-2025-ADM-0234', status: 'paid', created_by: adminId, approved_by: supervisorId },
    { id: 'c1000000-0000-0000-0000-000000000018', correspondent_id: CORRESPONDENTS.CO, amount: 72000000, currency: 'COP', concept: 'Due diligence - Planta manufacturera Medellin', reference: 'MAC-2025-DD-0067', status: 'rejected', created_by: adminId },
    { id: 'c1000000-0000-0000-0000-000000000019', correspondent_id: CORRESPONDENTS.CO, amount: 38500000, currency: 'COP', concept: 'Asesoria tributaria - Planificacion fiscal 2026', reference: 'MAC-2026-TAX-0001', status: 'draft', created_by: adminId },
    { id: 'c1000000-0000-0000-0000-000000000020', correspondent_id: CORRESPONDENTS.CO, amount: 22000000, currency: 'COP', concept: 'Propiedad intelectual - Registro marca andina', reference: 'MAC-2026-PI-0003', status: 'draft', created_by: adminId },
  ]

  const { error: liqErr } = await supabase.from('liquidations').insert(liquidations)
  if (liqErr) { console.error('❌ liquidations:', liqErr.message); process.exit(1) }
  console.log('✅ 20 liquidations inserted')

  // ── 5. Insert payment requests ──
  console.log('📌 Inserting payment requests...')

  const now = new Date()
  const paymentRequests = [
    // MX-004: PAID
    { id: 'd1000000-0000-0000-0000-000000000001', liquidation_id: 'c1000000-0000-0000-0000-000000000004', status: 'paid', requested_at: new Date(now.getTime() - 30 * 86400000).toISOString(), processed_at: new Date(now.getTime() - 25 * 86400000).toISOString(), processed_by: supervisorId, notes: 'Pago procesado via transferencia SWIFT' },
    // CL-001: PAID
    { id: 'd1000000-0000-0000-0000-000000000002', liquidation_id: 'c1000000-0000-0000-0000-000000000005', status: 'paid', requested_at: new Date(now.getTime() - 45 * 86400000).toISOString(), processed_at: new Date(now.getTime() - 40 * 86400000).toISOString(), processed_by: supervisorId, notes: 'Pago procesado en USD via corresponsal bancario' },
    // CL-002: PENDING (payment_requested)
    { id: 'd1000000-0000-0000-0000-000000000003', liquidation_id: 'c1000000-0000-0000-0000-000000000006', status: 'pending', requested_at: new Date(now.getTime() - 5 * 86400000).toISOString(), notes: 'Pendiente procesamiento - Importe elevado requiere autorizacion adicional' },
    // CN-001: PAID
    { id: 'd1000000-0000-0000-0000-000000000004', liquidation_id: 'c1000000-0000-0000-0000-000000000009', status: 'paid', requested_at: new Date(now.getTime() - 60 * 86400000).toISOString(), processed_at: new Date(now.getTime() - 55 * 86400000).toISOString(), processed_by: supervisorId, notes: 'Pago procesado via SWIFT a cuenta Shanghai' },
    // CN-003: PENDING (payment_requested)
    { id: 'd1000000-0000-0000-0000-000000000005', liquidation_id: 'c1000000-0000-0000-0000-000000000011', status: 'pending', requested_at: new Date(now.getTime() - 3 * 86400000).toISOString(), notes: 'En tramite - Verificacion compliance inversion extranjera' },
    // US-001: PAID
    { id: 'd1000000-0000-0000-0000-000000000006', liquidation_id: 'c1000000-0000-0000-0000-000000000013', status: 'paid', requested_at: new Date(now.getTime() - 90 * 86400000).toISOString(), processed_at: new Date(now.getTime() - 85 * 86400000).toISOString(), processed_by: supervisorId, notes: 'Pago procesado via ACH a cuenta New York' },
    // CO-001: PAID
    { id: 'd1000000-0000-0000-0000-000000000007', liquidation_id: 'c1000000-0000-0000-0000-000000000017', status: 'paid', requested_at: new Date(now.getTime() - 120 * 86400000).toISOString(), processed_at: new Date(now.getTime() - 115 * 86400000).toISOString(), processed_by: supervisorId, notes: 'Pago procesado via transferencia a cuenta Bogota' },
  ]

  const { error: payErr } = await supabase.from('payment_requests').insert(paymentRequests)
  if (payErr) { console.error('❌ payment_requests:', payErr.message); process.exit(1) }
  console.log('✅ 7 payment requests inserted')

  // ── Verify ──
  const { count: corrCount } = await supabase.from('correspondents').select('*', { count: 'exact', head: true })
  const { count: certCount } = await supabase.from('certificates').select('*', { count: 'exact', head: true })
  const { count: liqCount } = await supabase.from('liquidations').select('*', { count: 'exact', head: true })
  const { count: payCount } = await supabase.from('payment_requests').select('*', { count: 'exact', head: true })

  console.log('\n🎉 Seed complete!')
  console.log(`   Correspondents: ${corrCount}`)
  console.log(`   Certificates:   ${certCount}`)
  console.log(`   Liquidations:   ${liqCount}`)
  console.log(`   Payments:       ${payCount}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
