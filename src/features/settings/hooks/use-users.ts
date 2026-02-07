import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface InternalUser {
  id: string
  email: string
  role: string | null
  correspondent_id: string | null
  created_at: string
}

interface UsersState {
  users: InternalUser[]
  loading: boolean
  error: string | null

  fetchUsers: () => Promise<void>
  inviteUser: (
    email: string,
    role: string,
  ) => Promise<{ error: string | null; magicLink?: string | null }>
  updateRole: (userId: string, role: string) => Promise<{ error: string | null }>
}

export const useUsers = create<UsersState>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null })

    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'list' },
    })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    if (data?.error) {
      set({ error: data.error, loading: false })
      return
    }

    set({ users: data?.users ?? [], loading: false })
  },

  inviteUser: async (email, role) => {
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'invite', email, role },
    })

    if (error) return { error: error.message }
    if (data?.error) return { error: data.error }

    // Re-fetch user list to include the new user
    await get().fetchUsers()
    return { error: null, magicLink: data?.magicLink ?? null }
  },

  updateRole: async (userId, role) => {
    // Optimistic update
    const prevUsers = get().users
    set({
      users: prevUsers.map((u) =>
        u.id === userId ? { ...u, role } : u,
      ),
    })

    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'update_role', userId, role },
    })

    if (error || data?.error) {
      // Revert on failure
      set({ users: prevUsers })
      return { error: error?.message ?? data?.error ?? 'Error desconocido' }
    }

    return { error: null }
  },
}))
