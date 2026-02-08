/**
 * LIQUIDA360 - Test Users Seed
 * Creates correspondent portal users for each of the 5 test correspondents
 * so they can log in to the portal dashboard.
 * Usage: npx tsx scripts/seed-users.ts
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

// Default password for all test users
const TEST_PASSWORD = 'Test1234!'

// Correspondent test users
const CORRESPONDENT_USERS = [
  {
    correspondentId: 'a1000000-0000-0000-0000-000000000001',
    email: 'corresponsal.mx@test.liquida360.com',
    name: 'Bufete Rodriguez & Asociados S.C.',
    country: 'MX',
  },
  {
    correspondentId: 'a1000000-0000-0000-0000-000000000002',
    email: 'corresponsal.cl@test.liquida360.com',
    name: 'Estudio Juridico Pacifico SpA',
    country: 'CL',
  },
  {
    correspondentId: 'a1000000-0000-0000-0000-000000000003',
    email: 'corresponsal.cn@test.liquida360.com',
    name: 'Zhu & Partners Law Firm',
    country: 'CN',
  },
  {
    correspondentId: 'a1000000-0000-0000-0000-000000000004',
    email: 'corresponsal.us@test.liquida360.com',
    name: 'Thompson & Reed LLP',
    country: 'US',
  },
  {
    correspondentId: 'a1000000-0000-0000-0000-000000000005',
    email: 'corresponsal.co@test.liquida360.com',
    name: 'Mendoza Arias & Cia. S.A.S.',
    country: 'CO',
  },
]

async function main() {
  console.log('👤 LIQUIDA360 Test Users Seed')
  console.log(`   Password for all test users: ${TEST_PASSWORD}`)
  console.log('')

  // ── 1. Create correspondent portal users ──
  console.log('📌 Creating 5 correspondent portal users...')

  for (const corr of CORRESPONDENT_USERS) {
    // Check if user already exists for this correspondent
    const { data: existing } = await supabase
      .from('correspondents')
      .select('user_id')
      .eq('id', corr.correspondentId)
      .single()

    if (existing?.user_id) {
      console.log(`   ⏭️  ${corr.country} - Already has user linked, skipping`)
      continue
    }

    // Create auth user with corresponsal role
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: corr.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      app_metadata: {
        role: 'corresponsal',
        correspondent_id: corr.correspondentId,
      },
      user_metadata: {
        correspondent_name: corr.name,
        full_name: corr.name,
      },
    })

    if (createError) {
      // If user already exists (e.g. from previous run), try to find and link
      if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
        console.log(`   ⚠️  ${corr.country} - User ${corr.email} already exists, attempting to link...`)

        // Find existing user by email
        const { data: usersData } = await supabase.auth.admin.listUsers()
        const existingUser = usersData?.users?.find((u) => u.email === corr.email)

        if (existingUser) {
          // Update app_metadata to ensure correct role
          await supabase.auth.admin.updateUserById(existingUser.id, {
            app_metadata: {
              role: 'corresponsal',
              correspondent_id: corr.correspondentId,
            },
          })

          // Link to correspondent
          const { error: linkError } = await supabase
            .from('correspondents')
            .update({ user_id: existingUser.id })
            .eq('id', corr.correspondentId)

          if (linkError) {
            console.error(`   ❌ ${corr.country} - Link failed: ${linkError.message}`)
          } else {
            console.log(`   ✅ ${corr.country} - Linked existing user ${corr.email}`)
          }
        }
        continue
      }

      console.error(`   ❌ ${corr.country} - Create failed: ${createError.message}`)
      continue
    }

    // Link user to correspondent record
    const { error: updateError } = await supabase
      .from('correspondents')
      .update({ user_id: newUser.user.id })
      .eq('id', corr.correspondentId)

    if (updateError) {
      console.error(`   ❌ ${corr.country} - Link failed: ${updateError.message}`)
      continue
    }

    console.log(`   ✅ ${corr.country} - ${corr.email} → ${corr.name}`)
  }

  // ── 2. Verify ──
  console.log('')
  console.log('🔍 Verifying...')

  const { data: linked } = await supabase
    .from('correspondents')
    .select('id, name, country, user_id, status')
    .not('user_id', 'is', null)

  console.log(`   Correspondents with portal user: ${linked?.length ?? 0}/5`)
  if (linked) {
    for (const c of linked) {
      console.log(`   → ${c.country} | ${c.name} | status: ${c.status}`)
    }
  }

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Credenciales de acceso al portal:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  for (const corr of CORRESPONDENT_USERS) {
    console.log(`  ${corr.country} | ${corr.email} | ${TEST_PASSWORD}`)
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('🎉 Test users seed complete!')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
