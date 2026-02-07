export const PAYMENT_STATUS_CONFIG: Record<
  string,
  {
    label: string
    badgeVariant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
  }
> = {
  pending: { label: 'Pendiente', badgeVariant: 'warning' },
  in_progress: { label: 'En proceso', badgeVariant: 'default' },
  paid: { label: 'Pagada', badgeVariant: 'success' },
  rejected: { label: 'Rechazada', badgeVariant: 'destructive' },
}

export function getPaymentStatusConfig(status: string) {
  return PAYMENT_STATUS_CONFIG[status] ?? PAYMENT_STATUS_CONFIG.pending
}
