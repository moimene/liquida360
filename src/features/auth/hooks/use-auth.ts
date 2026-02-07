import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  role: UserRole | null
  correspondentId: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ data: { user: User | null } | null; error: string | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

function extractAuth(session: Session | null) {
  const role = (session?.user?.app_metadata?.role as UserRole) ?? null
  const correspondentId = (session?.user?.app_metadata?.correspondent_id as string) ?? null
  return { role, correspondentId }
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  session: null,
  role: null,
  correspondentId: null,
  loading: true,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const { role, correspondentId } = extractAuth(session)
      set({ session, user: session?.user ?? null, role, correspondentId, loading: false })

      supabase.auth.onAuthStateChange((_event, session) => {
        const { role, correspondentId } = extractAuth(session)
        set({ session, user: session?.user ?? null, role, correspondentId })
      })
    } catch {
      set({ loading: false })
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    // Update store immediately with session from response (don't rely on onAuthStateChange)
    const { role, correspondentId } = extractAuth(data.session)
    set({
      session: data.session,
      user: data.session?.user ?? null,
      role,
      correspondentId,
      loading: false,
    })
    return { error: null }
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, role: null, correspondentId: null })
  },
}))
