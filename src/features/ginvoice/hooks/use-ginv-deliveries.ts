import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { GInvDelivery } from '@/types'
import { updateInvoiceIntakeLifecycleStatus } from '../lib/intake-lifecycle'

interface Recipient {
  name: string
  email: string
}

interface GInvDeliveriesState {
  deliveries: GInvDelivery[]
  loading: boolean
  error: string | null
  fetchDeliveries: () => Promise<void>
  createDelivery: (params: {
    clientInvoiceId: string
    deliveryType: string
    recipients: Recipient[]
    subject: string
    body: string
    sentBy: string
    attachments?: { file_path: string; name: string }[]
  }) => Promise<{ data?: GInvDelivery; error?: string; warning?: string }>
  markDelivered: (invoiceId: string) => Promise<{ error?: string; warning?: string }>
}

export const useGInvDeliveries = create<GInvDeliveriesState>((set, get) => ({
  deliveries: [],
  loading: false,
  error: null,

  fetchDeliveries: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('ginv_deliveries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ deliveries: data ?? [], loading: false })
  },

  createDelivery: async ({ clientInvoiceId, deliveryType, recipients, subject, body, sentBy, attachments }) => {
    const { data, error } = await supabase
      .from('ginv_deliveries')
      .insert({
        client_invoice_id: clientInvoiceId,
        delivery_type: deliveryType,
        recipients: recipients as unknown as Record<string, unknown>[],
        subject,
        body,
        sent_by: sentBy,
        sent_at: new Date().toISOString(),
        status: 'sent',
        attachments: attachments ?? [],
      })
      .select()
      .single()

    if (error) return { error: error.message }

    // Update invoice status to delivered
    await supabase
      .from('ginv_client_invoices')
      .update({ status: 'delivered' })
      .eq('id', clientInvoiceId)

    const lifecycle = await updateInvoiceIntakeLifecycleStatus(clientInvoiceId, 'archived')

    set({ deliveries: [data, ...get().deliveries] })
    if (lifecycle.error) {
      return {
        data,
        warning: `Entrega registrada, pero no se pudo archivar el lote: ${lifecycle.error}`,
      }
    }

    return { data }
  },

  markDelivered: async (invoiceId) => {
    const { error } = await supabase
      .from('ginv_client_invoices')
      .update({ status: 'delivered' })
      .eq('id', invoiceId)

    if (error) return { error: error.message }
    const lifecycle = await updateInvoiceIntakeLifecycleStatus(invoiceId, 'archived')
    if (lifecycle.error) {
      return {
        warning: `Factura marcada como entregada, pero sin archivar intake: ${lifecycle.error}`,
      }
    }
    return {}
  },
}))
