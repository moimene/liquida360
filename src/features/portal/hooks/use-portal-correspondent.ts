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

  updateProfile: async (id, formData) => {
    const { error } = await supabase
      .from('correspondents')
      .update({
        address: formData.address,
        email: formData.email || null,
        phone: formData.phone || null,
      })
      .eq('id', id)

    if (error) return { error: error.message }

    const current = get().correspondent
    if (current) {
      set({
        correspondent: {
          ...current,
          address: formData.address,
          email: formData.email || null,
          phone: formData.phone || null,
        },
      })
    }
    return { error: null }
  },
}))
