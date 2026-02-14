import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { GInvIntakeItem, GInvSapPosting } from '@/types'

interface GInvAccountingState {
  items: GInvIntakeItem[]
  postings: GInvSapPosting[]
  loading: boolean
  error: string | null
  fetchAccountingQueue: () => Promise<void>
  postToSap: (
    intakeItemId: string,
    sapReference: string,
    postedBy: string,
    notes?: string,
  ) => Promise<{ error?: string }>
  sendToAccounting: (intakeItemId: string) => Promise<{ error?: string }>
}

export const useGInvAccounting = create<GInvAccountingState>((set, get) => ({
  items: [],
  postings: [],
  loading: false,
  error: null,

  fetchAccountingQueue: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('ginv_intake_items')
      .select('*')
      .in('status', ['approved', 'sent_to_accounting', 'posted'])
      .order('created_at', { ascending: true })

    const { data: postingData, error: postingsError } = await supabase
      .from('ginv_sap_postings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    if (postingsError) {
      set({ error: postingsError.message, loading: false })
      return
    }

    set({ items: data ?? [], postings: postingData ?? [], loading: false })
  },

  sendToAccounting: async (intakeItemId) => {
    const { data, error } = await supabase
      .from('ginv_intake_items')
      .update({ status: 'sent_to_accounting' })
      .eq('id', intakeItemId)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ items: get().items.map((i) => (i.id === intakeItemId ? data : i)) })
    return {}
  },

  postToSap: async (intakeItemId, sapReference, postedBy, notes) => {
    // 1. Create SAP posting record
    const { data: posting, error: postError } = await supabase
      .from('ginv_sap_postings')
      .insert({
        intake_item_id: intakeItemId,
        sap_reference: sapReference,
        posted_at: new Date().toISOString(),
        posted_by: postedBy,
        notes: notes || null,
      })
      .select()
      .single()

    if (postError) return { error: postError.message }

    // 2. Update intake item status to 'posted'
    const { data, error: updateError } = await supabase
      .from('ginv_intake_items')
      .update({ status: 'posted' })
      .eq('id', intakeItemId)
      .select()
      .single()

    if (updateError) return { error: updateError.message }
    set({
      items: get().items.map((i) => (i.id === intakeItemId ? data : i)),
      postings: posting ? [posting, ...get().postings] : get().postings,
    })
    return {}
  },
}))
