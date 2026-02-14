import { supabase } from '@/lib/supabase'
import type { GInvIntakeItem } from '@/types'

type IntakeLifecycleStatus = Extract<GInvIntakeItem['status'], 'billed' | 'archived'>

interface LifecycleResult {
  updated: number
  error?: string
}

export async function updateBatchIntakeLifecycleStatus(
  batchId: string,
  status: IntakeLifecycleStatus,
): Promise<LifecycleResult> {
  const { data: batchItems, error: batchItemsError } = await supabase
    .from('ginv_billing_batch_items')
    .select('intake_item_id, decision')
    .eq('batch_id', batchId)

  if (batchItemsError) return { updated: 0, error: batchItemsError.message }

  const intakeItemIds = Array.from(
    new Set(
      (batchItems ?? [])
        .filter((item) => item.decision !== 'discard')
        .map((item) => item.intake_item_id),
    ),
  )

  if (intakeItemIds.length === 0) return { updated: 0 }

  const { error: updateError } = await supabase
    .from('ginv_intake_items')
    .update({ status })
    .in('id', intakeItemIds)

  if (updateError) return { updated: 0, error: updateError.message }
  return { updated: intakeItemIds.length }
}

export async function updateInvoiceIntakeLifecycleStatus(
  invoiceId: string,
  status: IntakeLifecycleStatus,
): Promise<LifecycleResult> {
  const { data: invoice, error: invoiceError } = await supabase
    .from('ginv_client_invoices')
    .select('batch_id')
    .eq('id', invoiceId)
    .single()

  if (invoiceError) return { updated: 0, error: invoiceError.message }
  if (!invoice?.batch_id) return { updated: 0 }

  return updateBatchIntakeLifecycleStatus(invoice.batch_id, status)
}
