/**
 * LIQUIDA360 - Seed Notifications
 * Populates the notifications table with realistic data for all demo users.
 * Coherent with existing seed data (correspondents, certificates, liquidations, payments).
 *
 * Usage: npx tsx scripts/seed-notifications.ts
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

// ── Deterministic IDs from run-seed.ts ──
const CERT = {
  MX: 'b1000000-0000-0000-0000-000000000001',
  CL: 'b1000000-0000-0000-0000-000000000002',
  CN: 'b1000000-0000-0000-0000-000000000003',
  US: 'b1000000-0000-0000-0000-000000000004',
  CO: 'b1000000-0000-0000-0000-000000000005',
}

const LIQ = {
  MX_001: 'c1000000-0000-0000-0000-000000000001', // Due diligence Queretaro - approved
  MX_004: 'c1000000-0000-0000-0000-000000000004', // Constitución Fintech - paid
  CL_001: 'c1000000-0000-0000-0000-000000000005', // Arbitraje minero - paid
  CL_002: 'c1000000-0000-0000-0000-000000000006', // M&A fusion retail - payment_requested
  CL_003: 'c1000000-0000-0000-0000-000000000007', // Compliance gobierno - approved
  CN_001: 'c1000000-0000-0000-0000-000000000009', // M&A transfronterizo - paid
  CN_002: 'c1000000-0000-0000-0000-000000000010', // Registro PI - approved
  CN_003: 'c1000000-0000-0000-0000-000000000011', // Compliance WFOE - payment_requested
  US_001: 'c1000000-0000-0000-0000-000000000013', // Litigio biotech - paid
  US_002: 'c1000000-0000-0000-0000-000000000014', // Reestructuración Ch11 - approved
  CO_001: 'c1000000-0000-0000-0000-000000000017', // Litigio administrativo - paid
  CO_002: 'c1000000-0000-0000-0000-000000000018', // Due diligence Medellín - rejected
}

const PAY = {
  MX_004: 'd1000000-0000-0000-0000-000000000001',
  CL_001: 'd1000000-0000-0000-0000-000000000002',
  CL_002: 'd1000000-0000-0000-0000-000000000003',
  CN_001: 'd1000000-0000-0000-0000-000000000004',
  CN_003: 'd1000000-0000-0000-0000-000000000005',
  US_001: 'd1000000-0000-0000-0000-000000000006',
  CO_001: 'd1000000-0000-0000-0000-000000000007',
}

// ── Helpers ──
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600000).toISOString()
}

function daysAgo(days: number): string {
  return hoursAgo(days * 24)
}

interface NotificationSeed {
  user_id: string
  type: string
  title: string
  message: string
  related_entity_type: string
  related_entity_id: string
  read: boolean
  read_at: string | null
  created_at: string
}

function n(
  userId: string,
  type: string,
  title: string,
  message: string,
  entityType: string,
  entityId: string,
  read: boolean,
  createdAt: string,
): NotificationSeed {
  return {
    user_id: userId,
    type,
    title,
    message,
    related_entity_type: entityType,
    related_entity_id: entityId,
    read,
    read_at: read ? hoursAgo(1) : null,
    created_at: createdAt,
  }
}

async function main() {
  console.log('🔔 LIQUIDA360 - Seed Notifications')
  console.log('')

  // ── 1. Get user IDs ──
  const { data } = await supabase.auth.admin.listUsers({ perPage: 200 })
  const users = data?.users || []

  const byEmail: Record<string, string> = {}
  for (const u of users) {
    if (u.email) byEmail[u.email] = u.id
  }

  const adminId = byEmail['admin@liquida360.demo']
  const supervisorId = byEmail['supervisor@liquida360.demo']
  const pagadorId = byEmail['pagador@liquida360.demo']
  const financieroId = byEmail['financiero@liquida360.demo']
  const corrMX = byEmail['corresponsal.mx@test.liquida360.com']
  const corrCL = byEmail['corresponsal.cl@test.liquida360.com']
  const corrCN = byEmail['corresponsal.cn@test.liquida360.com']
  const corrUS = byEmail['corresponsal.us@test.liquida360.com']
  const corrCO = byEmail['corresponsal.co@test.liquida360.com']

  if (!adminId || !supervisorId || !pagadorId || !financieroId) {
    console.error('❌ Missing internal demo users. Run seed-users.ts first.')
    process.exit(1)
  }

  console.log('✅ Found all user IDs')

  // ── 2. Clean existing notifications ──
  await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  console.log('🗑️  Cleaned existing notifications')

  // ── 3. Build notifications ──
  const all: NotificationSeed[] = []

  // ────────────────────────────────────────────
  // ADMIN + SUPERVISOR: Certificate alerts
  // ────────────────────────────────────────────
  for (const userId of [adminId, supervisorId]) {
    // Unread: Thompson & Reed (US) expiring in 25 days
    all.push(n(
      userId,
      'certificate_expiring',
      'Certificado por vencer en 25 días',
      'El certificado de Thompson & Reed LLP (US) vence pronto. Solicita renovación al corresponsal.',
      'certificate', CERT.US, false, hoursAgo(6),
    ))

    // Unread: Mendoza Arias (CO) expired
    all.push(n(
      userId,
      'certificate_expired',
      'Certificado vencido',
      'El certificado de Mendoza Arias & Cia. (CO) ha vencido. No se pueden procesar liquidaciones sin certificado vigente.',
      'certificate', CERT.CO, false, daysAgo(1),
    ))

    // Read: Thompson & Reed (US) pre-alert at 90 days
    all.push(n(
      userId,
      'certificate_expiring',
      'Certificado por vencer en 90 días',
      'El certificado de Thompson & Reed LLP (US) vencerá en 90 días. Planifica la renovación.',
      'certificate', CERT.US, true, daysAgo(65),
    ))

    // Read: Estudio Jurídico Pacífico (CL) pre-alert at 90 days
    all.push(n(
      userId,
      'certificate_expiring',
      'Certificado por vencer en 90 días',
      'El certificado de Estudio Jurídico Pacífico SpA (CL) vencerá en 90 días. Planifica la renovación.',
      'certificate', CERT.CL, true, daysAgo(45),
    ))
  }

  // ────────────────────────────────────────────
  // FINANCIERO: Payment requests
  // ────────────────────────────────────────────
  // Unread: pending payments
  all.push(n(
    financieroId,
    'payment_requested',
    'Nueva solicitud de pago',
    'Solicitud de pago para Estudio Jurídico Pacífico SpA: 42.000.000 CLP — M&A advisory - Fusión cadena retail',
    'payment_request', LIQ.CL_002, false, daysAgo(5),
  ))
  all.push(n(
    financieroId,
    'payment_requested',
    'Nueva solicitud de pago',
    'Solicitud de pago para Zhu & Partners Law Firm: 52.000 USD — Compliance inversión extranjera - WFOE Suzhou',
    'payment_request', LIQ.CN_003, false, daysAgo(3),
  ))

  // Read: already processed payments
  all.push(n(
    financieroId,
    'payment_requested',
    'Nueva solicitud de pago',
    'Solicitud de pago para Bufete Rodríguez & Asociados: 32.000 USD — Constitución de sociedad - Fintech México',
    'payment_request', LIQ.MX_004, true, daysAgo(30),
  ))
  all.push(n(
    financieroId,
    'payment_requested',
    'Nueva solicitud de pago',
    'Solicitud de pago para Estudio Jurídico Pacífico SpA: 18.500 USD — Arbitraje internacional - Caso minero Atacama',
    'payment_request', LIQ.CL_001, true, daysAgo(45),
  ))
  all.push(n(
    financieroId,
    'payment_requested',
    'Nueva solicitud de pago',
    'Solicitud de pago para Zhu & Partners Law Firm: 85.000 USD — M&A transfronterizo - Proveedor automotriz alemán',
    'payment_request', LIQ.CN_001, true, daysAgo(60),
  ))
  all.push(n(
    financieroId,
    'payment_requested',
    'Nueva solicitud de pago',
    'Solicitud de pago para Thompson & Reed LLP: 175.000 USD — Litigio de valores - Sector biotech',
    'payment_request', LIQ.US_001, true, daysAgo(90),
  ))

  // ────────────────────────────────────────────
  // ADMIN (as liquidation creator): approvals, rejections, payments
  // ────────────────────────────────────────────
  // Unread: recent approval
  all.push(n(
    adminId,
    'liquidation_approved',
    'Liquidación aprobada',
    'La liquidación de Estudio Jurídico Pacífico SpA por 15.750.000 CLP ha sido aprobada. Concepto: Compliance y gobierno corporativo 2025.',
    'liquidation', LIQ.CL_003, false, daysAgo(2),
  ))

  // Read approvals
  all.push(n(
    adminId,
    'liquidation_approved',
    'Liquidación aprobada',
    'La liquidación de Zhu & Partners Law Firm por 38.000 USD ha sido aprobada. Concepto: Registro PI - 47 marcas Greater China.',
    'liquidation', LIQ.CN_002, true, daysAgo(10),
  ))
  all.push(n(
    adminId,
    'liquidation_approved',
    'Liquidación aprobada',
    'La liquidación de Thompson & Reed LLP por 95.000 USD ha sido aprobada. Concepto: Reestructuración corporativa - Chapter 11 advisory.',
    'liquidation', LIQ.US_002, true, daysAgo(20),
  ))

  // Rejection
  all.push(n(
    adminId,
    'liquidation_rejected',
    'Liquidación rechazada',
    'La liquidación de Mendoza Arias & Cia. por 72.000.000 COP ha sido rechazada. Concepto: Due diligence - Planta manufacturera Medellín.',
    'liquidation', LIQ.CO_002, true, daysAgo(15),
  ))

  // Payment completions
  all.push(n(
    adminId,
    'payment_completed',
    'Pago completado',
    'El pago de 32.000 USD a Bufete Rodríguez & Asociados ha sido completado. Concepto: Constitución de sociedad - Fintech México.',
    'payment_request', PAY.MX_004, true, daysAgo(25),
  ))
  all.push(n(
    adminId,
    'payment_completed',
    'Pago completado',
    'El pago de 18.500 USD a Estudio Jurídico Pacífico SpA ha sido completado. Concepto: Arbitraje internacional - Caso minero Atacama.',
    'payment_request', PAY.CL_001, true, daysAgo(40),
  ))
  all.push(n(
    adminId,
    'payment_completed',
    'Pago completado',
    'El pago de 85.000 USD a Zhu & Partners Law Firm ha sido completado. Concepto: M&A transfronterizo - Proveedor automotriz alemán.',
    'payment_request', PAY.CN_001, true, daysAgo(55),
  ))
  all.push(n(
    adminId,
    'payment_completed',
    'Pago completado',
    'El pago de 175.000 USD a Thompson & Reed LLP ha sido completado. Concepto: Litigio de valores - Sector biotech.',
    'payment_request', PAY.US_001, true, daysAgo(85),
  ))
  all.push(n(
    adminId,
    'payment_completed',
    'Pago completado',
    'El pago de 45.000.000 COP a Mendoza Arias & Cia. ha sido completado. Concepto: Litigio administrativo - Superintendencia.',
    'payment_request', PAY.CO_001, true, daysAgo(115),
  ))

  // ────────────────────────────────────────────
  // PAGADOR: A couple informative notifications
  // ────────────────────────────────────────────
  all.push(n(
    pagadorId,
    'liquidation_approved',
    'Liquidación aprobada',
    'La liquidación de Bufete Rodríguez & Asociados por 45.000 MXN ha sido aprobada. Concepto: Due diligence - Adquisición inmobiliaria Querétaro.',
    'liquidation', LIQ.MX_001, true, daysAgo(30),
  ))
  all.push(n(
    pagadorId,
    'payment_completed',
    'Pago completado',
    'El pago de 45.000.000 COP a Mendoza Arias & Cia. ha sido completado. Concepto: Litigio administrativo - Superintendencia.',
    'payment_request', PAY.CO_001, true, daysAgo(115),
  ))

  // ────────────────────────────────────────────
  // CORRESPONSALES: Status updates on their liquidations
  // ────────────────────────────────────────────
  // MX
  if (corrMX) {
    all.push(n(
      corrMX,
      'liquidation_approved',
      'Liquidación aprobada',
      'Tu liquidación por 45.000 MXN (Due diligence - Adquisición inmobiliaria Querétaro) ha sido aprobada.',
      'liquidation', LIQ.MX_001, true, daysAgo(28),
    ))
    all.push(n(
      corrMX,
      'payment_completed',
      'Pago completado',
      'Se ha completado el pago de 32.000 USD por Constitución de sociedad - Fintech México.',
      'payment_request', PAY.MX_004, true, daysAgo(25),
    ))
  }

  // CL
  if (corrCL) {
    all.push(n(
      corrCL,
      'liquidation_approved',
      'Liquidación aprobada',
      'Tu liquidación por 15.750.000 CLP (Compliance y gobierno corporativo 2025) ha sido aprobada.',
      'liquidation', LIQ.CL_003, false, daysAgo(2),
    ))
    all.push(n(
      corrCL,
      'payment_requested',
      'Pago solicitado',
      'Se ha solicitado el pago de 42.000.000 CLP por M&A advisory - Fusión cadena retail. En proceso.',
      'liquidation', LIQ.CL_002, false, daysAgo(5),
    ))
  }

  // CN
  if (corrCN) {
    all.push(n(
      corrCN,
      'liquidation_approved',
      'Liquidación aprobada',
      'Tu liquidación por 38.000 USD (Registro PI - 47 marcas Greater China) ha sido aprobada.',
      'liquidation', LIQ.CN_002, true, daysAgo(10),
    ))
    all.push(n(
      corrCN,
      'payment_requested',
      'Pago solicitado',
      'Se ha solicitado el pago de 52.000 USD por Compliance inversión extranjera - WFOE Suzhou. En proceso.',
      'liquidation', LIQ.CN_003, false, daysAgo(3),
    ))
  }

  // US
  if (corrUS) {
    all.push(n(
      corrUS,
      'liquidation_approved',
      'Liquidación aprobada',
      'Tu liquidación por 95.000 USD (Reestructuración corporativa - Chapter 11 advisory) ha sido aprobada.',
      'liquidation', LIQ.US_002, true, daysAgo(20),
    ))
    all.push(n(
      corrUS,
      'payment_completed',
      'Pago completado',
      'Se ha completado el pago de 175.000 USD por Litigio de valores - Sector biotech.',
      'payment_request', PAY.US_001, true, daysAgo(85),
    ))
  }

  // CO
  if (corrCO) {
    all.push(n(
      corrCO,
      'liquidation_rejected',
      'Liquidación rechazada',
      'Tu liquidación por 72.000.000 COP (Due diligence - Planta manufacturera Medellín) ha sido rechazada.',
      'liquidation', LIQ.CO_002, true, daysAgo(15),
    ))
    all.push(n(
      corrCO,
      'payment_completed',
      'Pago completado',
      'Se ha completado el pago de 45.000.000 COP por Litigio administrativo - Superintendencia.',
      'payment_request', PAY.CO_001, true, daysAgo(115),
    ))
  }

  // ── 4. Insert ──
  console.log(`\n📌 Inserting ${all.length} notifications...`)

  const { error } = await supabase.from('notifications').insert(all)
  if (error) {
    console.error('❌ Insert failed:', error.message)
    process.exit(1)
  }

  // ── 5. Summary ──
  const summary: Record<string, { total: number; unread: number }> = {}
  for (const notif of all) {
    const email = Object.entries(byEmail).find(([, id]) => id === notif.user_id)?.[0] ?? notif.user_id
    if (!summary[email]) summary[email] = { total: 0, unread: 0 }
    summary[email].total++
    if (!notif.read) summary[email].unread++
  }

  console.log(`\n🎉 ${all.length} notifications inserted!\n`)
  console.log('📊 Summary by user:')
  for (const [email, counts] of Object.entries(summary).sort((a, b) => b[1].total - a[1].total)) {
    const unreadLabel = counts.unread > 0 ? ` (${counts.unread} unread)` : ''
    console.log(`   ${email.padEnd(42)} ${String(counts.total).padStart(2)} notif${unreadLabel}`)
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
