import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Message } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface MessagesState {
  messages: Message[]
  loading: boolean
  error: string | null
  channel: RealtimeChannel | null

  fetchMessages: (conversationId: string) => Promise<void>
  sendMessage: (conversationId: string, senderId: string, content: string) => Promise<{ error: string | null }>
  subscribeRealtime: (conversationId: string) => void
  unsubscribe: () => void
  clear: () => void
}

export const useMessages = create<MessagesState>((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  channel: null,

  fetchMessages: async (conversationId) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ messages: data ?? [], loading: false })
    }
  },

  sendMessage: async (conversationId, senderId, content) => {
    const trimmed = content.trim()
    if (!trimmed) return { error: 'Mensaje vacío' }

    // Optimistic insert
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: senderId,
      content: trimmed,
      created_at: new Date().toISOString(),
    }

    set({ messages: [...get().messages, optimistic] })

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: trimmed,
      })
      .select()
      .single()

    if (error) {
      // Rollback optimistic insert
      set({
        messages: get().messages.filter((m) => m.id !== optimistic.id),
      })
      return { error: error.message }
    }

    // Replace optimistic with real
    if (data) {
      set({
        messages: get().messages.map((m) => (m.id === optimistic.id ? data : m)),
      })
    }

    return { error: null }
  },

  subscribeRealtime: (conversationId) => {
    get().unsubscribe()

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          // Avoid duplicates (from optimistic insert)
          const exists = get().messages.some((m) => m.id === newMsg.id)
          if (!exists) {
            set({ messages: [...get().messages, newMsg] })
          }
        },
      )
      .subscribe()

    set({ channel })
  },

  unsubscribe: () => {
    const { channel } = get()
    if (channel) {
      supabase.removeChannel(channel)
      set({ channel: null })
    }
  },

  clear: () => {
    get().unsubscribe()
    set({ messages: [], loading: false, error: null })
  },
}))
