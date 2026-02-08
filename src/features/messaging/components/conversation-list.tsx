import { useState } from 'react'
import { Search, MessageSquarePlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth'
import { formatRelativeTime } from '@/lib/notification-utils'
import type { ConversationWithDetails } from '../hooks/use-conversations'

interface ConversationListProps {
  conversations: ConversationWithDetails[]
  activeId: string | null
  loading: boolean
  onSelect: (conversation: ConversationWithDetails) => void
  onNewConversation: () => void
}

export function ConversationList({
  conversations,
  activeId,
  loading,
  onSelect,
  onNewConversation,
}: ConversationListProps) {
  const user = useAuth((s) => s.user)
  const [search, setSearch] = useState('')

  const filtered = search
    ? conversations.filter((c) => {
        const searchLower = search.toLowerCase()
        if (c.title?.toLowerCase().includes(searchLower)) return true
        return c.participants.some(
          (p) =>
            p.full_name.toLowerCase().includes(searchLower) ||
            p.email.toLowerCase().includes(searchLower),
        )
      })
    : conversations

  function getDisplayName(c: ConversationWithDetails): string {
    if (c.is_group) return c.title ?? 'Grupo'
    const other = c.participants.find((p) => p.id !== user?.id)
    return other?.full_name || other?.email || 'Conversación'
  }

  function getAvatar(c: ConversationWithDetails): string {
    if (c.is_group) return `${c.participants.length}`
    const other = c.participants.find((p) => p.id !== user?.id)
    return (other?.full_name || other?.email || '?').charAt(0).toUpperCase()
  }

  function getLastMessagePreview(c: ConversationWithDetails): string {
    if (!c.lastMessage) return 'Sin mensajes'
    const isMine = c.lastMessage.sender_id === user?.id
    const prefix = isMine ? 'Tú: ' : ''
    const text = c.lastMessage.content
    return `${prefix}${text.length > 40 ? text.slice(0, 40) + '…' : text}`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--g-border-default)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h3)', color: 'var(--g-text-primary)' }}
          >
            Mensajes
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onNewConversation}
            aria-label="Nueva conversación"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{
            backgroundColor: 'var(--g-surface-muted)',
            borderRadius: 'var(--g-radius-md)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--g-text-secondary)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversación..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{
              color: 'var(--g-text-primary)',
              fontFamily: 'var(--g-font-family)',
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-16 w-full rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-sm text-center" style={{ color: 'var(--g-text-secondary)' }}>
              {search ? 'No se encontraron conversaciones' : 'No tienes conversaciones aún'}
            </p>
            {!search && (
              <Button variant="outline" size="sm" className="mt-3" onClick={onNewConversation}>
                Iniciar conversación
              </Button>
            )}
          </div>
        ) : (
          filtered.map((c) => {
            const isActive = c.id === activeId
            return (
              <button
                key={c.id}
                type="button"
                className="flex items-center gap-3 px-4 py-3 w-full text-left transition-colors"
                style={{
                  backgroundColor: isActive
                    ? 'color-mix(in srgb, var(--g-brand-3308) 8%, var(--g-surface-card))'
                    : 'var(--g-surface-card)',
                  borderBottom: '1px solid var(--g-border-default)',
                }}
                onClick={() => onSelect(c)}
              >
                {/* Avatar */}
                <div
                  className="flex h-10 w-10 items-center justify-center font-medium text-sm shrink-0"
                  style={{
                    backgroundColor: isActive ? 'var(--g-brand-3308)' : 'var(--g-sec-100)',
                    color: isActive ? 'var(--g-text-inverse)' : 'var(--g-brand-3308)',
                    borderRadius: 'var(--g-radius-full)',
                  }}
                >
                  {getAvatar(c)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm truncate ${c.unreadCount > 0 ? 'font-bold' : 'font-medium'}`}
                      style={{ color: 'var(--g-text-primary)' }}
                    >
                      {getDisplayName(c)}
                    </p>
                    {c.lastMessage && (
                      <span
                        className="text-[10px] shrink-0"
                        style={{ color: 'var(--g-text-secondary)' }}
                      >
                        {formatRelativeTime(c.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p
                      className="text-xs truncate"
                      style={{ color: 'var(--g-text-secondary)' }}
                    >
                      {getLastMessagePreview(c)}
                    </p>
                    {c.unreadCount > 0 && (
                      <Badge
                        className="shrink-0 h-5 min-w-5 flex items-center justify-center text-[10px] font-bold"
                        style={{
                          backgroundColor: 'var(--g-brand-3308)',
                          color: 'var(--g-text-inverse)',
                          borderRadius: 'var(--g-radius-full)',
                        }}
                      >
                        {c.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
