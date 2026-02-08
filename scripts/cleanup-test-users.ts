/**
 * LIQUIDA360 - Cleanup Test Users
 * Removes non-demo test users from Supabase Auth.
 * Database records (liquidations.created_by, etc.) are preserved for audit.
 *
 * Users to KEEP (demo accounts):
 *   - admin@liquida360.demo
 *   - supervisor@liquida360.demo
 *   - pagador@liquida360.demo
 *   - financiero@liquida360.demo
 *   - corresponsal.mx@test.liquida360.com
 *   - corresponsal.cl@test.liquida360.com
 *   - corresponsal.cn@test.liquida360.com
 *   - corresponsal.us@test.liquida360.com
 *   - corresponsal.co@test.liquida360.com
 *
 * Usage: npx tsx scripts/cleanup-test-users.ts
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

// Emails to keep
const KEEP_EMAILS = new Set([
  'admin@liquida360.demo',
  'supervisor@liquida360.demo',
  'pagador@liquida360.demo',
  'financiero@liquida360.demo',
  'corresponsal.mx@test.liquida360.com',
  'corresponsal.cl@test.liquida360.com',
  'corresponsal.cn@test.liquida360.com',
  'corresponsal.us@test.liquida360.com',
  'corresponsal.co@test.liquida360.com',
])

async function main() {
  console.log('🧹 LIQUIDA360 - Cleanup Test Users')
  console.log('')

  const { data } = await supabase.auth.admin.listUsers({ perPage: 200 })
  const users = data?.users || []

  console.log(`Total users in auth: ${users.length}`)
  console.log('')

  const toDelete = users.filter((u) => !KEEP_EMAILS.has(u.email ?? ''))
  const toKeep = users.filter((u) => KEEP_EMAILS.has(u.email ?? ''))

  console.log(`✅ Users to KEEP (${toKeep.length}):`)
  for (const u of toKeep) {
    console.log(`   ${(u.app_metadata?.role ?? '—').padEnd(15)} ${u.email}`)
  }
  console.log('')

  if (toDelete.length === 0) {
    console.log('🎉 No users to delete. All clean!')
    return
  }

  console.log(`🗑️  Users to DELETE (${toDelete.length}):`)
  for (const u of toDelete) {
    console.log(`   ${(u.app_metadata?.role ?? '—').padEnd(15)} ${u.email}`)
  }
  console.log('')

  // Delete users
  let deleted = 0
  let failed = 0

  for (const u of toDelete) {
    const { error } = await supabase.auth.admin.deleteUser(u.id)
    if (error) {
      console.error(`   ❌ Failed to delete ${u.email}: ${error.message}`)
      failed++
    } else {
      console.log(`   ✅ Deleted ${u.email}`)
      deleted++
    }
  }

  console.log('')
  console.log(`🧹 Done: ${deleted} deleted, ${failed} failed`)
  console.log('')

  // Verify remaining
  const { data: remaining } = await supabase.auth.admin.listUsers({ perPage: 200 })
  console.log(`📊 Remaining users: ${remaining?.users?.length ?? 0}`)
  for (const u of remaining?.users ?? []) {
    const role = u.app_metadata?.role ?? '—'
    console.log(`   ${role.padEnd(15)} ${u.email}`)
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
