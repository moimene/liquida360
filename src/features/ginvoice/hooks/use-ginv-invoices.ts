import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { GInvClientInvoice } from '@/types'
import { updateBatchIntakeLifecycleStatus } from '../lib/intake-lifecycle'
import { buildSapInvoicePayload, getSapPayloadFxSummary } from '../lib/fx-audit'
import { deriveDueDate } from '../lib/collections'

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
  ) => Promise<{ error?: string; warning?: string }>
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
    // Ensure we keep or create a PDF for the invoice
    let existingInvoice = get().invoices.find((inv) => inv.id === id)
    if (!existingInvoice) {
      const { data: fetchedInvoice, error: fetchedInvoiceError } = await supabase
        .from('ginv_client_invoices')
        .select('*')
        .eq('id', id)
        .single()
      if (fetchedInvoiceError) return { error: fetchedInvoiceError.message }
      existingInvoice = fetchedInvoice
    }

    const existing = existingInvoice?.pdf_file_path
    let pdfPath: string | null = existing ?? null
    const warnings: string[] = []

    if (!pdfFile && !pdfPath) {
      return { error: 'Debes adjuntar el PDF de la factura para emitir en SAP.' }
    }

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

    let sapPayload: Record<string, unknown> = {}
    if (existingInvoice?.batch_id) {
      const { data: batchItems, error: batchItemsError } = await supabase
        .from('ginv_billing_batch_items')
        .select('intake_item_id,attach_fee,decision')
        .eq('batch_id', existingInvoice.batch_id)

      if (batchItemsError) {
        warnings.push(`No se pudo preparar anexos/FX del lote: ${batchItemsError.message}`)
      } else {
        const intakeIds = (batchItems ?? []).map((item) => item.intake_item_id)
        const { data: intakeItems, error: intakeError } = intakeIds.length === 0
          ? { data: [], error: null }
          : await supabase
            .from('ginv_intake_items')
            .select('id,type,currency,amount,exchange_rate_to_eur,amount_eur,file_path,invoice_number,nrc_number')
            .in('id', intakeIds)

        if (intakeError) {
          warnings.push(`No se pudo cargar detalle de conversion/justificantes: ${intakeError.message}`)
        } else {
          sapPayload = buildSapInvoicePayload(batchItems ?? [], intakeItems ?? [])
          const fxSummary = getSapPayloadFxSummary(sapPayload)
          const missingAttachmentsRaw = (sapPayload.attachment_warnings as Record<string, unknown> | undefined)?.missing_files_count
          const missingAttachments = typeof missingAttachmentsRaw === 'number' && Number.isFinite(missingAttachmentsRaw)
            ? missingAttachmentsRaw
            : 0

          if (missingAttachments > 0) {
            warnings.push(`Hay ${missingAttachments} tasa(s) sin justificante y no se anexaron automaticamente.`)
          }
          if (fxSummary.missingRatesCount > 0) {
            warnings.push(`Hay ${fxSummary.missingRatesCount} item(s) sin tipo de cambio auditable.`)
          }
        }
      }
    }

    const fxSummary = getSapPayloadFxSummary(sapPayload)
    const dueDate = deriveDueDate({
      due_date: existingInvoice?.due_date ?? null,
      sap_invoice_date: sapDate,
    })

    const { data, error } = await supabase
      .from('ginv_client_invoices')
      .update({
        sap_invoice_number: sapNumber,
        sap_invoice_date: sapDate,
        pdf_file_path: pdfPath,
        sap_payload: sapPayload,
        due_date: dueDate,
        amount_due_eur: fxSummary.totalAmountEur,
        collection_status: 'pending',
        amount_paid_eur: 0,
        paid_at: null,
        status: 'issued',
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ invoices: get().invoices.map((inv) => (inv.id === id ? data : inv)) })

    if (data.batch_id) {
      const lifecycle = await updateBatchIntakeLifecycleStatus(data.batch_id, 'billed')
      if (lifecycle.error) {
        warnings.push(`Factura emitida, pero no se pudo marcar el lote como facturado: ${lifecycle.error}`)
      }
    }

    return warnings.length > 0 ? { warning: warnings.join(' ') } : {}
  },

  requestPartnerApproval: async (id) => {
    return get().updateInvoiceStatus(id, 'pending_partner_approval')
  },

  approveAsPartner: async (id) => {
    return get().updateInvoiceStatus(id, 'ready_for_sap')
  },
}))
