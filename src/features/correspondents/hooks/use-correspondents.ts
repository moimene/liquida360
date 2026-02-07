import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Correspondent } from '@/types'
import type { CorrespondentFormData } from '../schemas/correspondent-schema'

interface CorrespondentsState {
  correspondents: Correspondent[]
  loading: boolean
  error: string | null

  fetchCorrespondents: () => Promise<void>
  createCorrespondent: (
    data: CorrespondentFormData,
  ) => Promise<{ data: Correspondent | null; error: string | null }>
  updateCorrespondent: (
    id: string,
    data: Partial<CorrespondentFormData>,
  ) => Promise<{ error: string | null }>
  deleteCorrespondent: (id: string) => Promise<{ error: string | null }>
}

export const useCorrespondents = create<CorrespondentsState>((set, get) => ({
  correspondents: [],
  loading: false,
  error: null,

  fetchCorrespondents: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('correspondents')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ correspondents: data ?? [], loading: false })
    }
  },

  createCorrespondent: async (formData) => {
    const payload = {
      ...formData,
      email: formData.email || null,
      phone: formData.phone || null,
    }

    const { data, error } = await supabase.from('correspondents').insert(payload).select().single()

    if (error) {
      return { data: null, error: error.message }
    }

    // Optimistic update
    set({ correspondents: [...get().correspondents, data] })
    return { data, error: null }
  },

  updateCorrespondent: async (id, formData) => {
    const payload = {
      ...formData,
      email: formData.email || null,
      phone: formData.phone || null,
    }

    const { error } = await supabase.from('correspondents').update(payload).eq('id', id)

    if (error) {
      return { error: error.message }
    }

    // Optimistic update
    set({
      correspondents: get().correspondents.map((c) => (c.id === id ? { ...c, ...payload } : c)),
    })
    return { error: null }
  },

  deleteCorrespondent: async (id) => {
    const { error } = await supabase.from('correspondents').delete().eq('id', id)

    if (error) {
      return { error: error.message }
    }

    set({
      correspondents: get().correspondents.filter((c) => c.id !== id),
    })
    return { error: null }
  },
}))
