import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { GInvJob } from '@/types'
import type { JobFormData } from '../schemas/job-schema'

interface GInvJobsState {
  jobs: GInvJob[]
  loading: boolean
  error: string | null
  fetchJobs: () => Promise<void>
  createJob: (data: JobFormData) => Promise<{ data?: GInvJob; error?: string }>
  updateJob: (id: string, data: Partial<JobFormData>) => Promise<{ data?: GInvJob; error?: string }>
  importJobsCsv: (rows: JobFormData[]) => Promise<{ imported: number; errors: string[] }>
}

export const useGInvJobs = create<GInvJobsState>((set, get) => ({
  jobs: [],
  loading: false,
  error: null,

  fetchJobs: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('ginv_jobs')
      .select('*')
      .order('job_code', { ascending: true })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ jobs: data ?? [], loading: false })
  },

  createJob: async (formData) => {
    const payload = {
      job_code: formData.job_code,
      client_code: formData.client_code,
      client_name: formData.client_name,
      uttai_status: formData.uttai_status,
      uttai_subject_obliged: formData.uttai_subject_obliged ?? null,
      owner_user_id: formData.owner_user_id || null,
      status: formData.status || 'active',
    }

    const { data, error } = await supabase
      .from('ginv_jobs')
      .insert(payload)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ jobs: [...get().jobs, data] })
    return { data }
  },

  updateJob: async (id, formData) => {
    const { data, error } = await supabase
      .from('ginv_jobs')
      .update(formData)
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }
    set({ jobs: get().jobs.map((j) => (j.id === id ? data : j)) })
    return { data }
  },

  importJobsCsv: async (rows) => {
    let imported = 0
    const errors: string[] = []

    for (const row of rows) {
      const { error } = await get().createJob(row)
      if (error) {
        errors.push(`${row.job_code}: ${error}`)
      } else {
        imported++
      }
    }

    // Refresh full list after import
    if (imported > 0) await get().fetchJobs()
    return { imported, errors }
  },
}))
