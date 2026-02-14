import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Certificate } from '@/types'
import { getCertificateStatus } from '@/lib/certificate-utils'

interface PortalCertificatesState {
  certificates: Certificate[]
  loading: boolean
  error: string | null

  fetchCertificates: (correspondentId: string) => Promise<void>
  uploadCertificate: (
    correspondentId: string,
    certificateType: 'residence' | 'withholding' | 'bank_account',
    issuingCountry: string,
    issueDate: string,
    expiryDate: string,
    file?: File,
  ) => Promise<{ data: Certificate | null; error: string | null }>
}

export const usePortalCertificates = create<PortalCertificatesState>((set, get) => ({
  certificates: [],
  loading: false,
  error: null,

  fetchCertificates: async (correspondentId) => {
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

  uploadCertificate: async (
    correspondentId,
    certificateType,
    issuingCountry,
    issueDate,
    expiryDate,
    file,
  ) => {
    let documentUrl: string | null = null

    if (file) {
      const fileExt = file.name.split('.').pop()
      const filePath = `certificates/${correspondentId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) {
        return { data: null, error: `Error al subir archivo: ${uploadError.message}` }
      }

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath)
      documentUrl = urlData.publicUrl
    }

    const statusInfo = getCertificateStatus(expiryDate)

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        correspondent_id: correspondentId,
        certificate_type: certificateType,
        issuing_country: issuingCountry,
        issue_date: issueDate,
        expiry_date: expiryDate,
        document_url: documentUrl,
        status: statusInfo.status,
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }

    set({ certificates: [data, ...get().certificates] })
    return { data, error: null }
  },
}))
