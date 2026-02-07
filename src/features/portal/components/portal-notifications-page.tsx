import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { InfoTip } from '@/components/ui/info-tip'
import { useAuth } from '@/features/auth'
import { useNotifications } from '@/features/notifications/hooks/use-notifications'
import { NOTIFICATIONS_HELP } from '@/features/notifications/constants/help-texts'
import { formatRelativeTime, getNotificationIcon } from '@/lib/notification-utils'

export function PortalNotificationsPage() {
  const user = useAuth((s) => s.user)
  const navigate = useNavigate()
  const { notifications, loading, unreadCount, fetchNotifications, markAsRead, markAllAsRead } =
    useNotifications()

  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id)
    }
  }, [user?.id, fetchNotifications])

  function handleClick(notification: (typeof notifications)[0]) {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Navigate within portal context
    if (notification.related_entity_type && notification.related_entity_id) {
      const entityMap: Record<string, string> = {
        liquidation: `/portal/invoices/${notification.related_entity_id}`,
        certificate: '/portal/certificates',
        correspondent: '/portal/profile',
      }
      const path = entityMap[notification.related_entity_type]
      if (path) {
        navigate(path)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold flex items-center gap-2"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Notificaciones
            <InfoTip content={NOTIFICATIONS_HELP.portalHeaderTip} side="bottom" />
          </h1>
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            {unreadCount > 0
              ? `${unreadCount} notificacion(es) sin leer`
              : 'Todas las notificaciones leidas'}
          </p>
        </div>
        {unreadCount > 0 && user?.id && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead(user.id)}>
            <CheckCheck className="h-4 w-4" />
            Marcar todo leido
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span style={{ color: 'var(--g-text-secondary)' }}>Cargando...</span>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Bell className="h-12 w-12" style={{ color: 'var(--g-text-secondary)' }} />
            <p style={{ color: 'var(--g-text-secondary)' }}>No tienes notificaciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => {
            const icon = getNotificationIcon(notification.type)
            return (
              <button
                key={notification.id}
                onClick={() => handleClick(notification)}
                className="flex items-start gap-3 p-4 text-left w-full transition-colors"
                style={{
                  backgroundColor: notification.read
                    ? 'var(--g-surface-card)'
                    : 'color-mix(in srgb, var(--g-brand-3308) 5%, var(--g-surface-card))',
                  borderRadius: 'var(--g-radius-md)',
                  border: '1px solid var(--g-border-default)',
                }}
              >
                {/* Unread indicator */}
                <div className="flex items-center justify-center shrink-0 mt-0.5">
                  {!notification.read && (
                    <div
                      className="h-2 w-2"
                      style={{
                        backgroundColor: 'var(--g-brand-3308)',
                        borderRadius: 'var(--g-radius-full)',
                      }}
                    />
                  )}
                  {notification.read && (
                    <span className="text-base" aria-hidden="true">
                      {icon}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${notification.read ? 'font-normal' : 'font-medium'}`}
                    style={{ color: 'var(--g-text-primary)' }}
                  >
                    {notification.title}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--g-text-secondary)' }}>
                    {notification.message}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
