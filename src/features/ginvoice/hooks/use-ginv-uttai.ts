import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { GInvUttaiRequest } from '@/types'

interface GInvUttaiState {
  requests: GInvUttaiRequest[]
  loading: boolean
  error: string | null
  fetchRequests: (jobId?: string) => Promise<void>
  requestUnblock: (jobId: string, userId: string) => Promise<{ data?: GInvUttaiRequest; error?: string }>
  resolveRequest: (requestId: string, userId: string, notes?: string) => Promise<{ error?: string }>
  updateJobUttai: (jobId: string, status: 'clear' | 'blocked' | 'pending_review') => Promise<{ error?: string }>
}

export const useGInvUttai = create<GInvUttaiState>((set, get) => ({
  requests: [],
  loading: false,
  error: null,

  fetchRequests: async (jobId) => {
    set({ loading: true, error: null })
    let query = supabase
      .from('ginv_uttai_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (jobId) {
      query = query.eq('job_id', jobId)
    }

    const { data, error } = await query

    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ requests: data ?? [], loading: false })
  },

  requestUnblock: async (jobId, userId) => {
    const { data, error } = await supabase
      .from('ginv_uttai_requests')
      .insert({
        job_id: jobId,
        requested_by: userId,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return { error: error.message }

    // Update job status to pending_review
    await supabase
      .from('ginv_jobs')
      .update({ uttai_status: 'pending_review' })
      .eq('id', jobId)

    set({ requests: [data, ...get().requests] })
    return { data }
  },

  resolveRequest: async (requestId, userId, notes) => {
    const { error } = await supabase
      .from('ginv_uttai_requests')
      .update({
        status: 'resolved',
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('id', requestId)

    if (error) return { error: error.message }

    set({
      requests: get().requests.map((r) =>
        r.id === requestId
          ? { ...r, status: 'resolved', resolved_by: userId, resolved_at: new Date().toISOString() }
          : r,
      ),
    })
    return {}
  },

  updateJobUttai: async (jobId, status) => {
    const { error } = await supabase
      .from('ginv_jobs')
      .update({ uttai_status: status })
      .eq('id', jobId)

    if (error) return { error: error.message }
    return {}
  },
}))
