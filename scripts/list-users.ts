import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vrzmkxjvzjphdeshmmzl.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const { data } = await sb.auth.admin.listUsers()
  const users = data?.users || []
  console.log('Total users:', users.length)
  console.log('')
  for (const u of users) {
    const role = u.app_metadata?.role || '(sin rol)'
    const name = u.user_metadata?.full_name || u.user_metadata?.correspondent_name || '—'
    const corrId = u.app_metadata?.correspondent_id || ''
    console.log(`${role.padEnd(15)} ${(u.email || '').padEnd(45)} ${name}`)
  }
}

main()
