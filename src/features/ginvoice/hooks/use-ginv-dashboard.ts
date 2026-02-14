import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface DashboardMetrics {
  intakeSubmitted: number
  intakePendingApproval: number
  intakeUttaiBlocked: number
  intakeComplianceIssues: number
  accountingInQueue: number
  accountingPostedToday: number
  readyToBill: number
  invoicesReady: number
  invoicesIssuedToday: number
  deliveriesPending: number
  platformsPending: number
  platformsOverdue: number
}

export interface DashboardAlert {
  type: 'uttai' | 'compliance' | 'delivery' | 'platform' | 'pdf'
  title: string
  detail?: string
}

export interface WorkItem {
  id: string
  type: string
  status: string
  label: string
  created_at: string
  actionPath: string
}

export interface AuditEvent {
  id: string
  table_name: string
  action: string
  created_at: string
  detail?: string
}

export function useGInvDashboard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [alerts, setAlerts] = useState<DashboardAlert[]>([])
  const [queue, setQueue] = useState<WorkItem[]>([])
  const [events, setEvents] = useState<AuditEvent[]>([])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      const future30 = new Date(now)
      future30.setDate(future30.getDate() + 30)

      const [intakeRes, invoicesRes, deliveriesRes, platformsRes, jobsRes, vendorDocsRes, auditRes] = await Promise.all([
        supabase
          .from('ginv_intake_items')
          .select('id,status,uttai_status_snapshot,vendor_compliance_snapshot,created_at,invoice_number,type,file_path,job_id', { count: 'exact' }),
        supabase
          .from('ginv_client_invoices')
          .select('id,status,created_at,pdf_file_path', { count: 'exact' }),
        supabase
          .from('ginv_deliveries')
          .select('id,status,created_at,client_invoice_id', { count: 'exact' }),
        supabase
          .from('ginv_platform_tasks')
          .select('id,status,created_at,sla_due_at,client_invoice_id', { count: 'exact' }),
        supabase
          .from('ginv_jobs')
          .select('id,uttai_status', { count: 'exact' })
          .in('uttai_status', ['blocked', 'pending_review']),
        supabase
          .from('ginv_vendor_documents')
          .select('id,expires_at,status', { count: 'exact' })
          .lte('expires_at', future30.toISOString())
          .not('status', 'eq', 'compliant'),
        supabase
          .from('audit_log')
          .select('id,table_name,action,created_at')
          .in('table_name', [
            'ginv_intake_items',
            'ginv_sap_postings',
            'ginv_billing_batches',
            'ginv_client_invoices',
            'ginv_deliveries',
            'ginv_platform_tasks',
          ])
          .order('created_at', { ascending: false })
          .limit(15),
      ])

      const intake = intakeRes.data ?? []
      const invoices = invoicesRes.data ?? []
      const deliveries = deliveriesRes.data ?? []
      const platforms = platformsRes.data ?? []

      const intakeSubmitted = intake.filter((i) => i.status === 'submitted').length
      const intakePendingApproval = intake.filter((i) => i.status === 'pending_approval').length
      const intakeUttaiBlocked = intake.filter((i) => i.uttai_status_snapshot === 'blocked').length
      const intakeComplianceIssues = intake.filter((i) => i.vendor_compliance_snapshot === 'non_compliant').length
      const accountingInQueue = intake.filter((i) => i.status === 'sent_to_accounting').length
      const accountingPostedToday = intake.filter(
        (i) => i.status === 'posted' && new Date(i.created_at) >= startOfDay,
      ).length
      const readyToBill = intake.filter((i) => ['posted', 'ready_to_bill'].includes(i.status)).length
      const invoicesReady = invoices.filter((i) => i.status === 'ready_for_sap').length
      const invoicesIssuedToday = invoices.filter(
        (i) => i.status === 'issued' && new Date(i.created_at) >= startOfDay,
      ).length
      const deliveriesPending = deliveries.filter((d) => d.status !== 'sent').length
      const platformsPending = platforms.filter((p) => p.status === 'pending').length
      const platformsOverdue = platforms.filter(
        (p) => p.sla_due_at && new Date(p.sla_due_at) < now && p.status !== 'completed',
      ).length

      setMetrics({
        intakeSubmitted,
        intakePendingApproval,
        intakeUttaiBlocked,
        intakeComplianceIssues,
        accountingInQueue,
        accountingPostedToday,
        readyToBill,
        invoicesReady,
        invoicesIssuedToday,
        deliveriesPending,
        platformsPending,
        platformsOverdue,
      })

      const alerts: DashboardAlert[] = []
      if ((jobsRes.data ?? []).length > 0) {
        alerts.push({ type: 'uttai', title: `UTTAI: ${jobsRes.data?.length ?? 0} jobs bloqueados` })
      }
      if ((vendorDocsRes.data ?? []).length > 0) {
        alerts.push({
          type: 'compliance',
          title: `Certificados próximos a vencer: ${vendorDocsRes.data?.length ?? 0}`,
        })
      }
      const invoicesMissingPdf = invoices.filter((i) => ['ready_for_sap', 'issued'].includes(i.status) && !i.pdf_file_path)
      if (invoicesMissingPdf.length > 0) {
        alerts.push({
          type: 'pdf',
          title: `Facturas sin PDF adjunto: ${invoicesMissingPdf.length}`,
        })
      }
      if (platformsOverdue > 0) {
        alerts.push({ type: 'platform', title: `Plataformas vencidas: ${platformsOverdue}` })
      }
      if (deliveriesPending > 0) {
        alerts.push({ type: 'delivery', title: `Entregas pendientes: ${deliveriesPending}` })
      }
      setAlerts(alerts)

      const queue: WorkItem[] = []
      intake
        .filter((i) => ['submitted', 'pending_approval', 'sent_to_accounting', 'posted'].includes(i.status))
        .slice(0, 12)
        .forEach((i) => {
          queue.push({
            id: i.id,
            type: 'Subida',
            status: i.status,
            label: i.invoice_number || i.type,
            created_at: i.created_at,
            actionPath: '/g-invoice/intake',
          })
        })

      invoices
        .filter((i) => ['pending_partner_approval', 'ready_for_sap'].includes(i.status))
        .slice(0, 10)
        .forEach((i) => {
          queue.push({
            id: i.id,
            type: 'Factura',
            status: i.status,
            label: i.id.slice(0, 8),
            created_at: i.created_at,
            actionPath: '/g-invoice/invoices',
          })
        })

      platforms
        .filter((p) => ['pending', 'in_progress'].includes(p.status))
        .slice(0, 10)
        .forEach((p) => {
          queue.push({
            id: p.id,
            type: 'Plataforma',
            status: p.status,
            label: p.client_invoice_id?.slice(0, 8) ?? 'Tarea',
            created_at: p.created_at,
            actionPath: '/g-invoice/platforms',
          })
        })

      queue.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setQueue(queue.slice(0, 15))

      setEvents((auditRes.data ?? []).map((e) => ({
        id: e.id,
        table_name: e.table_name,
        action: e.action,
        created_at: e.created_at,
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, metrics, alerts, queue, events, refresh }
}
