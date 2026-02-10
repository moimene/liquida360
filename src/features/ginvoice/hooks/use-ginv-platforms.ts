import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { GInvPlatformTask } from '@/types'

type PlatformStatus = GInvPlatformTask['status']

interface GInvPlatformsState {
  tasks: GInvPlatformTask[]
  loading: boolean
  error: string | null
  fetchTasks: () => Promise<void>
  createTask: (params: {
    clientInvoiceId: string
    platformName: string
    clientPlatformCode?: string
    invoiceNumber?: string
    orderNumber?: string
    notes?: string
    assignedTo?: string
    slaDueAt?: string
  }) => Promise<{ data?: GInvPlatformTask; error?: string }>
  updateTaskStatus: (id: string, status: PlatformStatus) => Promise<{ error?: string }>
  completeTask: (id: string, evidenceFile?: File) => Promise<{ error?: string }>
}

export const useGInvPlatforms = create<GInvPlatformsState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('ginv_platform_tasks')
      .select('*')
      .order('sla_due_at', { ascending: true, nullsFirst: false })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ tasks: data ?? [], loading: false })
  },

  createTask: async (params) => {
    const { data, error } = await supabase
      .from('ginv_platform_tasks')
      .insert({
        client_invoice_id: params.clientInvoiceId,
        platform_name: params.platformName,
        client_platform_code: params.clientPlatformCode || null,
        invoice_number: params.invoiceNumber || null,
        order_number: params.orderNumber || null,
        notes: params.notes || null,
        assigned_to: params.assignedTo || null,
        sla_due_at: params.slaDueAt || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return { error: error.message }

    // Mark invoice as platform_required
    await supabase
      .from('ginv_client_invoices')
      .update({ status: 'platform_required' })
      .eq('id', params.clientInvoiceId)

    set({ tasks: [data, ...get().tasks] })
    return { data }
  },

  updateTaskStatus: async (id, status) => {
    const updates: Record<string, unknown> = { status }
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('ginv_platform_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ tasks: get().tasks.map((t) => (t.id === id ? data : t)) })
    return {}
  },

  completeTask: async (id, evidenceFile) => {
    let evidencePath: string | null = null

    if (evidenceFile) {
      const ext = evidenceFile.name.split('.').pop()
      const uid = crypto.randomUUID()
      const path = `platforms/${id}/${uid}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('ginv-documents')
        .upload(path, evidenceFile)

      if (uploadError) return { error: `Error subiendo evidencia: ${uploadError.message}` }
      evidencePath = path
    }

    const { data, error } = await supabase
      .from('ginv_platform_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        evidence_file_path: evidencePath,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ tasks: get().tasks.map((t) => (t.id === id ? data : t)) })

    // Check if invoice should be marked platform_completed
    if (data) {
      const { data: remaining } = await supabase
        .from('ginv_platform_tasks')
        .select('id')
        .eq('client_invoice_id', data.client_invoice_id)
        .neq('status', 'completed')

      if (remaining && remaining.length === 0) {
        await supabase
          .from('ginv_client_invoices')
          .update({ status: 'platform_completed' })
          .eq('id', data.client_invoice_id)
      }
    }

    return {}
  },
}))
