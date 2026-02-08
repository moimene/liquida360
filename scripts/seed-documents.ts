/**
 * LIQUIDA360 - Document Seed Runner
 * Uploads 25 test PDFs (5 certificates + 20 invoices) to Supabase Storage
 * and updates the corresponding DB records with public URLs.
 * Usage: npx tsx scripts/seed-documents.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vrzmkxjvzjphdeshmmzl.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Deterministic UUIDs (same as run-seed.ts)
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

// Certificate PDF mappings
const CERT_DOCS = [
  { file: 'C01_MX_CERT_RES_2025.pdf', certId: CERTIFICATES.MX, corrId: CORRESPONDENTS.MX },
  { file: 'C02_CL_CERT_RES_2025_SIGNED.pdf', certId: CERTIFICATES.CL, corrId: CORRESPONDENTS.CL },
  { file: 'C03_CN_CERT_RES_2025_QR.pdf', certId: CERTIFICATES.CN, corrId: CORRESPONDENTS.CN },
  { file: 'C04_US_FORM6166_2025_APOSTILLE.pdf', certId: CERTIFICATES.US, corrId: CORRESPONDENTS.US },
  { file: 'C05_CO_CERT_RES_2024_EXPIRED.pdf', certId: CERTIFICATES.CO, corrId: CORRESPONDENTS.CO },
]

// Invoice PDF mappings (4 per correspondent, ordered MX→CL→CN→US→CO)
const INVOICE_DOCS = [
  // Mexico
  { file: 'LIQ-MX-001_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000001', corrId: CORRESPONDENTS.MX },
  { file: 'LIQ-MX-002_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000002', corrId: CORRESPONDENTS.MX },
  { file: 'LIQ-MX-003_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000003', corrId: CORRESPONDENTS.MX },
  { file: 'LIQ-MX-004_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000004', corrId: CORRESPONDENTS.MX },
  // Chile
  { file: 'LIQ-CL-001_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000005', corrId: CORRESPONDENTS.CL },
  { file: 'LIQ-CL-002_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000006', corrId: CORRESPONDENTS.CL },
  { file: 'LIQ-CL-003_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000007', corrId: CORRESPONDENTS.CL },
  { file: 'LIQ-CL-004_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000008', corrId: CORRESPONDENTS.CL },
  // China
  { file: 'LIQ-CN-001_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000009', corrId: CORRESPONDENTS.CN },
  { file: 'LIQ-CN-002_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000010', corrId: CORRESPONDENTS.CN },
  { file: 'LIQ-CN-003_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000011', corrId: CORRESPONDENTS.CN },
  { file: 'LIQ-CN-004_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000012', corrId: CORRESPONDENTS.CN },
  // USA
  { file: 'LIQ-US-001_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000013', corrId: CORRESPONDENTS.US },
  { file: 'LIQ-US-002_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000014', corrId: CORRESPONDENTS.US },
  { file: 'LIQ-US-003_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000015', corrId: CORRESPONDENTS.US },
  { file: 'LIQ-US-004_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000016', corrId: CORRESPONDENTS.US },
  // Colombia
  { file: 'LIQ-CO-001_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000017', corrId: CORRESPONDENTS.CO },
  { file: 'LIQ-CO-002_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000018', corrId: CORRESPONDENTS.CO },
  { file: 'LIQ-CO-003_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000019', corrId: CORRESPONDENTS.CO },
  { file: 'LIQ-CO-004_factura.pdf', liqId: 'c1000000-0000-0000-0000-000000000020', corrId: CORRESPONDENTS.CO },
]

const DOCS_DIR = path.resolve(__dirname, '../liquida360_docs')

async function uploadFile(bucket: string, storagePath: string, localPath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath)

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) {
    throw new Error(`Upload failed for ${storagePath}: ${error.message}`)
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath)
  return urlData.publicUrl
}

async function main() {
  console.log('📄 LIQUIDA360 Document Seed')
  console.log(`   Source: ${DOCS_DIR}`)
  console.log('')

  // ── 1. Upload certificate PDFs ──
  console.log('📌 Uploading 5 certificate PDFs to bucket "documents"...')
  for (const doc of CERT_DOCS) {
    const localPath = path.join(DOCS_DIR, 'certificates', doc.file)
    const storagePath = `certificates/${doc.corrId}/${doc.file}`

    if (!fs.existsSync(localPath)) {
      console.error(`   ❌ File not found: ${localPath}`)
      continue
    }

    const publicUrl = await uploadFile('documents', storagePath, localPath)
    console.log(`   ✅ ${doc.file} → uploaded`)

    // Update certificate record
    const { error } = await supabase
      .from('certificates')
      .update({ document_url: publicUrl })
      .eq('id', doc.certId)

    if (error) {
      console.error(`   ❌ DB update failed for cert ${doc.certId}: ${error.message}`)
    } else {
      console.log(`      → document_url updated for cert ${doc.certId}`)
    }
  }

  // ── 2. Upload invoice PDFs ──
  console.log('')
  console.log('📌 Uploading 20 invoice PDFs to bucket "invoices"...')
  for (const doc of INVOICE_DOCS) {
    const localPath = path.join(DOCS_DIR, 'invoices', doc.file)
    const storagePath = `invoices/${doc.corrId}/${doc.file}`

    if (!fs.existsSync(localPath)) {
      console.error(`   ❌ File not found: ${localPath}`)
      continue
    }

    const publicUrl = await uploadFile('invoices', storagePath, localPath)
    console.log(`   ✅ ${doc.file} → uploaded`)

    // Update liquidation record
    const { error } = await supabase
      .from('liquidations')
      .update({ invoice_url: publicUrl })
      .eq('id', doc.liqId)

    if (error) {
      console.error(`   ❌ DB update failed for liq ${doc.liqId}: ${error.message}`)
    } else {
      console.log(`      → invoice_url updated for liq ${doc.liqId}`)
    }
  }

  // ── Verify ──
  console.log('')
  console.log('🔍 Verifying...')

  const { data: certs } = await supabase
    .from('certificates')
    .select('id, document_url')
    .not('document_url', 'is', null)

  const { data: liqs } = await supabase
    .from('liquidations')
    .select('id, invoice_url')
    .not('invoice_url', 'is', null)

  console.log(`   Certificates with document_url: ${certs?.length ?? 0}/5`)
  console.log(`   Liquidations with invoice_url:  ${liqs?.length ?? 0}/20`)

  console.log('')
  console.log('🎉 Document seed complete!')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
