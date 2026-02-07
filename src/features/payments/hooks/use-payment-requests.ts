import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { PaymentRequest } from '@/types'

interface PaymentRequestsState {
  requests: PaymentRequest[]
  loading: boolean
  error: string | null

  fetchRequests: () => Promise<void>
  fetchByLiquidation: (liquidationId: string) => Promise<PaymentRequest | null>
  createRequest: (
    liquidationId: string,
  ) => Promise<{ data: PaymentRequest | null; error: string | null }>
  markInProgress: (id: string, userId: string) => Promise<{ error: string | null }>
  markPaid: (id: string, userId: string, notes?: string) => Promise<{ error: string | null }>
  rejectRequest: (id: string, userId: string, notes?: string) => Promise<{ error: string | null }>
}

export const usePaymentRequests = create<PaymentRequestsState>((set, get) => ({
  requests: [],
  loading: false,
  error: null,

  fetchRequests: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*, liquidations(*, correspondents(name, country))')
      .order('requested_at', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ requests: data ?? [], loading: false })
    }
  },

  fetchByLiquidation: async (liquidationId) => {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('liquidation_id', liquidationId)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return null
    return data
  },

  createRequest: async (liquidationId) => {
    // 1. Create the payment request
    const { data, error } = await supabase
      .from('payment_requests')
      .insert({
        liquidation_id: liquidationId,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }

    // 2. Update the liquidation status to payment_requested
    const { error: liqError } = await supabase
      .from('liquidations')
      .update({ status: 'payment_requested' })
      .eq('id', liquidationId)

    if (liqError) {
      // Rollback: delete the payment request
      await supabase.from('payment_requests').delete().eq('id', data.id)
      return { data: null, error: liqError.message }
    }

    set({ requests: [data, ...get().requests] })
    return { data, error: null }
  },

  markInProgress: async (id, userId) => {
    const { error } = await supabase
      .from('payment_requests')
      .update({
        status: 'in_progress',
        processed_by: userId,
      })
      .eq('id', id)

    if (error) return { error: error.message }

    set({
      requests: get().requests.map((r) =>
        r.id === id ? { ...r, status: 'in_progress' as const, processed_by: userId } : r,
      ),
    })
    return { error: null }
  },

  markPaid: async (id, userId, notes) => {
    const now = new Date().toISOString()

    // 1. Update payment request
    const { error } = await supabase
      .from('payment_requests')
      .update({
        status: 'paid',
        processed_by: userId,
        processed_at: now,
        notes: notes || null,
      })
      .eq('id', id)

    if (error) return { error: error.message }

    // 2. Also update the linked liquidation to 'paid'
    const request = get().requests.find((r) => r.id === id)
    if (request) {
      await supabase
        .from('liquidations')
        .update({ status: 'paid' })
        .eq('id', request.liquidation_id)
    }

    set({
      requests: get().requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'paid' as const,
              processed_by: userId,
              processed_at: now,
              notes: notes || null,
            }
          : r,
      ),
    })
    return { error: null }
  },

  rejectRequest: async (id, userId, notes) => {
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('payment_requests')
      .update({
        status: 'rejected',
        processed_by: userId,
        processed_at: now,
        notes: notes || null,
      })
      .eq('id', id)

    if (error) return { error: error.message }

    set({
      requests: get().requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'rejected' as const,
              processed_by: userId,
              processed_at: now,
              notes: notes || null,
            }
          : r,
      ),
    })
    return { error: null }
  },
}))
