import type { Message, UserProfile } from '@/types'
import { formatRelativeTime } from '@/lib/notification-utils'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  sender?: UserProfile
}

export function MessageBubble({ message, isOwn, sender }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className="max-w-[75%] px-3 py-2"
        style={{
          backgroundColor: isOwn ? 'var(--g-brand-3308)' : 'var(--g-surface-muted)',
          color: isOwn ? 'var(--g-text-inverse)' : 'var(--g-text-primary)',
          borderRadius: isOwn
            ? 'var(--g-radius-lg) var(--g-radius-lg) var(--g-radius-sm) var(--g-radius-lg)'
            : 'var(--g-radius-lg) var(--g-radius-lg) var(--g-radius-lg) var(--g-radius-sm)',
        }}
      >
        {!isOwn && sender && (
          <p
            className="text-xs font-medium mb-0.5"
            style={{ color: 'var(--g-brand-3308)', opacity: 0.9 }}
          >
            {sender.full_name || sender.email}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className="text-[10px] mt-1 text-right"
          style={{
            opacity: 0.6,
            color: isOwn ? 'var(--g-text-inverse)' : 'var(--g-text-secondary)',
          }}
        >
          {formatRelativeTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}
