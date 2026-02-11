import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { GInvIntakeItem, GInvBillingBatch, GInvBillingBatchItem } from '@/types'

type Decision = 'emit' | 'transfer' | 'discard'

interface GInvBillingState {
  readyItems: GInvIntakeItem[]
  batches: GInvBillingBatch[]
  batchItems: GInvBillingBatchItem[]
  loading: boolean
  error: string | null
  fetchReadyToBill: () => Promise<void>
  fetchBatches: () => Promise<void>
  fetchBatchItems: (batchId: string) => Promise<void>
  markReadyToBill: (intakeItemId: string) => Promise<{ error?: string }>
  createBatch: (
    jobId: string,
    intakeItemIds: string[],
    createdBy: string,
    uttaiSubjectObliged?: boolean | null,
  ) => Promise<{ data?: GInvBillingBatch; error?: string }>
  setDecision: (batchItemId: string, decision: Decision) => Promise<{ error?: string }>
  updateUttaiSubjectObliged: (batchId: string, value: boolean) => Promise<{ error?: string }>
}

export const useGInvBilling = create<GInvBillingState>((set, get) => ({
  readyItems: [],
  batches: [],
  batchItems: [],
  loading: false,
  error: null,

  fetchReadyToBill: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('ginv_intake_items')
      .select('*')
      .in('status', ['posted', 'ready_to_bill'])
      .order('created_at', { ascending: true })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ readyItems: data ?? [], loading: false })
  },

  fetchBatches: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('ginv_billing_batches')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ batches: data ?? [], loading: false })
  },

  fetchBatchItems: async (batchId) => {
    const { data, error } = await supabase
      .from('ginv_billing_batch_items')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true })

    if (error) {
      set({ error: error.message })
      return
    }
    set({ batchItems: data ?? [] })
  },

  markReadyToBill: async (intakeItemId) => {
    const { data, error } = await supabase
      .from('ginv_intake_items')
      .update({ status: 'ready_to_bill' })
      .eq('id', intakeItemId)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ readyItems: get().readyItems.map((i) => (i.id === intakeItemId ? data : i)) })
    return {}
  },

  createBatch: async (jobId, intakeItemIds, createdBy, uttaiSubjectObliged) => {
    // Guard: UTTAI bloqueado no permite avanzar
    const { data: job } = await supabase
      .from('ginv_jobs')
      .select('uttai_status')
      .eq('id', jobId)
      .single()
    if (job?.uttai_status === 'blocked') {
      return { error: 'El Job está bloqueado por UTTAI. Debe desbloquearse antes de facturar.' }
    }

    // 1. Create batch
    const { data: batch, error: batchError } = await supabase
      .from('ginv_billing_batches')
      .insert({
        job_id: jobId,
        created_by: createdBy,
        status: 'draft',
        uttai_subject_obliged: uttaiSubjectObliged ?? null,
      })
      .select()
      .single()

    if (batchError) return { error: batchError.message }

    // 2. Create batch items
    const batchItemsPayload = intakeItemIds.map((itemId) => ({
      batch_id: batch.id,
      intake_item_id: itemId,
    }))

    const { error: itemsError } = await supabase
      .from('ginv_billing_batch_items')
      .insert(batchItemsPayload)

    if (itemsError) return { error: itemsError.message }

    // 3. Update intake items status
    const { error: updateError } = await supabase
      .from('ginv_intake_items')
      .update({ status: 'ready_to_bill' })
      .in('id', intakeItemIds)

    if (updateError) return { error: updateError.message }

    set({ batches: [batch, ...get().batches] })
    return { data: batch }
  },

  setDecision: async (batchItemId, decision) => {
    const { data, error } = await supabase
      .from('ginv_billing_batch_items')
      .update({ decision })
      .eq('id', batchItemId)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ batchItems: get().batchItems.map((bi) => (bi.id === batchItemId ? data : bi)) })
    return {}
  },

  updateUttaiSubjectObliged: async (batchId, value) => {
    const { data, error } = await supabase
      .from('ginv_billing_batches')
      .update({ uttai_subject_obliged: value })
      .eq('id', batchId)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ batches: get().batches.map((b) => (b.id === batchId ? data : b)) })
    return {}
  },
}))
