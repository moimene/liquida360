import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load local test env if CI secrets are missing
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const envPath = path.resolve(__dirname, '..', '.env.test')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .forEach((line) => {
        const idx = line.indexOf('=')
        if (idx === -1) return
        const k = line.slice(0, idx).trim()
        const v = line.slice(idx + 1).trim()
        if (!process.env[k]) process.env[k] = v
      })
  }
}

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

// --- G-Invoice helpers ---

export async function createTestGInvUser(
  email: string,
  password: string,
  ginvRole: string,
  extraMeta?: Record<string, string>,
) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    // G-Invoice users also need a base 'role' so the login page
    // doesn't redirect them to /pending (it only checks role, not ginv_role)
    app_metadata: { role: 'admin', ginv_role: ginvRole, ...extraMeta },
  })
  if (error) throw new Error(`Failed to create G-Invoice test user: ${error.message}`)
  return data.user
}

export async function createTestGInvJob(data: {
  job_code: string
  client_code: string
  client_name: string
  uttai_status?: string
  status?: string
}) {
  const { data: job, error } = await supabaseAdmin
    .from('ginv_jobs')
    .upsert(
      {
        job_code: data.job_code,
        client_code: data.client_code,
        client_name: data.client_name,
        uttai_status: data.uttai_status ?? 'clear',
        status: data.status ?? 'active',
      },
      { onConflict: 'job_code' },
    )
    .select()
    .single()
  if (error) throw new Error(`Failed to create test job: ${error.message}`)
  return job
}

export async function createTestGInvVendor(data: {
  name: string
  tax_id: string
  country: string
  compliance_status?: string
}) {
  const { data: vendor, error } = await supabaseAdmin
    .from('ginv_vendors')
    .insert({
      name: data.name,
      tax_id: data.tax_id,
      country: data.country,
      compliance_status: data.compliance_status ?? 'compliant',
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create test vendor: ${error.message}`)
  return vendor
}

export async function createTestIntakeItem(data: {
  type: 'vendor_invoice' | 'official_fee'
  job_id: string
  vendor_id?: string
  amount: number
  currency: string
  invoice_number?: string
  concept_text?: string
  status?: string
  created_by: string
}) {
  const { data: item, error } = await supabaseAdmin
    .from('ginv_intake_items')
    .insert({
      type: data.type,
      job_id: data.job_id,
      vendor_id: data.vendor_id ?? null,
      amount: data.amount,
      currency: data.currency,
      invoice_number: data.invoice_number ?? null,
      concept_text: data.concept_text ?? null,
      status: data.status ?? 'draft',
      created_by: data.created_by,
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create test intake item: ${error.message}`)
  return item
}

export async function createTestBillingBatch(data: {
  job_id: string
  created_by: string
  status?: string
  uttai_subject_obliged?: boolean
}) {
  const { data: batch, error } = await supabaseAdmin
    .from('ginv_billing_batches')
    .insert({
      job_id: data.job_id,
      created_by: data.created_by,
      status: data.status ?? 'open',
      uttai_subject_obliged: data.uttai_subject_obliged ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create test billing batch: ${error.message}`)
  return batch
}

export async function createTestClientInvoice(data: {
  batch_id?: string
  status?: string
  sap_invoice_number?: string
  created_by: string
}) {
  const { data: invoice, error } = await supabaseAdmin
    .from('ginv_client_invoices')
    .insert({
      batch_id: data.batch_id ?? null,
      status: data.status ?? 'invoice_draft',
      sap_invoice_number: data.sap_invoice_number ?? null,
      created_by: data.created_by,
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create test client invoice: ${error.message}`)
  return invoice
}

export async function cleanupGInvTestData(prefix: string) {
  // Delete in FK order (children first)
  await supabaseAdmin.from('ginv_platform_tasks').delete().ilike('platform_name', `${prefix}%`)

  const { data: invoices } = await supabaseAdmin
    .from('ginv_client_invoices')
    .select('id')
    .ilike('sap_invoice_number', `${prefix}%`)
  if (invoices?.length) {
    const invIds = invoices.map((i) => i.id)
    await supabaseAdmin.from('ginv_deliveries').delete().in('client_invoice_id', invIds)
    await supabaseAdmin.from('ginv_client_invoices').delete().in('id', invIds)
  }

  const { data: testJobs } = await supabaseAdmin
    .from('ginv_jobs')
    .select('id')
    .ilike('job_code', `${prefix}%`)
  if (testJobs?.length) {
    const jobIds = testJobs.map((j) => j.id)
    const { data: batches } = await supabaseAdmin
      .from('ginv_billing_batches')
      .select('id')
      .in('job_id', jobIds)
    if (batches?.length) {
      const batchIds = batches.map((b) => b.id)
      await supabaseAdmin.from('ginv_billing_batch_items').delete().in('batch_id', batchIds)
      await supabaseAdmin.from('ginv_billing_batches').delete().in('id', batchIds)
    }
  }

  const { data: intakeItems } = await supabaseAdmin
    .from('ginv_intake_items')
    .select('id')
    .ilike('concept_text', `${prefix}%`)
  if (intakeItems?.length) {
    const itemIds = intakeItems.map((i) => i.id)
    await supabaseAdmin.from('ginv_sap_postings').delete().in('intake_item_id', itemIds)
    await supabaseAdmin.from('ginv_intake_items').delete().in('id', itemIds)
  }

  if (testJobs?.length) {
    const jobIds = testJobs.map((j) => j.id)
    await supabaseAdmin.from('ginv_uttai_requests').delete().in('job_id', jobIds)
    await supabaseAdmin.from('ginv_jobs').delete().in('id', jobIds)
  }

  const { data: vendors } = await supabaseAdmin
    .from('ginv_vendors')
    .select('id')
    .ilike('name', `${prefix}%`)
  if (vendors?.length) {
    const vendorIds = vendors.map((v) => v.id)
    await supabaseAdmin.from('ginv_vendor_documents').delete().in('vendor_id', vendorIds)
    await supabaseAdmin.from('ginv_vendors').delete().in('id', vendorIds)
  }
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
