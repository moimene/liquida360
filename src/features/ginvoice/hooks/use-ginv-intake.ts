import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { GInvIntakeItem } from '@/types'
import type { IntakeFormData } from '../schemas/intake-schema'
import { resolveFxToEur } from '../lib/fx-audit'

interface GInvIntakeState {
  items: GInvIntakeItem[]
  loading: boolean
  error: string | null
  fetchItems: (filters?: { status?: string; type?: string }) => Promise<void>
  createItem: (data: IntakeFormData, userId: string, file?: File) => Promise<{ data?: GInvIntakeItem; error?: string }>
  updateItem: (id: string, data: Partial<GInvIntakeItem>) => Promise<{ data?: GInvIntakeItem; error?: string }>
  submitItem: (id: string) => Promise<{ error?: string }>
  approveItem: (id: string) => Promise<{ error?: string }>
  rejectItem: (id: string) => Promise<{ error?: string }>
}

export const useGInvIntake = create<GInvIntakeState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async (filters) => {
    set({ loading: true, error: null })
    let query = supabase
      .from('ginv_intake_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status as GInvIntakeItem['status'])
    }
    if (filters?.type) {
      query = query.eq('type', filters.type as GInvIntakeItem['type'])
    }

    const { data, error } = await query

    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ items: data ?? [], loading: false })
  },

  createItem: async (formData, userId, file) => {
    // 0. Validation & snapshots
    // UTTAI block check
    let uttaiSnapshot: GInvIntakeItem['uttai_status_snapshot'] = null
    if (formData.job_id) {
      const { data: job } = await supabase
        .from('ginv_jobs')
        .select('uttai_status')
        .eq('id', formData.job_id)
        .single()
      if (job?.uttai_status === 'blocked') {
        return { error: 'Job bloqueado por UTTAI. Solicita desbloqueo antes de continuar.' }
      }
      uttaiSnapshot = job?.uttai_status as GInvIntakeItem['uttai_status_snapshot']
    }

    // Vendor compliance + duplicate check for vendor invoices
    let vendorCompliance: GInvIntakeItem['vendor_compliance_snapshot'] = null
    if (formData.type === 'vendor_invoice' && formData.vendor_id) {
      const { data: vendor } = await supabase
        .from('ginv_vendors')
        .select('compliance_status')
        .eq('id', formData.vendor_id)
        .single()
      if (vendor) {
        vendorCompliance = vendor.compliance_status as GInvIntakeItem['vendor_compliance_snapshot']
        if (vendor.compliance_status === 'non_compliant') {
          return { error: 'Proveedor no cumple (certificados). Sube documentos o solicita revisión.' }
        }
      }

      if (formData.invoice_number) {
        const { data: dup } = await supabase
          .from('ginv_intake_items')
          .select('id')
          .eq('vendor_id', formData.vendor_id)
          .eq('invoice_number', formData.invoice_number)
          .eq('amount', formData.amount)
          .limit(1)
        if (dup && dup.length > 0) {
          return { error: 'Posible duplicado: misma factura, proveedor e importe ya registrados.' }
        }
      }
    }

    let filePath: string | null = null

    // Upload file to private bucket if provided
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `intake/${userId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('ginv-documents')
        .upload(path, file)

      if (uploadError) return { error: `Error al subir archivo: ${uploadError.message}` }
      filePath = path
    }

    const fxResolved = resolveFxToEur({
      currency: formData.currency,
      amount: formData.amount,
      exchangeRateToEur: formData.exchange_rate_to_eur,
    })
    if (!fxResolved.value) {
      return { error: fxResolved.error }
    }

    const payload = {
      type: formData.type,
      vendor_id: formData.vendor_id || null,
      job_id: formData.job_id || null,
      currency: formData.currency,
      amount: formData.amount,
      amount_eur: fxResolved.value.amountEur,
      exchange_rate_to_eur: fxResolved.value.exchangeRateToEur,
      invoice_number: formData.invoice_number || null,
      nrc_number: formData.nrc_number || null,
      invoice_date: formData.invoice_date || null,
      concept_text: formData.concept_text || null,
      official_organism: formData.official_organism || null,
      tariff_type: formData.tariff_type || null,
      approver_user_id: formData.approver_user_id || null,
      uttai_status_snapshot: uttaiSnapshot,
      vendor_compliance_snapshot: vendorCompliance,
      file_path: filePath,
      created_by: userId,
      status: 'draft' as const,
    }

    const { data, error } = await supabase
      .from('ginv_intake_items')
      .insert(payload)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ items: [data, ...get().items] })
    return { data }
  },

  updateItem: async (id, updates) => {
    const { data, error } = await supabase
      .from('ginv_intake_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ items: get().items.map((i) => (i.id === id ? data : i)) })
    return { data }
  },

  submitItem: async (id) => {
    const { error } = await get().updateItem(id, { status: 'submitted' })
    return { error }
  },

  approveItem: async (id) => {
    const { error } = await get().updateItem(id, { status: 'approved' })
    return { error }
  },

  rejectItem: async (id) => {
    const { error } = await get().updateItem(id, { status: 'rejected' })
    return { error }
  },
}))
