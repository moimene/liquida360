import { useAuth } from '@/features/auth'
import { Badge } from '@/components/ui/badge'
import { NotificationBell } from '@/features/notifications/components/notification-bell'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { user, role } = useAuth()

  return (
    <header
      className="flex items-center justify-between px-6 py-4"
      style={{
        backgroundColor: 'var(--g-surface-card)',
        borderBottom: '1px solid var(--g-border-default)',
      }}
    >
      <h1
        className="font-bold"
        style={{ fontSize: 'var(--g-text-h3)', color: 'var(--g-text-primary)' }}
      >
        {title}
      </h1>

      <div className="flex items-center gap-3">
        <NotificationBell />

        {user && (
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center font-medium text-sm"
              style={{
                backgroundColor: 'var(--g-sec-100)',
                color: 'var(--g-brand-3308)',
                borderRadius: 'var(--g-radius-full)',
              }}
              aria-hidden="true"
            >
              {user.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            {role && <Badge variant="secondary">{role}</Badge>}
          </div>
        )}
      </div>
    </header>
  )
}
