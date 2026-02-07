import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Liquidation } from '@/types'
import type { LiquidationFormData } from '../schemas/liquidation-schema'

interface LiquidationsState {
  liquidations: Liquidation[]
  loading: boolean
  error: string | null

  fetchLiquidations: () => Promise<void>
  fetchByCorrespondent: (correspondentId: string) => Promise<void>
  createLiquidation: (
    data: LiquidationFormData,
    userId: string,
    certificateId?: string,
  ) => Promise<{ data: Liquidation | null; error: string | null }>
  submitForApproval: (id: string) => Promise<{ error: string | null }>
  approve: (id: string, userId: string) => Promise<{ error: string | null }>
  reject: (id: string) => Promise<{ error: string | null }>
}

export const useLiquidations = create<LiquidationsState>((set, get) => ({
  liquidations: [],
  loading: false,
  error: null,

  fetchLiquidations: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('liquidations')
      .select('*, correspondents(name, country)')
      .order('created_at', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ liquidations: data ?? [], loading: false })
    }
  },

  fetchByCorrespondent: async (correspondentId) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('liquidations')
      .select('*')
      .eq('correspondent_id', correspondentId)
      .order('created_at', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ liquidations: data ?? [], loading: false })
    }
  },

  createLiquidation: async (formData, userId, certificateId) => {
    const { data, error } = await supabase
      .from('liquidations')
      .insert({
        correspondent_id: formData.correspondent_id,
        amount: formData.amount,
        currency: formData.currency,
        concept: formData.concept,
        reference: formData.reference || null,
        certificate_id: certificateId ?? null,
        created_by: userId,
        status: 'draft',
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }

    set({ liquidations: [data, ...get().liquidations] })
    return { data, error: null }
  },

  submitForApproval: async (id) => {
    const { error } = await supabase
      .from('liquidations')
      .update({ status: 'pending_approval' })
      .eq('id', id)

    if (error) return { error: error.message }

    set({
      liquidations: get().liquidations.map((l) =>
        l.id === id ? { ...l, status: 'pending_approval' as const } : l,
      ),
    })
    return { error: null }
  },

  approve: async (id, userId) => {
    const { error } = await supabase
      .from('liquidations')
      .update({ status: 'approved', approved_by: userId })
      .eq('id', id)

    if (error) return { error: error.message }

    set({
      liquidations: get().liquidations.map((l) =>
        l.id === id ? { ...l, status: 'approved' as const, approved_by: userId } : l,
      ),
    })
    return { error: null }
  },

  reject: async (id) => {
    const { error } = await supabase
      .from('liquidations')
      .update({ status: 'rejected' })
      .eq('id', id)

    if (error) return { error: error.message }

    set({
      liquidations: get().liquidations.map((l) =>
        l.id === id ? { ...l, status: 'rejected' as const } : l,
      ),
    })
    return { error: null }
  },
}))
