// Status display configs for G-Invoice domain

export const INTAKE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  draft: { label: 'Borrador', color: 'var(--g-text-secondary)', bg: 'var(--g-surface-hover)' },
  submitted: { label: 'Enviado', color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  needs_info: { label: 'Faltan datos', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  pending_approval: { label: 'Pte. aprobación', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  approved: { label: 'Aprobado', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  rejected: { label: 'Rechazado', color: 'var(--status-error)', bg: 'var(--status-error-bg)' },
  sent_to_accounting: { label: 'En contabilización', color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  posted: { label: 'Contabilizado', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  ready_to_bill: { label: 'Para facturar', color: 'var(--g-brand-3308)', bg: 'var(--g-sec-50)' },
  billed: { label: 'Facturado', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  archived: { label: 'Archivado', color: 'var(--g-text-tertiary)', bg: 'var(--g-surface-hover)' },
}

export const UTTAI_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  clear: { label: 'Sin bloqueo', color: 'var(--status-success)', bg: 'var(--status-success-bg)', icon: '🟢' },
  blocked: { label: 'Bloqueado UTTAI', color: 'var(--status-error)', bg: 'var(--status-error-bg)', icon: '🔴' },
  pending_review: { label: 'Pte. revisión', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)', icon: '🟡' },
}

export const COMPLIANCE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  compliant: { label: 'Cumple', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  expiring_soon: { label: 'Próximo a vencer', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  non_compliant: { label: 'No cumple', color: 'var(--status-error)', bg: 'var(--status-error-bg)' },
}

export const INTAKE_TYPE_LABELS: Record<string, string> = {
  vendor_invoice: 'Factura proveedor',
  official_fee: 'Tasa oficial',
}

export const VENDOR_DOC_TYPE_LABELS: Record<string, string> = {
  tax_residency_certificate: 'Certificado residencia fiscal',
  partners_letter: 'Carta socios',
  other: 'Otro',
}

export const INVOICE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  invoice_draft: { label: 'Borrador', color: 'var(--g-text-secondary)', bg: 'var(--g-surface-hover)' },
  pending_partner_approval: { label: 'Pte. aprobación socio', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  ready_for_sap: { label: 'Lista para SAP', color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  issued: { label: 'Emitida', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  delivered: { label: 'Entregada', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  platform_required: { label: 'Pte. plataforma', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  platform_completed: { label: 'Plataforma OK', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
}

export const PLATFORM_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: 'Pendiente', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  in_progress: { label: 'En curso', color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  completed: { label: 'Completada', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  blocked: { label: 'Bloqueada', color: 'var(--status-error)', bg: 'var(--status-error-bg)' },
}

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'BRL', 'MXN', 'ARS', 'CLP', 'COP'] as const
