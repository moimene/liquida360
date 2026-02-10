import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { GInvClientInvoice } from '@/types'

type InvoiceStatus = GInvClientInvoice['status']

interface GInvInvoicesState {
  invoices: GInvClientInvoice[]
  loading: boolean
  error: string | null
  fetchInvoices: () => Promise<void>
  createInvoice: (batchId: string, createdBy: string) => Promise<{ data?: GInvClientInvoice; error?: string }>
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<{ error?: string }>
  registerSapInvoice: (
    id: string,
    sapNumber: string,
    sapDate: string,
    pdfFile?: File,
  ) => Promise<{ error?: string }>
  requestPartnerApproval: (id: string) => Promise<{ error?: string }>
  approveAsPartner: (id: string) => Promise<{ error?: string }>
}

export const useGInvInvoices = create<GInvInvoicesState>((set, get) => ({
  invoices: [],
  loading: false,
  error: null,

  fetchInvoices: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('ginv_client_invoices')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ invoices: data ?? [], loading: false })
  },

  createInvoice: async (batchId, createdBy) => {
    const { data, error } = await supabase
      .from('ginv_client_invoices')
      .insert({
        batch_id: batchId,
        created_by: createdBy,
        status: 'invoice_draft',
      })
      .select()
      .single()

    if (error) return { error: error.message }
    set({ invoices: [data, ...get().invoices] })
    return { data }
  },

  updateInvoiceStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('ginv_client_invoices')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ invoices: get().invoices.map((inv) => (inv.id === id ? data : inv)) })
    return {}
  },

  registerSapInvoice: async (id, sapNumber, sapDate, pdfFile) => {
    let pdfPath: string | null = null

    if (pdfFile) {
      const ext = pdfFile.name.split('.').pop()
      const uid = crypto.randomUUID()
      const path = `invoices/${id}/${uid}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('ginv-documents')
        .upload(path, pdfFile)

      if (uploadError) return { error: `Error subiendo PDF: ${uploadError.message}` }
      pdfPath = path
    }

    const { data, error } = await supabase
      .from('ginv_client_invoices')
      .update({
        sap_invoice_number: sapNumber,
        sap_invoice_date: sapDate,
        pdf_file_path: pdfPath,
        status: 'issued',
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ invoices: get().invoices.map((inv) => (inv.id === id ? data : inv)) })
    return {}
  },

  requestPartnerApproval: async (id) => {
    return get().updateInvoiceStatus(id, 'pending_partner_approval')
  },

  approveAsPartner: async (id) => {
    return get().updateInvoiceStatus(id, 'ready_for_sap')
  },
}))
