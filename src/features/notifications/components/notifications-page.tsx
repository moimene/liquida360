import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useNotifications } from '../hooks/use-notifications'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { formatRelativeTime } from '@/lib/notification-utils'

export function NotificationsPage() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead } =
    useNotifications()

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id)
    }
  }, [user, fetchNotifications])

  function handleClick(notification: (typeof notifications)[0]) {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    if (notification.related_entity_type && notification.related_entity_id) {
      const routes: Record<string, string> = {
        liquidation: `/liquidations/${notification.related_entity_id}`,
        payment_request: `/payments/${notification.related_entity_id}`,
        certificate: `/certificates`,
        correspondent: `/correspondents/${notification.related_entity_id}`,
      }
      const route = routes[notification.related_entity_type]
      if (route) navigate(route)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Notificaciones
          </h2>
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            {unreadCount > 0
              ? `${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`
              : 'Todas las notificaciones leídas'}
          </p>
        </div>
        {unreadCount > 0 && user && (
          <Button variant="outline" onClick={() => markAllAsRead(user.id)}>
            <CheckCheck className="h-4 w-4" />
            Marcar todo como leído
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 w-full rounded" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: 'var(--g-text-secondary)', opacity: 0.3 }}
            />
            <p className="text-lg font-medium mb-1" style={{ color: 'var(--g-text-primary)' }}>
              No hay notificaciones
            </p>
            <p style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-body)' }}>
              Las notificaciones de liquidaciones, pagos y certificados aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              className="flex items-start gap-4 p-4 text-left transition-colors w-full"
              style={{
                backgroundColor: n.read
                  ? 'var(--g-surface-card)'
                  : 'color-mix(in srgb, var(--g-brand-3308) 4%, var(--g-surface-card))',
                border: '1px solid var(--g-border-default)',
                borderRadius: 'var(--g-radius-lg)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--g-surface-muted)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = n.read
                  ? 'var(--g-surface-card)'
                  : 'color-mix(in srgb, var(--g-brand-3308) 4%, var(--g-surface-card))'
              }}
              onClick={() => handleClick(n)}
            >
              {/* Unread indicator */}
              <div className="mt-1 shrink-0">
                {!n.read ? (
                  <div
                    className="h-2.5 w-2.5"
                    style={{
                      backgroundColor: 'var(--g-brand-3308)',
                      borderRadius: 'var(--g-radius-full)',
                    }}
                  />
                ) : (
                  <Check
                    className="h-4 w-4"
                    style={{ color: 'var(--g-text-secondary)', opacity: 0.4 }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <p
                    className={`text-sm ${n.read ? '' : 'font-bold'}`}
                    style={{ color: 'var(--g-text-primary)' }}
                  >
                    {n.title}
                  </p>
                  <span
                    className="text-xs whitespace-nowrap shrink-0"
                    style={{ color: 'var(--g-text-secondary)', opacity: 0.7 }}
                  >
                    {formatRelativeTime(n.created_at)}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--g-text-secondary)' }}>
                  {n.message}
                </p>
                {n.related_entity_type && (
                  <Badge variant="outline" className="mt-2">
                    {n.related_entity_type === 'liquidation' && 'Liquidación'}
                    {n.related_entity_type === 'payment_request' && 'Solicitud de pago'}
                    {n.related_entity_type === 'certificate' && 'Certificado'}
                    {n.related_entity_type === 'correspondent' && 'Corresponsal'}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
