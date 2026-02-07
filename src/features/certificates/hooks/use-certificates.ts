import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Certificate } from '@/types'
import type { CertificateFormData } from '../schemas/certificate-schema'
import { getCertificateStatus } from '@/lib/certificate-utils'

interface CertificatesState {
  certificates: Certificate[]
  loading: boolean
  error: string | null

  fetchCertificates: () => Promise<void>
  fetchByCorrespondent: (correspondentId: string) => Promise<void>
  createCertificate: (
    data: CertificateFormData,
    file?: File,
  ) => Promise<{ data: Certificate | null; error: string | null }>
  deleteCertificate: (id: string) => Promise<{ error: string | null }>
}

export const useCertificates = create<CertificatesState>((set, get) => ({
  certificates: [],
  loading: false,
  error: null,

  fetchCertificates: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('certificates')
      .select('*, correspondents(name, country)')
      .order('expiry_date', { ascending: true })

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ certificates: data ?? [], loading: false })
    }
  },

  fetchByCorrespondent: async (correspondentId) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('correspondent_id', correspondentId)
      .order('expiry_date', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ certificates: data ?? [], loading: false })
    }
  },

  createCertificate: async (formData, file) => {
    let documentUrl: string | null = null

    // Upload file if provided
    if (file) {
      const fileExt = file.name.split('.').pop()
      const filePath = `certificates/${formData.correspondent_id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file)

      if (uploadError) {
        return { data: null, error: `Error al subir archivo: ${uploadError.message}` }
      }

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath)

      documentUrl = urlData.publicUrl
    }

    // Calculate status
    const statusInfo = getCertificateStatus(formData.expiry_date)

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        correspondent_id: formData.correspondent_id,
        issuing_country: formData.issuing_country,
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date,
        document_url: documentUrl,
        status: statusInfo.status,
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    set({ certificates: [...get().certificates, data] })
    return { data, error: null }
  },

  deleteCertificate: async (id) => {
    const { error } = await supabase.from('certificates').delete().eq('id', id)

    if (error) {
      return { error: error.message }
    }

    set({ certificates: get().certificates.filter((c) => c.id !== id) })
    return { error: null }
  },
}))
