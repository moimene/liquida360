import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Correspondent } from '@/types'
import type { PortalProfileFormData } from '../schemas/portal-profile-schema'

interface PortalCorrespondentState {
  correspondent: Correspondent | null
  loading: boolean
  error: string | null

  fetchCorrespondent: (userId: string) => Promise<void>
  updateProfile: (
    id: string,
    data: PortalProfileFormData,
    bankCertificateFile?: File,
  ) => Promise<{ error: string | null }>
}

export const usePortalCorrespondent = create<PortalCorrespondentState>((set, get) => ({
  correspondent: null,
  loading: false,
  error: null,

  fetchCorrespondent: async (userId) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('correspondents')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ correspondent: data, loading: false })
    }
  },

  updateProfile: async (id, formData, bankCertificateFile) => {
    const current = get().correspondent
    const nextHolder = formData.bank_account_holder || null
    const nextIban = formData.bank_account_iban || null
    const nextSwift = formData.bank_swift_bic || null
    const nowIso = new Date().toISOString()
    const bankDataChanged = !!current && (
      current.bank_account_holder !== nextHolder ||
      current.bank_account_iban !== nextIban ||
      current.bank_swift_bic !== nextSwift
    )

    let bankCertificateUrl: string | null = current?.bank_certificate_url ?? null

    if (bankCertificateFile) {
      const fileExt = bankCertificateFile.name.split('.').pop()
      const filePath = `bank-certificates/${id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, bankCertificateFile)

      if (uploadError) return { error: `Error al subir certificado bancario: ${uploadError.message}` }

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath)
      bankCertificateUrl = urlData.publicUrl
    }

    const { error } = await supabase
      .from('correspondents')
      .update({
        address: formData.address,
        email: formData.email || null,
        phone: formData.phone || null,
        bank_account_holder: nextHolder,
        bank_account_iban: nextIban,
        bank_swift_bic: nextSwift,
        bank_certificate_url: bankCertificateUrl,
        bank_data_updated_at:
          bankDataChanged || !!bankCertificateFile
            ? nowIso
            : current?.bank_data_updated_at ?? null,
      })
      .eq('id', id)

    if (error) return { error: error.message }

    if (current) {
      set({
        correspondent: {
          ...current,
          address: formData.address,
          email: formData.email || null,
          phone: formData.phone || null,
          bank_account_holder: nextHolder,
          bank_account_iban: nextIban,
          bank_swift_bic: nextSwift,
          bank_certificate_url: bankCertificateUrl,
          bank_data_updated_at:
            bankDataChanged || !!bankCertificateFile
              ? nowIso
              : current.bank_data_updated_at,
        },
      })
    }
    return { error: null }
  },
}))
