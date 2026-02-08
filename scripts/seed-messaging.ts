/**
 * LIQUIDA360 - Seed Messaging
 * Populates user_profiles, conversations, conversation_participants, and messages
 * with realistic demo data for all 9 demo users.
 *
 * Usage: npx tsx scripts/seed-messaging.ts
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

// Correspondent IDs from run-seed.ts
const CORRESPONDENTS = {
  MX: 'a1000000-0000-0000-0000-000000000001',
  CL: 'a1000000-0000-0000-0000-000000000002',
  CN: 'a1000000-0000-0000-0000-000000000003',
  US: 'a1000000-0000-0000-0000-000000000004',
  CO: 'a1000000-0000-0000-0000-000000000005',
}

// Deterministic conversation UUIDs
const CONV = {
  ADMIN_SUPERVISOR: 'e1000000-0000-0000-0000-000000000001',
  ADMIN_FINANCIERO: 'e1000000-0000-0000-0000-000000000002',
  ADMIN_CORR_MX: 'e1000000-0000-0000-0000-000000000003',
  SUPERVISOR_CORR_CL: 'e1000000-0000-0000-0000-000000000004',
  FINANCIERO_CORR_CN: 'e1000000-0000-0000-0000-000000000005',
  GROUP_LIQUIDACIONES: 'e1000000-0000-0000-0000-000000000006',
}

function hoursAgo(hours: number): string {
  const d = new Date()
  d.setHours(d.getHours() - hours)
  return d.toISOString()
}

function daysAgo(days: number, extraHours = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(d.getHours() - extraHours)
  return d.toISOString()
}

// Demo user emails
const EMAILS = {
  admin: 'admin@liquida360.demo',
  supervisor: 'supervisor@liquida360.demo',
  pagador: 'pagador@liquida360.demo',
  financiero: 'financiero@liquida360.demo',
  corrMX: 'corresponsal.mx@test.liquida360.com',
  corrCL: 'corresponsal.cl@test.liquida360.com',
  corrCN: 'corresponsal.cn@test.liquida360.com',
  corrUS: 'corresponsal.us@test.liquida360.com',
  corrCO: 'corresponsal.co@test.liquida360.com',
}

const NAMES: Record<string, string> = {
  [EMAILS.admin]: 'Pedro Martinez',
  [EMAILS.supervisor]: 'Carlos Lopez',
  [EMAILS.pagador]: 'Ana Garcia',
  [EMAILS.financiero]: 'Maria Torres',
  [EMAILS.corrMX]: 'Bufete Rodriguez y Asociados',
  [EMAILS.corrCL]: 'Estudio Jurídico Pacífico SpA',
  [EMAILS.corrCN]: 'Zhu & Partners Legal',
  [EMAILS.corrUS]: 'Thompson & Reed LLP',
  [EMAILS.corrCO]: 'Mendoza Arias Abogados',
}

const ROLES: Record<string, string> = {
  [EMAILS.admin]: 'admin',
  [EMAILS.supervisor]: 'supervisor',
  [EMAILS.pagador]: 'pagador',
  [EMAILS.financiero]: 'financiero',
  [EMAILS.corrMX]: 'corresponsal',
  [EMAILS.corrCL]: 'corresponsal',
  [EMAILS.corrCN]: 'corresponsal',
  [EMAILS.corrUS]: 'corresponsal',
  [EMAILS.corrCO]: 'corresponsal',
}

const CORR_IDS: Record<string, string | null> = {
  [EMAILS.admin]: null,
  [EMAILS.supervisor]: null,
  [EMAILS.pagador]: null,
  [EMAILS.financiero]: null,
  [EMAILS.corrMX]: CORRESPONDENTS.MX,
  [EMAILS.corrCL]: CORRESPONDENTS.CL,
  [EMAILS.corrCN]: CORRESPONDENTS.CN,
  [EMAILS.corrUS]: CORRESPONDENTS.US,
  [EMAILS.corrCO]: CORRESPONDENTS.CO,
}

async function main() {
  console.log('🔍 Looking up auth users...')

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 50 })
  if (authError) {
    console.error('Failed to list users:', authError.message)
    process.exit(1)
  }

  const users = authData.users
  const userIdByEmail: Record<string, string> = {}
  for (const u of users) {
    if (u.email) userIdByEmail[u.email] = u.id
  }

  // Verify all demo users exist
  const allEmails = Object.values(EMAILS)
  const missing = allEmails.filter((e) => !userIdByEmail[e])
  if (missing.length > 0) {
    console.error('Missing users:', missing)
    process.exit(1)
  }

  const uid = (email: string) => userIdByEmail[email]

  // ── 1. Clean existing messaging data ──
  console.log('🗑️  Cleaning existing messaging data...')
  await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('conversation_participants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('user_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  console.log('✅ Messaging data cleaned')

  // ── 2. Insert user_profiles ──
  console.log('👤 Inserting user_profiles...')
  const profiles = allEmails.map((email) => ({
    id: uid(email),
    email,
    full_name: NAMES[email] ?? email,
    role: ROLES[email] ?? 'corresponsal',
    correspondent_id: CORR_IDS[email] ?? null,
  }))

  const { error: profileError } = await supabase.from('user_profiles').upsert(profiles)
  if (profileError) {
    console.error('Failed to insert user_profiles:', profileError.message)
    process.exit(1)
  }
  console.log(`✅ ${profiles.length} user profiles inserted`)

  // ── 3. Insert conversations ──
  console.log('💬 Inserting conversations...')
  const conversations = [
    {
      id: CONV.ADMIN_SUPERVISOR,
      title: null,
      is_group: false,
      created_by: uid(EMAILS.admin),
      updated_at: hoursAgo(1),
    },
    {
      id: CONV.ADMIN_FINANCIERO,
      title: null,
      is_group: false,
      created_by: uid(EMAILS.admin),
      updated_at: hoursAgo(5),
    },
    {
      id: CONV.ADMIN_CORR_MX,
      title: null,
      is_group: false,
      created_by: uid(EMAILS.admin),
      updated_at: daysAgo(1),
    },
    {
      id: CONV.SUPERVISOR_CORR_CL,
      title: null,
      is_group: false,
      created_by: uid(EMAILS.supervisor),
      updated_at: daysAgo(2),
    },
    {
      id: CONV.FINANCIERO_CORR_CN,
      title: null,
      is_group: false,
      created_by: uid(EMAILS.financiero),
      updated_at: daysAgo(3),
    },
    {
      id: CONV.GROUP_LIQUIDACIONES,
      title: 'Equipo Liquidaciones',
      is_group: true,
      created_by: uid(EMAILS.admin),
      updated_at: hoursAgo(3),
    },
  ]

  const { error: convError } = await supabase.from('conversations').insert(conversations)
  if (convError) {
    console.error('Failed to insert conversations:', convError.message)
    process.exit(1)
  }
  console.log(`✅ ${conversations.length} conversations inserted`)

  // ── 4. Insert participants ──
  console.log('👥 Inserting participants...')
  const participants = [
    // Admin ↔ Supervisor
    { conversation_id: CONV.ADMIN_SUPERVISOR, user_id: uid(EMAILS.admin), last_read_at: hoursAgo(0) },
    { conversation_id: CONV.ADMIN_SUPERVISOR, user_id: uid(EMAILS.supervisor), last_read_at: hoursAgo(2) },
    // Admin ↔ Financiero
    { conversation_id: CONV.ADMIN_FINANCIERO, user_id: uid(EMAILS.admin), last_read_at: hoursAgo(4) },
    { conversation_id: CONV.ADMIN_FINANCIERO, user_id: uid(EMAILS.financiero), last_read_at: hoursAgo(5) },
    // Admin ↔ Corresponsal MX
    { conversation_id: CONV.ADMIN_CORR_MX, user_id: uid(EMAILS.admin), last_read_at: daysAgo(1) },
    { conversation_id: CONV.ADMIN_CORR_MX, user_id: uid(EMAILS.corrMX), last_read_at: daysAgo(2) },
    // Supervisor ↔ Corresponsal CL
    { conversation_id: CONV.SUPERVISOR_CORR_CL, user_id: uid(EMAILS.supervisor), last_read_at: daysAgo(2) },
    { conversation_id: CONV.SUPERVISOR_CORR_CL, user_id: uid(EMAILS.corrCL), last_read_at: daysAgo(2) },
    // Financiero ↔ Corresponsal CN
    { conversation_id: CONV.FINANCIERO_CORR_CN, user_id: uid(EMAILS.financiero), last_read_at: daysAgo(3) },
    { conversation_id: CONV.FINANCIERO_CORR_CN, user_id: uid(EMAILS.corrCN), last_read_at: daysAgo(3) },
    // Grupo Liquidaciones (Admin + Supervisor + Pagador)
    { conversation_id: CONV.GROUP_LIQUIDACIONES, user_id: uid(EMAILS.admin), last_read_at: hoursAgo(2) },
    { conversation_id: CONV.GROUP_LIQUIDACIONES, user_id: uid(EMAILS.supervisor), last_read_at: hoursAgo(4) },
    { conversation_id: CONV.GROUP_LIQUIDACIONES, user_id: uid(EMAILS.pagador), last_read_at: daysAgo(1) },
  ]

  const { error: partError } = await supabase.from('conversation_participants').insert(participants)
  if (partError) {
    console.error('Failed to insert participants:', partError.message)
    process.exit(1)
  }
  console.log(`✅ ${participants.length} participants inserted`)

  // ── 5. Insert messages ──
  console.log('📨 Inserting messages...')
  const messages = [
    // -- Conversation 1: Admin ↔ Supervisor (certificates) -- 5 messages
    {
      conversation_id: CONV.ADMIN_SUPERVISOR,
      sender_id: uid(EMAILS.admin),
      content: 'Carlos, he revisado el dashboard y hay 2 certificados que necesitan atención urgente.',
      created_at: hoursAgo(8),
    },
    {
      conversation_id: CONV.ADMIN_SUPERVISOR,
      sender_id: uid(EMAILS.supervisor),
      content: '¿Cuáles son? Vi la alerta del de Thompson & Reed pero ¿hay otro?',
      created_at: hoursAgo(7),
    },
    {
      conversation_id: CONV.ADMIN_SUPERVISOR,
      sender_id: uid(EMAILS.admin),
      content: 'Sí, el de Mendoza Arias (Colombia) ya venció. Necesitamos contactarles para la renovación.',
      created_at: hoursAgo(6),
    },
    {
      conversation_id: CONV.ADMIN_SUPERVISOR,
      sender_id: uid(EMAILS.supervisor),
      content: 'Entendido. Les envío un correo hoy mismo solicitando el nuevo certificado. Para Thompson & Reed aún tenemos 25 días.',
      created_at: hoursAgo(3),
    },
    {
      conversation_id: CONV.ADMIN_SUPERVISOR,
      sender_id: uid(EMAILS.admin),
      content: 'Perfecto. Mantengamos seguimiento semanal hasta que se resuelvan ambos.',
      created_at: hoursAgo(1),
    },

    // -- Conversation 2: Admin ↔ Financiero (payments) -- 4 messages
    {
      conversation_id: CONV.ADMIN_FINANCIERO,
      sender_id: uid(EMAILS.admin),
      content: 'María, ¿cómo van las solicitudes de pago pendientes? Tenemos 2 sin procesar.',
      created_at: hoursAgo(24),
    },
    {
      conversation_id: CONV.ADMIN_FINANCIERO,
      sender_id: uid(EMAILS.financiero),
      content: 'Estoy revisando la de Estudio Jurídico Pacífico (42M CLP). Necesito validar los datos bancarios con el corresponsal.',
      created_at: hoursAgo(22),
    },
    {
      conversation_id: CONV.ADMIN_FINANCIERO,
      sender_id: uid(EMAILS.admin),
      content: 'OK. ¿Y la de Zhu & Partners por 52K USD?',
      created_at: hoursAgo(8),
    },
    {
      conversation_id: CONV.ADMIN_FINANCIERO,
      sender_id: uid(EMAILS.financiero),
      content: 'Esa está lista para procesar. Solo espero confirmación del tipo de cambio del día. La tramito mañana a primera hora.',
      created_at: hoursAgo(5),
    },

    // -- Conversation 3: Admin ↔ Corresponsal MX -- 4 messages
    {
      conversation_id: CONV.ADMIN_CORR_MX,
      sender_id: uid(EMAILS.admin),
      content: 'Buenos días. Quería confirmar que la liquidación de due diligence inmobiliaria en Querétaro fue aprobada correctamente.',
      created_at: daysAgo(3),
    },
    {
      conversation_id: CONV.ADMIN_CORR_MX,
      sender_id: uid(EMAILS.corrMX),
      content: 'Sí, recibimos la confirmación. Muchas gracias por la gestión rápida.',
      created_at: daysAgo(3, 2),
    },
    {
      conversation_id: CONV.ADMIN_CORR_MX,
      sender_id: uid(EMAILS.admin),
      content: 'También les informo que el pago de la constitución de sociedad Fintech ya fue procesado. Deberían ver el depósito en las próximas 48h.',
      created_at: daysAgo(1, 5),
    },
    {
      conversation_id: CONV.ADMIN_CORR_MX,
      sender_id: uid(EMAILS.corrMX),
      content: 'Excelente. Lo verificamos y confirmamos recepción en cuanto llegue. Saludos.',
      created_at: daysAgo(1),
    },

    // -- Conversation 4: Supervisor ↔ Corresponsal CL -- 3 messages
    {
      conversation_id: CONV.SUPERVISOR_CORR_CL,
      sender_id: uid(EMAILS.supervisor),
      content: 'Estimados, necesitamos actualizar la documentación de compliance para el gobierno corporativo. ¿Pueden enviarnos los últimos estados financieros?',
      created_at: daysAgo(5),
    },
    {
      conversation_id: CONV.SUPERVISOR_CORR_CL,
      sender_id: uid(EMAILS.corrCL),
      content: 'Por supuesto, Carlos. Los estamos preparando. Los tendremos listos para el viernes.',
      created_at: daysAgo(4),
    },
    {
      conversation_id: CONV.SUPERVISOR_CORR_CL,
      sender_id: uid(EMAILS.supervisor),
      content: 'Perfecto, quedo atento. También recuerden que el certificado de residencia fiscal vence pronto, necesitaremos la renovación.',
      created_at: daysAgo(2),
    },

    // -- Conversation 5: Financiero ↔ Corresponsal CN -- 3 messages
    {
      conversation_id: CONV.FINANCIERO_CORR_CN,
      sender_id: uid(EMAILS.financiero),
      content: 'Hola, para procesar el pago de compliance inversión extranjera WFOE necesitamos confirmar los datos bancarios. ¿El SWIFT sigue siendo el mismo?',
      created_at: daysAgo(4),
    },
    {
      conversation_id: CONV.FINANCIERO_CORR_CN,
      sender_id: uid(EMAILS.corrCN),
      content: 'Sí, los datos bancarios son los mismos. SWIFT: BKCHCNBJ, cuenta en Bank of China.',
      created_at: daysAgo(3, 6),
    },
    {
      conversation_id: CONV.FINANCIERO_CORR_CN,
      sender_id: uid(EMAILS.financiero),
      content: 'Perfecto, gracias por la confirmación. Procesamos el pago esta semana.',
      created_at: daysAgo(3),
    },

    // -- Conversation 6: Grupo Liquidaciones -- 6 messages
    {
      conversation_id: CONV.GROUP_LIQUIDACIONES,
      sender_id: uid(EMAILS.admin),
      content: 'Equipo, resumen semanal: tenemos 2 liquidaciones pendientes de aprobación y 5 pagos completados este mes.',
      created_at: daysAgo(2),
    },
    {
      conversation_id: CONV.GROUP_LIQUIDACIONES,
      sender_id: uid(EMAILS.supervisor),
      content: 'Las 2 pendientes son de CL y CN. Estoy revisando la documentación de soporte.',
      created_at: daysAgo(2, -2),
    },
    {
      conversation_id: CONV.GROUP_LIQUIDACIONES,
      sender_id: uid(EMAILS.pagador),
      content: 'Confirmo que los 5 pagos se realizaron sin incidencias. Comprobantes subidos al sistema.',
      created_at: daysAgo(1, 8),
    },
    {
      conversation_id: CONV.GROUP_LIQUIDACIONES,
      sender_id: uid(EMAILS.admin),
      content: 'Excelente trabajo. Ana, ¿puedes preparar el informe mensual para el viernes?',
      created_at: daysAgo(1, 4),
    },
    {
      conversation_id: CONV.GROUP_LIQUIDACIONES,
      sender_id: uid(EMAILS.pagador),
      content: 'Sí, lo tengo casi listo. Solo me falta consolidar los datos de Colombia.',
      created_at: hoursAgo(6),
    },
    {
      conversation_id: CONV.GROUP_LIQUIDACIONES,
      sender_id: uid(EMAILS.supervisor),
      content: 'Te paso los datos de Colombia en un rato. Acabo de verificar las cifras con Mendoza Arias.',
      created_at: hoursAgo(3),
    },
  ]

  const { error: msgError } = await supabase.from('messages').insert(messages)
  if (msgError) {
    console.error('Failed to insert messages:', msgError.message)
    process.exit(1)
  }
  console.log(`✅ ${messages.length} messages inserted`)

  // ── Summary ──
  console.log('\n📊 Seed messaging summary:')
  console.log(`   👤 User profiles: ${profiles.length}`)
  console.log(`   💬 Conversations: ${conversations.length} (${conversations.filter((c) => c.is_group).length} grupo)`)
  console.log(`   👥 Participants: ${participants.length}`)
  console.log(`   📨 Messages: ${messages.length}`)
  console.log('\n✅ Messaging seed complete!')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
