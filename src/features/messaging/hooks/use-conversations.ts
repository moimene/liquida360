import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Conversation, UserProfile } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface ConversationWithDetails extends Conversation {
  participants: UserProfile[]
  lastMessage: { content: string; sender_id: string; created_at: string } | null
  unreadCount: number
}

interface ConversationsState {
  conversations: ConversationWithDetails[]
  loading: boolean
  error: string | null
  channel: RealtimeChannel | null

  fetchConversations: (userId: string) => Promise<void>
  createConversation: (
    creatorId: string,
    participantIds: string[],
    title?: string,
    isGroup?: boolean,
  ) => Promise<string | null>
  markConversationRead: (conversationId: string, userId: string) => Promise<void>
  subscribeRealtime: (userId: string) => void
  unsubscribe: () => void
}

export const useConversations = create<ConversationsState>((set, get) => ({
  conversations: [],
  loading: false,
  error: null,
  channel: null,

  fetchConversations: async (userId) => {
    set({ loading: true, error: null })

    // 1. Get all conversation IDs for this user
    const { data: participations, error: pError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)

    if (pError) {
      set({ error: pError.message, loading: false })
      return
    }

    if (!participations || participations.length === 0) {
      set({ conversations: [], loading: false })
      return
    }

    const conversationIds = participations.map((p) => p.conversation_id)
    const lastReadMap: Record<string, string> = {}
    for (const p of participations) {
      lastReadMap[p.conversation_id] = p.last_read_at
    }

    // 2. Fetch conversations
    const { data: convos, error: cError } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false })

    if (cError) {
      set({ error: cError.message, loading: false })
      return
    }

    // 3. Fetch all participants for these conversations with profiles
    const { data: allParticipants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id, user_profiles(id, email, full_name, avatar_url, role, correspondent_id, updated_at)')
      .in('conversation_id', conversationIds)

    // 4. Fetch last message for each conversation
    const { data: allMessages } = await supabase
      .from('messages')
      .select('conversation_id, content, sender_id, created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })

    // 5. Count unread per conversation
    const unreadCounts: Record<string, number> = {}
    for (const convId of conversationIds) {
      const lastRead = lastReadMap[convId]
      if (lastRead && allMessages) {
        unreadCounts[convId] = allMessages.filter(
          (m) =>
            m.conversation_id === convId &&
            m.created_at > lastRead &&
            m.sender_id !== userId,
        ).length
      }
    }

    // 6. Build enriched list
    const lastMessageMap: Record<string, { content: string; sender_id: string; created_at: string }> = {}
    for (const msg of allMessages ?? []) {
      if (!lastMessageMap[msg.conversation_id]) {
        lastMessageMap[msg.conversation_id] = {
          content: msg.content,
          sender_id: msg.sender_id,
          created_at: msg.created_at,
        }
      }
    }

    const participantMap: Record<string, UserProfile[]> = {}
    for (const p of allParticipants ?? []) {
      if (!participantMap[p.conversation_id]) {
        participantMap[p.conversation_id] = []
      }
      const profile = p.user_profiles as unknown as UserProfile | null
      if (profile) {
        participantMap[p.conversation_id].push(profile)
      }
    }

    const enriched: ConversationWithDetails[] = (convos ?? []).map((c) => ({
      ...c,
      participants: participantMap[c.id] ?? [],
      lastMessage: lastMessageMap[c.id] ?? null,
      unreadCount: unreadCounts[c.id] ?? 0,
    }))

    set({ conversations: enriched, loading: false })
  },

  createConversation: async (creatorId, participantIds, title, isGroup = false) => {
    // If 1:1, check if conversation already exists
    if (!isGroup && participantIds.length === 1) {
      const otherUserId = participantIds[0]
      const existing = get().conversations.find(
        (c) =>
          !c.is_group &&
          c.participants.length === 2 &&
          c.participants.some((p) => p.id === otherUserId),
      )
      if (existing) return existing.id
    }

    // Create conversation
    const { data: convo, error: cError } = await supabase
      .from('conversations')
      .insert({
        title: title ?? null,
        is_group: isGroup,
        created_by: creatorId,
      })
      .select()
      .single()

    if (cError || !convo) return null

    // Add all participants (including creator)
    const allParticipantIds = [creatorId, ...participantIds.filter((id) => id !== creatorId)]
    const { error: pError } = await supabase
      .from('conversation_participants')
      .insert(
        allParticipantIds.map((uid) => ({
          conversation_id: convo.id,
          user_id: uid,
        })),
      )

    if (pError) return null

    // Refresh conversations
    await get().fetchConversations(creatorId)

    return convo.id
  },

  markConversationRead: async (conversationId, userId) => {
    const now = new Date().toISOString()
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: now })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)

    // Optimistic update
    set({
      conversations: get().conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    })
  },

  subscribeRealtime: (userId) => {
    get().unsubscribe()

    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          // Refresh conversations on any update (new message triggers updated_at change)
          get().fetchConversations(userId)
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
