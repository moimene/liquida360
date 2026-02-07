import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  channel: RealtimeChannel | null

  fetchNotifications: (userId: string) => Promise<void>
  markAsRead: (id: string) => Promise<{ error: string | null }>
  markAllAsRead: (userId: string) => Promise<{ error: string | null }>
  subscribeRealtime: (userId: string) => void
  unsubscribe: () => void
}

export const useNotifications = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  channel: null,

  fetchNotifications: async (userId) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      const notifications = data ?? []
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
        loading: false,
      })
    }
  },

  markAsRead: async (id) => {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: now })
      .eq('id', id)

    if (error) return { error: error.message }

    set({
      notifications: get().notifications.map((n) =>
        n.id === id ? { ...n, read: true, read_at: now } : n,
      ),
      unreadCount: Math.max(0, get().unreadCount - 1),
    })
    return { error: null }
  },

  markAllAsRead: async (userId) => {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: now })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) return { error: error.message }

    set({
      notifications: get().notifications.map((n) => ({
        ...n,
        read: true,
        read_at: n.read_at ?? now,
      })),
      unreadCount: 0,
    })
    return { error: null }
  },

  subscribeRealtime: (userId) => {
    // Unsubscribe from any existing channel first
    get().unsubscribe()

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          set({
            notifications: [newNotification, ...get().notifications],
            unreadCount: get().unreadCount + 1,
          })
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
}))
