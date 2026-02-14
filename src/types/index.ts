import type { Database } from './database'

export type Correspondent = Database['public']['Tables']['correspondents']['Row']
export type Certificate = Database['public']['Tables']['certificates']['Row']
export type Liquidation = Database['public']['Tables']['liquidations']['Row']
export type PaymentRequest = Database['public']['Tables']['payment_requests']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type AlertConfig = Database['public']['Tables']['alert_configs']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

export type UserRole = 'pagador' | 'supervisor' | 'financiero' | 'admin' | 'corresponsal'

export type GInvoiceRole =
  | 'ginv_operador'
  | 'ginv_socio_aprobador'
  | 'ginv_bpo_proveedores'
  | 'ginv_bpo_facturacion'
  | 'ginv_compliance_uttai'
  | 'ginv_admin'

// G-Invoice domain types
export type GInvJob = Database['public']['Tables']['ginv_jobs']['Row']
export type GInvVendor = Database['public']['Tables']['ginv_vendors']['Row']
export type GInvVendorDocument = Database['public']['Tables']['ginv_vendor_documents']['Row']
export type GInvIntakeItem = Database['public']['Tables']['ginv_intake_items']['Row']
export type GInvSapPosting = Database['public']['Tables']['ginv_sap_postings']['Row']
export type GInvBillingBatch = Database['public']['Tables']['ginv_billing_batches']['Row']
export type GInvBillingBatchItem = Database['public']['Tables']['ginv_billing_batch_items']['Row']
export type GInvClientInvoice = Database['public']['Tables']['ginv_client_invoices']['Row']
export type GInvCollectionClaim = Database['public']['Tables']['ginv_collection_claims']['Row']
export type GInvDelivery = Database['public']['Tables']['ginv_deliveries']['Row']
export type GInvPlatformTask = Database['public']['Tables']['ginv_platform_tasks']['Row']
export type GInvUttaiRequest = Database['public']['Tables']['ginv_uttai_requests']['Row']
