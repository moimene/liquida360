import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { GInvIntakeItem, GInvBillingBatch, GInvBillingBatchItem } from '@/types'

type Decision = 'emit' | 'transfer' | 'discard'
type BatchIntakeSummary = Pick<
  GInvIntakeItem,
  'id' | 'type' | 'file_path' | 'invoice_number' | 'nrc_number' | 'currency' | 'amount' | 'amount_eur' | 'exchange_rate_to_eur'
>

interface GInvBillingState {
  readyItems: GInvIntakeItem[]
  batches: GInvBillingBatch[]
  batchItems: GInvBillingBatchItem[]
  batchIntakeById: Record<string, BatchIntakeSummary>
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
  setAttachFee: (batchItemId: string, attachFee: boolean) => Promise<{ error?: string }>
  updateUttaiSubjectObliged: (batchId: string, value: boolean) => Promise<{ error?: string }>
}

export const useGInvBilling = create<GInvBillingState>((set, get) => ({
  readyItems: [],
  batches: [],
  batchItems: [],
  batchIntakeById: {},
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

    const intakeItemIds = (data ?? []).map((item) => item.intake_item_id)
    if (intakeItemIds.length === 0) {
      set({ batchItems: data ?? [], batchIntakeById: {} })
      return
    }

    const { data: intakeItems, error: intakeError } = await supabase
      .from('ginv_intake_items')
      .select('id,type,file_path,invoice_number,nrc_number,currency,amount,amount_eur,exchange_rate_to_eur')
      .in('id', intakeItemIds)

    if (intakeError) {
      set({ error: intakeError.message, batchItems: data ?? [], batchIntakeById: {} })
      return
    }

    const batchIntakeById = (intakeItems ?? []).reduce<Record<string, BatchIntakeSummary>>((acc, item) => {
      acc[item.id] = item
      return acc
    }, {})

    set({ batchItems: data ?? [], batchIntakeById })
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

    const { data: intakeItems, error: intakeError } = await supabase
      .from('ginv_intake_items')
      .select('id,type,file_path')
      .in('id', intakeItemIds)

    if (intakeError) return { error: intakeError.message }
    const intakeById = new Map((intakeItems ?? []).map((item) => [item.id, item]))

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
    const batchItemsPayload = intakeItemIds.map((itemId) => {
      const intakeItem = intakeById.get(itemId)
      const attachFee = intakeItem?.type === 'official_fee' && Boolean(intakeItem.file_path)
      return {
        batch_id: batch.id,
        intake_item_id: itemId,
        attach_fee: attachFee,
      }
    })

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

  setAttachFee: async (batchItemId, attachFee) => {
    const { data, error } = await supabase
      .from('ginv_billing_batch_items')
      .update({ attach_fee: attachFee })
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
