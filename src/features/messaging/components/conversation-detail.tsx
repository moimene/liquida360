import { useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth'
import { useMessages } from '../hooks/use-messages'
import { useConversations, type ConversationWithDetails } from '../hooks/use-conversations'
import { MessageBubble } from './message-bubble'
import { MessageInput } from './message-input'

interface ConversationDetailProps {
  conversation: ConversationWithDetails
  onBack?: () => void
}

export function ConversationDetail({ conversation, onBack }: ConversationDetailProps) {
  const user = useAuth((s) => s.user)
  const { messages, loading, fetchMessages, sendMessage, subscribeRealtime, unsubscribe } =
    useMessages()
  const { markConversationRead } = useConversations()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Derive display name for conversation
  const displayName = conversation.is_group
    ? conversation.title ?? 'Grupo'
    : conversation.participants.find((p) => p.id !== user?.id)?.full_name ??
      conversation.participants.find((p) => p.id !== user?.id)?.email ??
      'Conversación'

  const participantCount = conversation.participants.length

  useEffect(() => {
    fetchMessages(conversation.id)
    subscribeRealtime(conversation.id)

    // Mark as read
    if (user?.id) {
      markConversationRead(conversation.id, user.id)
    }

    return () => {
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, user?.id])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function handleSend(content: string) {
    if (!user?.id) return
    sendMessage(conversation.id, user.id, content)
  }

  // Build sender map from participants
  const participantMap = new Map(conversation.participants.map((p) => [p.id, p]))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{
          borderBottom: '1px solid var(--g-border-default)',
          backgroundColor: 'var(--g-surface-card)',
        }}
      >
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div
          className="flex h-9 w-9 items-center justify-center font-medium text-sm shrink-0"
          style={{
            backgroundColor: 'var(--g-sec-100)',
            color: 'var(--g-brand-3308)',
            borderRadius: 'var(--g-radius-full)',
          }}
        >
          {conversation.is_group
            ? `${participantCount}`
            : displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: 'var(--g-text-primary)' }}
          >
            {displayName}
          </p>
          <p className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>
            {conversation.is_group
              ? `${participantCount} participantes`
              : conversation.participants.find((p) => p.id !== user?.id)?.role ?? ''}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3"
        style={{ backgroundColor: 'var(--g-surface-default)' }}
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
              Cargando mensajes...
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center py-12">
            <span className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
              No hay mensajes aún. ¡Envía el primero!
            </span>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === user?.id}
              sender={participantMap.get(msg.sender_id)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} />
    </div>
  )
}
