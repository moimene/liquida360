import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types'

interface UsersListState {
  users: UserProfile[]
  loading: boolean
  error: string | null

  fetchUsers: () => Promise<void>
}

export const useUsersList = create<UsersListState>((set) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('full_name', { ascending: true })

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ users: data ?? [], loading: false })
    }
  },
}))
