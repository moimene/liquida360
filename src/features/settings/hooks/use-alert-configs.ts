import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { AlertConfig } from '@/types'
import type { AlertConfigFormData } from '../schemas/settings-schemas'
import { CERTIFICATE_ALERT_DEFAULTS } from '@/lib/constants'

interface AlertConfigsState {
  configs: AlertConfig[]
  loading: boolean
  error: string | null

  fetchConfigs: () => Promise<void>
  createConfig: (
    data: AlertConfigFormData,
    userId: string,
  ) => Promise<{ data: AlertConfig | null; error: string | null }>
  updateConfig: (
    id: string,
    data: Partial<AlertConfigFormData>,
  ) => Promise<{ error: string | null }>
  deleteConfig: (id: string) => Promise<{ error: string | null }>
  toggleEnabled: (id: string, enabled: boolean) => Promise<{ error: string | null }>
  seedDefaults: (userId: string) => Promise<void>
}

export const useAlertConfigs = create<AlertConfigsState>((set, get) => ({
  configs: [],
  loading: false,
  error: null,

  fetchConfigs: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('alert_configs')
      .select('*')
      .order('days_before_expiry', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ configs: data ?? [], loading: false })
    }
  },

  createConfig: async (formData, userId) => {
    const payload = {
      alert_type: formData.alert_type,
      days_before_expiry: formData.days_before_expiry,
      enabled: formData.enabled,
      created_by: userId,
    }

    const { data, error } = await supabase
      .from('alert_configs')
      .insert(payload)
      .select()
      .single()

    if (error) return { data: null, error: error.message }

    set({ configs: [data, ...get().configs] })
    return { data, error: null }
  },

  updateConfig: async (id, formData) => {
    const { error } = await supabase
      .from('alert_configs')
      .update(formData)
      .eq('id', id)

    if (error) return { error: error.message }

    set({
      configs: get().configs.map((c) =>
        c.id === id ? { ...c, ...formData } : c,
      ),
    })
    return { error: null }
  },

  deleteConfig: async (id) => {
    const { error } = await supabase
      .from('alert_configs')
      .delete()
      .eq('id', id)

    if (error) return { error: error.message }

    set({ configs: get().configs.filter((c) => c.id !== id) })
    return { error: null }
  },

  toggleEnabled: async (id, enabled) => {
    // Optimistic update
    set({
      configs: get().configs.map((c) =>
        c.id === id ? { ...c, enabled } : c,
      ),
    })

    const { error } = await supabase
      .from('alert_configs')
      .update({ enabled })
      .eq('id', id)

    if (error) {
      // Revert on failure
      set({
        configs: get().configs.map((c) =>
          c.id === id ? { ...c, enabled: !enabled } : c,
        ),
      })
      return { error: error.message }
    }
    return { error: null }
  },

  seedDefaults: async (userId) => {
    const { configs } = get()
    if (configs.length > 0) return

    const defaults = [
      {
        alert_type: 'certificate_expiry',
        days_before_expiry: CERTIFICATE_ALERT_DEFAULTS.FIRST_ALERT_DAYS,
        enabled: true,
        created_by: userId,
      },
      {
        alert_type: 'certificate_expiry',
        days_before_expiry: CERTIFICATE_ALERT_DEFAULTS.SECOND_ALERT_DAYS,
        enabled: true,
        created_by: userId,
      },
    ]

    // ON CONFLICT DO NOTHING handled by unique constraint
    const { error } = await supabase
      .from('alert_configs')
      .upsert(defaults, { onConflict: 'alert_type,days_before_expiry', ignoreDuplicates: true })

    if (!error) {
      await get().fetchConfigs()
    }
  },
}))
