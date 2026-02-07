export const STATUS_CONFIG: Record<
  string,
  {
    label: string
    badgeVariant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
    step: number
  }
> = {
  draft: { label: 'Borrador', badgeVariant: 'secondary', step: 0 },
  pending_approval: { label: 'Pendiente aprobación', badgeVariant: 'warning', step: 1 },
  approved: { label: 'Aprobada', badgeVariant: 'success', step: 2 },
  payment_requested: { label: 'Pago solicitado', badgeVariant: 'default', step: 3 },
  paid: { label: 'Pagada', badgeVariant: 'success', step: 4 },
  rejected: { label: 'Rechazada', badgeVariant: 'destructive', step: -1 },
}

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
}

export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export const STATUS_TIMELINE = [
  { key: 'draft', label: 'Borrador' },
  { key: 'pending_approval', label: 'Pendiente' },
  { key: 'approved', label: 'Aprobada' },
  { key: 'payment_requested', label: 'Pago solicitado' },
  { key: 'paid', label: 'Pagada' },
] as const
