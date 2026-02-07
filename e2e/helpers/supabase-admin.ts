import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function createTestUser(email: string, password: string, role: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
  })
  if (error) throw new Error(`Failed to create test user: ${error.message}`)
  return data.user
}

export async function deleteTestUser(email: string) {
  const { data } = await supabaseAdmin.auth.admin.listUsers()
  const user = data.users.find((u) => u.email === email)
  if (user) {
    await supabaseAdmin.auth.admin.deleteUser(user.id)
  }
}

export async function createTestCorrespondent(data: {
  name: string
  country: string
  tax_id: string
  email?: string
  user_id?: string
}) {
  const { data: correspondent, error } = await supabaseAdmin
    .from('correspondents')
    .insert({
      name: data.name,
      country: data.country,
      tax_id: data.tax_id,
      email: data.email ?? `test-${Date.now()}@test.com`,
      status: 'active',
      ...(data.user_id ? { user_id: data.user_id } : {}),
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create test correspondent: ${error.message}`)
  return correspondent
}

export async function createTestCertificate(data: {
  correspondent_id: string
  issuing_country: string
  issue_date: string
  expiry_date: string
}) {
  const { data: cert, error } = await supabaseAdmin
    .from('certificates')
    .insert({
      correspondent_id: data.correspondent_id,
      issuing_country: data.issuing_country,
      issue_date: data.issue_date,
      expiry_date: data.expiry_date,
      status: 'valid',
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create test certificate: ${error.message}`)
  return cert
}

export async function createTestLiquidation(data: {
  correspondent_id: string
  certificate_id?: string
  amount: number
  currency: string
  concept: string
  status?: string
  created_by: string
}) {
  const { data: liq, error } = await supabaseAdmin
    .from('liquidations')
    .insert({
      correspondent_id: data.correspondent_id,
      certificate_id: data.certificate_id ?? null,
      amount: data.amount,
      currency: data.currency,
      concept: data.concept,
      status: data.status ?? 'draft',
      created_by: data.created_by,
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create test liquidation: ${error.message}`)
  return liq
}

export async function cleanupTestData(prefix: string) {
  // Delete liquidations with test prefix in concept
  await supabaseAdmin.from('liquidations').delete().ilike('concept', `${prefix}%`)
  // Delete certificates linked to test correspondents
  const { data: correspondents } = await supabaseAdmin
    .from('correspondents')
    .select('id')
    .ilike('name', `${prefix}%`)
  if (correspondents?.length) {
    const ids = correspondents.map((c) => c.id)
    await supabaseAdmin.from('certificates').delete().in('correspondent_id', ids)
    await supabaseAdmin.from('correspondents').delete().in('id', ids)
  }
}
