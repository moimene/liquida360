import type { Database } from './database'

export type Correspondent = Database['public']['Tables']['correspondents']['Row']
export type Certificate = Database['public']['Tables']['certificates']['Row']
export type Liquidation = Database['public']['Tables']['liquidations']['Row']
export type PaymentRequest = Database['public']['Tables']['payment_requests']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type AlertConfig = Database['public']['Tables']['alert_configs']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']

export type UserRole = 'pagador' | 'supervisor' | 'financiero' | 'admin' | 'corresponsal'
