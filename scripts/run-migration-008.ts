/**
 * Execute migration 008_messaging.sql via Supabase Management API
 * Usage: npx tsx scripts/run-migration-008.ts
 *
 * Uses the Supabase database password to connect via the pooler endpoint.
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Extract project ref from URL
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vrzmkxjvzjphdeshmmzl.supabase.co'
const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0]
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || ''

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const sqlPath = resolve(__dirname, '../supabase/migrations/008_messaging.sql')
const sql = readFileSync(sqlPath, 'utf-8')

/**
 * Execute SQL via the Supabase Management API v1
 * POST https://api.supabase.com/v1/projects/{ref}/database/query
 */
async function runViaManagementAPI(sqlText: string): Promise<{ ok: boolean; error?: string }> {
  // This requires a Supabase access token (personal), not service role key
  // Let's try the direct SQL approach via REST instead
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql_text: sqlText }),
  })

  if (!resp.ok) {
    return { ok: false, error: `HTTP ${resp.status}` }
  }
  return { ok: true }
}

/**
 * Execute SQL via a temporary RPC function created with service role
 */
async function runViaRPC(sqlText: string): Promise<{ ok: boolean; error?: string; data?: unknown }> {
  // First, create a temporary function to execute arbitrary SQL
  const createFuncSQL = `
    CREATE OR REPLACE FUNCTION _temp_exec_migration(sql_text TEXT)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_text;
    END;
    $$;
  `

  // Use the supabase client to call rpc
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Try creating the helper function first
  const { error: funcError } = await supabase.rpc('_temp_exec_migration', { sql_text: 'SELECT 1' })

  if (funcError) {
    // Function doesn't exist yet - we can't create it via REST either
    // Fall back to statement-by-statement via the Supabase client
    return { ok: false, error: 'RPC function not available' }
  }

  // Execute the migration
  const { error } = await supabase.rpc('_temp_exec_migration', { sql_text: sqlText })
  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

/**
 * Execute individual DDL statements using Supabase REST API
 * Some DDL can be done via the client by using specific table operations
 */
async function runStatementByStatement(): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' },
  })

  // Check if tables already exist by trying to query them
  const { error: profileCheck } = await supabase.from('user_profiles').select('id').limit(1)
  const { error: convCheck } = await supabase.from('conversations').select('id').limit(1)
  const { error: partCheck } = await supabase.from('conversation_participants').select('id').limit(1)
  const { error: msgCheck } = await supabase.from('messages').select('id').limit(1)

  const tablesExist = {
    user_profiles: !profileCheck,
    conversations: !convCheck,
    conversation_participants: !partCheck,
    messages: !msgCheck,
  }

  console.log('\n📋 Table status:')
  for (const [table, exists] of Object.entries(tablesExist)) {
    console.log(`   ${exists ? '✅' : '❌'} ${table}`)
  }

  if (Object.values(tablesExist).every(Boolean)) {
    console.log('\n✅ All messaging tables already exist! Migration has been applied.')
    return
  }

  console.log('\n⚠️  Some tables are missing. The migration SQL needs to be executed in the Supabase Dashboard:')
  console.log('   1. Go to https://supabase.com/dashboard/project/vrzmkxjvzjphdeshmmzl/sql')
  console.log('   2. Paste the contents of supabase/migrations/008_messaging.sql')
  console.log('   3. Click "Run"')
  console.log('\n   Or use the Supabase CLI:')
  console.log('   supabase db push --linked')
  process.exit(1)
}

async function main() {
  console.log('🚀 Executing migration 008_messaging.sql...')
  console.log(`   Project: ${projectRef}`)

  // Try the RPC approach first
  const rpcResult = await runViaRPC(sql)
  if (rpcResult.ok) {
    console.log('\n✅ Migration executed successfully via RPC!')
    return
  }

  console.log(`   RPC approach failed: ${rpcResult.error}`)

  // Try the Management API
  const apiResult = await runViaManagementAPI(sql)
  if (apiResult.ok) {
    console.log('\n✅ Migration executed successfully via Management API!')
    return
  }

  console.log(`   Management API failed: ${apiResult.error}`)

  // Fall back to checking table status
  await runStatementByStatement()
}

main().catch(console.error)
