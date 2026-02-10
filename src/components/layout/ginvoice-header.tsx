import { useAuth } from '@/features/auth'
import { Badge } from '@/components/ui/badge'
import { NotificationBell } from '@/features/notifications/components/notification-bell'
import { WorkspaceSwitcher } from './workspace-switcher'

export function GInvoiceHeader() {
  const { user, ginvRole } = useAuth()

  return (
    <header
      className="flex items-center justify-between px-6 py-4"
      style={{
        backgroundColor: 'var(--g-surface-card)',
        borderBottom: '1px solid var(--g-border-default)',
      }}
    >
      <div className="flex items-center gap-4">
        <WorkspaceSwitcher />
      </div>

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
            {ginvRole && (
              <Badge variant="secondary">{ginvRole.replace('ginv_', '')}</Badge>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
