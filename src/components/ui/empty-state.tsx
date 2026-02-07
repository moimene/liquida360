import { Button } from './button'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <div
        className="flex h-12 w-12 items-center justify-center mb-4"
        style={{
          backgroundColor: 'var(--g-surface-muted)',
          borderRadius: 'var(--g-radius-full)',
        }}
      >
        <Icon className="h-6 w-6" style={{ color: 'var(--g-text-secondary)', opacity: 0.6 }} />
      </div>
      <h3
        className="font-semibold"
        style={{ fontSize: 'var(--g-text-h4)', color: 'var(--g-text-primary)' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="mt-1 max-w-sm"
          style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}
        >
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
