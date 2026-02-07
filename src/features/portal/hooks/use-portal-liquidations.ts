import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Liquidation } from '@/types'
import type { PortalInvoiceFormData } from '../schemas/portal-invoice-schema'

interface PortalLiquidationsState {
  liquidations: Liquidation[]
  loading: boolean
  error: string | null

  fetchLiquidations: (correspondentId: string) => Promise<void>
  createInvoice: (
    data: PortalInvoiceFormData,
    correspondentId: string,
    userId: string,
    file?: File,
  ) => Promise<{ data: Liquidation | null; error: string | null }>
  submitForApproval: (id: string) => Promise<{ error: string | null }>
}

export const usePortalLiquidations = create<PortalLiquidationsState>((set, get) => ({
  liquidations: [],
  loading: false,
  error: null,

  fetchLiquidations: async (correspondentId) => {
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

  createInvoice: async (formData, correspondentId, userId, file) => {
    let invoiceUrl: string | null = null

    // Upload invoice PDF if provided
    if (file) {
      const fileExt = file.name.split('.').pop()
      const filePath = `invoices/${correspondentId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, file)

      if (uploadError) {
        return { data: null, error: `Error al subir factura: ${uploadError.message}` }
      }

      const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(filePath)
      invoiceUrl = urlData.publicUrl
    }

    const { data, error } = await supabase
      .from('liquidations')
      .insert({
        correspondent_id: correspondentId,
        amount: formData.amount,
        currency: formData.currency,
        concept: formData.concept,
        reference: formData.reference || null,
        invoice_url: invoiceUrl,
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
}))
