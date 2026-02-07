// supabase/functions/check-certificates/index.ts
// Edge Function: Daily cron job to evaluate certificate expiry status
// Schedule: Run daily via pg_cron or Supabase Cron (0 6 * * *)
//
// Deploy: supabase functions deploy check-certificates
// Cron setup: supabase functions schedule check-certificates --cron "0 6 * * *"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FIRST_ALERT_DAYS = 90
const SECOND_ALERT_DAYS = 30

interface Certificate {
  id: string
  correspondent_id: string
  issuing_country: string
  expiry_date: string
  status: string
}

interface Correspondent {
  id: string
  name: string
}

Deno.serve(async (req) => {
  try {
    // Only allow POST (from cron) or GET (for manual trigger)
    if (req.method !== 'POST' && req.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Fetch all certificates that aren't already marked as expired
    const { data: certificates, error: certError } = await supabase
      .from('certificates')
      .select('id, correspondent_id, issuing_country, expiry_date, status')
      .order('expiry_date', { ascending: true })

    if (certError) {
      throw new Error(`Failed to fetch certificates: ${certError.message}`)
    }

    let updatedExpired = 0
    let updatedExpiringSoon = 0

    for (const cert of certificates as Certificate[]) {
      const expiryDate = new Date(cert.expiry_date)
      const diffMs = expiryDate.getTime() - today.getTime()
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      let newStatus: string | null = null

      if (daysRemaining < 0 && cert.status !== 'expired') {
        newStatus = 'expired'
        updatedExpired++
      } else if (
        daysRemaining >= 0 &&
        daysRemaining <= FIRST_ALERT_DAYS &&
        cert.status === 'valid'
      ) {
        newStatus = 'expiring_soon'
        updatedExpiringSoon++
      }

      if (newStatus) {
        const { error: updateError } = await supabase
          .from('certificates')
          .update({ status: newStatus })
          .eq('id', cert.id)

        if (updateError) {
          console.error(`Failed to update certificate ${cert.id}: ${updateError.message}`)
        }
      }
    }

    const summary = {
      date: todayStr,
      totalCertificates: certificates.length,
      updatedToExpired: updatedExpired,
      updatedToExpiringSoon: updatedExpiringSoon,
    }

    console.log('Certificate check completed:', JSON.stringify(summary))

    return new Response(JSON.stringify(summary), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Certificate check failed:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
