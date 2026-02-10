import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { GInvVendor, GInvVendorDocument } from '@/types'
import type { VendorFormData } from '../schemas/vendor-schema'

interface GInvVendorsState {
  vendors: GInvVendor[]
  vendorDocuments: GInvVendorDocument[]
  loading: boolean
  error: string | null
  fetchVendors: () => Promise<void>
  createVendor: (data: VendorFormData) => Promise<{ data?: GInvVendor; error?: string }>
  updateVendor: (id: string, data: Partial<VendorFormData>) => Promise<{ data?: GInvVendor; error?: string }>
  fetchVendorDocuments: (vendorId: string) => Promise<void>
  addVendorDocument: (doc: {
    vendor_id: string
    doc_type: 'tax_residency_certificate' | 'partners_letter' | 'other'
    issued_at?: string | null
    expires_at?: string | null
    file_path?: string | null
  }) => Promise<{ data?: GInvVendorDocument; error?: string }>
}

export const useGInvVendors = create<GInvVendorsState>((set, get) => ({
  vendors: [],
  vendorDocuments: [],
  loading: false,
  error: null,

  fetchVendors: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('ginv_vendors')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ vendors: data ?? [], loading: false })
  },

  createVendor: async (formData) => {
    const { data, error } = await supabase
      .from('ginv_vendors')
      .insert({
        name: formData.name,
        tax_id: formData.tax_id,
        country: formData.country,
        compliance_status: formData.compliance_status,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    set({ vendors: [...get().vendors, data] })
    return { data }
  },

  updateVendor: async (id, formData) => {
    const { data, error } = await supabase
      .from('ginv_vendors')
      .update(formData)
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ vendors: get().vendors.map((v) => (v.id === id ? data : v)) })
    return { data }
  },

  fetchVendorDocuments: async (vendorId) => {
    const { data, error } = await supabase
      .from('ginv_vendor_documents')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('expires_at', { ascending: true })

    if (error) {
      set({ error: error.message })
      return
    }
    set({ vendorDocuments: data ?? [] })
  },

  addVendorDocument: async (doc) => {
    const { data, error } = await supabase
      .from('ginv_vendor_documents')
      .insert(doc)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ vendorDocuments: [...get().vendorDocuments, data] })
    return { data }
  },
}))
