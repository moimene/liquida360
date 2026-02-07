import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { useNotifications } from '../hooks/use-notifications'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { formatRelativeTime } from '@/lib/notification-utils'

export function NotificationBell() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    subscribeRealtime,
    unsubscribe,
  } = useNotifications()

  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Fetch + subscribe on mount
  useEffect(() => {
    if (!user) return
    fetchNotifications(user.id)
    subscribeRealtime(user.id)
    return () => unsubscribe()
  }, [user, fetchNotifications, subscribeRealtime, unsubscribe])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  function handleNotificationClick(notification: (typeof notifications)[0]) {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Navigate to related entity if available
    if (notification.related_entity_type && notification.related_entity_id) {
      const routes: Record<string, string> = {
        liquidation: `/liquidations/${notification.related_entity_id}`,
        payment_request: `/payments/${notification.related_entity_id}`,
        certificate: `/certificates`,
        correspondent: `/correspondents/${notification.related_entity_id}`,
      }
      const route = routes[notification.related_entity_type]
      if (route) {
        navigate(route)
        setOpen(false)
      }
    }
  }

  const recentNotifications = notifications.slice(0, 8)

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative flex h-9 w-9 items-center justify-center transition-colors"
        style={{ borderRadius: 'var(--g-radius-md)' }}
        onClick={() => setOpen(!open)}
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" style={{ color: 'var(--g-text-secondary)' }} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center text-[10px] font-bold px-1"
            style={{
              backgroundColor: 'var(--status-error)',
              color: 'white',
              borderRadius: 'var(--g-radius-full)',
            }}
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 animate-scale-in"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            border: '1px solid var(--g-border-default)',
            borderRadius: 'var(--g-radius-lg)',
            boxShadow: 'var(--g-shadow-modal)',
          }}
          role="dialog"
          aria-label="Panel de notificaciones"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--g-border-default)' }}
          >
            <h3 className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>
              Notificaciones
            </h3>
            {unreadCount > 0 && user && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: 'var(--g-brand-3308)' }}
                onClick={() => markAllAsRead(user.id)}
              >
                <CheckCheck className="h-3 w-3" />
                Marcar todo leído
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell
                  className="h-8 w-8 mx-auto mb-2"
                  style={{ color: 'var(--g-text-secondary)', opacity: 0.4 }}
                />
                <p className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                  No hay notificaciones
                </p>
              </div>
            ) : (
              recentNotifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    backgroundColor: n.read
                      ? 'transparent'
                      : 'color-mix(in srgb, var(--g-brand-3308) 4%, transparent)',
                    borderBottom: '1px solid var(--g-border-default)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--g-surface-muted)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = n.read
                      ? 'transparent'
                      : 'color-mix(in srgb, var(--g-brand-3308) 4%, transparent)'
                  }}
                  onClick={() => handleNotificationClick(n)}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 shrink-0">
                    {!n.read ? (
                      <div
                        className="h-2 w-2"
                        style={{
                          backgroundColor: 'var(--g-brand-3308)',
                          borderRadius: 'var(--g-radius-full)',
                        }}
                      />
                    ) : (
                      <div className="h-2 w-2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${n.read ? '' : 'font-medium'}`}
                      style={{ color: 'var(--g-text-primary)' }}
                    >
                      {n.title}
                    </p>
                    <p
                      className="text-xs mt-0.5 line-clamp-2"
                      style={{ color: 'var(--g-text-secondary)' }}
                    >
                      {n.message}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--g-text-secondary)', opacity: 0.7 }}
                    >
                      {formatRelativeTime(n.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2" style={{ borderTop: '1px solid var(--g-border-default)' }}>
              <button
                type="button"
                className="flex items-center gap-1 w-full justify-center text-xs font-medium py-1 transition-colors"
                style={{ color: 'var(--g-brand-3308)' }}
                onClick={() => {
                  navigate('/notifications')
                  setOpen(false)
                }}
              >
                Ver todas las notificaciones
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
