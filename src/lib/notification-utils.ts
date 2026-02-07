import { differenceInMinutes, differenceInHours, differenceInDays, parseISO } from 'date-fns'

export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = parseISO(dateString)

  const minutes = differenceInMinutes(now, date)
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`

  const hours = differenceInHours(now, date)
  if (hours < 24) return `Hace ${hours}h`

  const days = differenceInDays(now, date)
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem`

  return `Hace ${Math.floor(days / 30)} mes${Math.floor(days / 30) > 1 ? 'es' : ''}`
}

export function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    certificate_expiring: '⚠️',
    certificate_expired: '🔴',
    liquidation_approved: '✅',
    liquidation_rejected: '❌',
    payment_completed: '💰',
    payment_requested: '📨',
  }
  return icons[type] ?? '🔔'
}
