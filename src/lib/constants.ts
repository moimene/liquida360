export const APP_NAME = 'LIQUIDA360'

export const CERTIFICATE_ALERT_DEFAULTS = {
  FIRST_ALERT_DAYS: 90,
  SECOND_ALERT_DAYS: 30,
  DEFAULT_VALIDITY_YEARS: 1,
} as const

export const LIQUIDATION_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  PAYMENT_REQUESTED: 'payment_requested',
  PAID: 'paid',
  REJECTED: 'rejected',
} as const

export const PAYMENT_REQUEST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  PAID: 'paid',
  REJECTED: 'rejected',
} as const

export const CERTIFICATE_STATUS = {
  VALID: 'valid',
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired',
} as const

export const USER_ROLES = {
  PAGADOR: 'pagador',
  SUPERVISOR: 'supervisor',
  FINANCIERO: 'financiero',
  ADMIN: 'admin',
  CORRESPONSAL: 'corresponsal',
} as const

export const INTERNAL_ROLES = ['pagador', 'supervisor', 'financiero', 'admin'] as const
