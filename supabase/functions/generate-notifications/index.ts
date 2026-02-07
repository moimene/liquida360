// supabase/functions/generate-notifications/index.ts
// Edge Function: Generate automatic notifications for certificate expiry
// and liquidation/payment status changes
//
// Deploy: supabase functions deploy generate-notifications
// Can be triggered by:
//   1. pg_cron daily (for certificate expiry notifications)
//   2. Database webhook/trigger (for status change notifications)
//   3. Manual POST with payload

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FIRST_ALERT_DAYS = 90
const SECOND_ALERT_DAYS = 30

interface NotificationPayload {
  type: 'certificate_check' | 'liquidation_status' | 'payment_status'
  entity_id?: string
  new_status?: string
  actor_id?: string
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const payload: NotificationPayload = await req.json()
    const notifications: Array<{
      user_id: string
      type: string
      title: string
      message: string
      related_entity_type: string
      related_entity_id: string
    }> = []

    // -------------------------------------------
    // 1. Certificate expiry check (daily cron)
    // -------------------------------------------
    if (payload.type === 'certificate_check') {
      const today = new Date()

      const { data: certificates, error } = await supabase
        .from('certificates')
        .select('id, correspondent_id, expiry_date, issuing_country, correspondents(name)')
        .in('status', ['valid', 'expiring_soon'])

      if (error) throw new Error(`Fetch certs failed: ${error.message}`)

      // Get all admin users to notify
      const { data: adminUsers } = await supabase.rpc('get_users_by_role', { target_role: 'admin' })
      const { data: supervisorUsers } = await supabase.rpc('get_users_by_role', {
        target_role: 'supervisor',
      })

      const notifyUserIds = [
        ...(adminUsers ?? []).map((u: { id: string }) => u.id),
        ...(supervisorUsers ?? []).map((u: { id: string }) => u.id),
      ]

      for (const cert of certificates ?? []) {
        const expiryDate = new Date(cert.expiry_date)
        const daysRemaining = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        )

        const corrName =
          (cert as unknown as { correspondents: { name: string } }).correspondents?.name ?? '—'

        // Notify at exact threshold days
        if (daysRemaining === FIRST_ALERT_DAYS || daysRemaining === SECOND_ALERT_DAYS) {
          for (const userId of notifyUserIds) {
            notifications.push({
              user_id: userId,
              type: 'certificate_expiring',
              title: `Certificado por vencer en ${daysRemaining} días`,
              message: `El certificado de ${corrName} (${cert.issuing_country}) vence el ${cert.expiry_date}.`,
              related_entity_type: 'certificate',
              related_entity_id: cert.id,
            })
          }
        }

        // Already expired
        if (daysRemaining < 0) {
          for (const userId of notifyUserIds) {
            notifications.push({
              user_id: userId,
              type: 'certificate_expired',
              title: `Certificado vencido`,
              message: `El certificado de ${corrName} (${cert.issuing_country}) ha vencido.`,
              related_entity_type: 'certificate',
              related_entity_id: cert.id,
            })
          }
        }
      }
    }

    // -------------------------------------------
    // 2. Liquidation status change
    // -------------------------------------------
    if (payload.type === 'liquidation_status' && payload.entity_id && payload.new_status) {
      const { data: liq, error } = await supabase
        .from('liquidations')
        .select('id, correspondent_id, concept, amount, currency, created_by, correspondents(name)')
        .eq('id', payload.entity_id)
        .single()

      if (error || !liq) throw new Error(`Liquidation not found: ${error?.message}`)

      const corrName =
        (liq as unknown as { correspondents: { name: string } }).correspondents?.name ?? '—'

      const statusLabels: Record<string, string> = {
        pending_approval: 'enviada a aprobación',
        approved: 'aprobada',
        rejected: 'rechazada',
        payment_requested: 'solicitada para pago',
        paid: 'marcada como pagada',
      }

      const label = statusLabels[payload.new_status] ?? payload.new_status

      // Notify the liquidation creator
      notifications.push({
        user_id: liq.created_by,
        type:
          payload.new_status === 'approved'
            ? 'liquidation_approved'
            : payload.new_status === 'rejected'
              ? 'liquidation_rejected'
              : 'liquidation_approved',
        title: `Liquidación ${label}`,
        message: `La liquidación de ${corrName} por ${liq.amount} ${liq.currency} ha sido ${label}.`,
        related_entity_type: 'liquidation',
        related_entity_id: liq.id,
      })

      // If payment_requested, also notify financiero users
      if (payload.new_status === 'payment_requested') {
        const { data: financieroUsers } = await supabase.rpc('get_users_by_role', {
          target_role: 'financiero',
        })
        for (const user of financieroUsers ?? []) {
          notifications.push({
            user_id: user.id,
            type: 'payment_requested',
            title: 'Nueva solicitud de pago',
            message: `Solicitud de pago para ${corrName}: ${liq.amount} ${liq.currency} — ${liq.concept}`,
            related_entity_type: 'payment_request',
            related_entity_id: liq.id,
          })
        }
      }
    }

    // -------------------------------------------
    // 3. Payment request status change
    // -------------------------------------------
    if (payload.type === 'payment_status' && payload.entity_id && payload.new_status) {
      const { data: pr, error } = await supabase
        .from('payment_requests')
        .select('id, liquidation_id, liquidations(correspondent_id, amount, currency, created_by, correspondents(name))')
        .eq('id', payload.entity_id)
        .single()

      if (error || !pr) throw new Error(`Payment request not found: ${error?.message}`)

      const liqData = (pr as unknown as {
        liquidations: {
          created_by: string
          amount: number
          currency: string
          correspondents: { name: string }
        }
      }).liquidations

      const corrName = liqData?.correspondents?.name ?? '—'

      const statusLabels: Record<string, string> = {
        in_progress: 'en proceso',
        paid: 'completado',
        rejected: 'rechazado',
      }

      const label = statusLabels[payload.new_status] ?? payload.new_status

      // Notify the liquidation creator
      if (liqData?.created_by) {
        notifications.push({
          user_id: liqData.created_by,
          type: payload.new_status === 'paid' ? 'payment_completed' : 'payment_requested',
          title: `Pago ${label}`,
          message: `El pago de ${liqData.amount} ${liqData.currency} a ${corrName} ha sido ${label}.`,
          related_entity_type: 'payment_request',
          related_entity_id: pr.id,
        })
      }
    }

    // -------------------------------------------
    // Insert all generated notifications
    // -------------------------------------------
    let inserted = 0
    if (notifications.length > 0) {
      const { error: insertError, count } = await supabase
        .from('notifications')
        .insert(notifications)

      if (insertError) {
        throw new Error(`Failed to insert notifications: ${insertError.message}`)
      }
      inserted = notifications.length
    }

    const summary = {
      type: payload.type,
      notificationsGenerated: inserted,
    }

    console.log('Notifications generated:', JSON.stringify(summary))

    return new Response(JSON.stringify(summary), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Notification generation failed:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
