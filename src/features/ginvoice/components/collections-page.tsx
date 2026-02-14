import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Loader2,
  Search,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { exportTableToXlsx, xlsxFilename } from '@/lib/xlsx-export'
import {
  dedupeCollectionsForExport,
  type CollectionBucket,
} from '../lib/collections'
import { useGInvCollections, type CollectionInvoice } from '../hooks/use-ginv-collections'

type FilterBucket = 'all' | CollectionBucket
type ClaimDecisionMode = 'approve' | 'reject'

const BUCKET_LABELS: Record<CollectionBucket, string> = {
  pending: 'Pendiente',
  overdue: 'Vencida',
  paid: 'Cobrada',
  unknown: 'Sin datos',
}

const CLAIM_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending_approval: {
    label: 'Pte. aprobación',
    color: 'var(--status-warning)',
    bg: 'var(--status-warning-bg)',
  },
  approved: {
    label: 'Aprobada',
    color: 'var(--status-info)',
    bg: 'var(--status-info-bg)',
  },
  rejected: {
    label: 'Rechazada',
    color: 'var(--status-error)',
    bg: 'var(--status-error-bg)',
  },
  sent: {
    label: 'Enviada',
    color: 'var(--status-success)',
    bg: 'var(--status-success-bg)',
  },
}

function parseEmailList(raw: string): { emails: string[]; error?: string } {
  const entries = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  if (entries.length === 0) {
    return { emails: [] }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  for (const entry of entries) {
    if (!emailRegex.test(entry)) {
      return { emails: [], error: `Email no válido: ${entry}` }
    }
  }

  const unique = Array.from(new Set(entries.map((entry) => entry.toLowerCase())))
  return { emails: unique }
}

function buildClaimBody(invoice: CollectionInvoice): string {
  const sapNumber = invoice.sap_invoice_number ?? invoice.id.slice(0, 8)
  const dueText = invoice.due_date_resolved
    ? format(new Date(invoice.due_date_resolved), 'dd/MM/yyyy', { locale: es })
    : 'sin fecha de vencimiento'
  const amountText = typeof invoice.outstanding_eur === 'number'
    ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(invoice.outstanding_eur)
    : 'importe pendiente no disponible'

  return [
    `Estimado cliente,`,
    '',
    `Le recordamos el pago pendiente de la factura ${sapNumber}, con vencimiento ${dueText}.`,
    `Saldo pendiente: ${amountText}.`,
    '',
    'Agradeceríamos su confirmación de fecha de pago.',
    '',
    'Gracias y un saludo.',
  ].join('\n')
}

export function CollectionsPage() {
  const {
    invoices,
    claims,
    loading,
    claimsLoading,
    error,
    claimsError,
    fetchCollections,
    fetchClaims,
    markAsPaid,
    createClaim,
    approveClaim,
    rejectClaim,
    sendClaim,
  } = useGInvCollections()
  const { user, ginvRole } = useAuth()

  const [search, setSearch] = useState('')
  const [bucketFilter, setBucketFilter] = useState<FilterBucket>('all')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'all' | string>('all')
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null)
  const [sendingClaimId, setSendingClaimId] = useState<string | null>(null)

  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [claimInvoiceId, setClaimInvoiceId] = useState<string | null>(null)
  const [claimToInput, setClaimToInput] = useState('')
  const [claimCcInput, setClaimCcInput] = useState('')
  const [claimSubject, setClaimSubject] = useState('')
  const [claimBody, setClaimBody] = useState('')
  const [claimSubmitting, setClaimSubmitting] = useState(false)

  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false)
  const [decisionMode, setDecisionMode] = useState<ClaimDecisionMode>('approve')
  const [decisionClaimId, setDecisionClaimId] = useState<string | null>(null)
  const [decisionNotes, setDecisionNotes] = useState('')
  const [decisionSubmitting, setDecisionSubmitting] = useState(false)

  useEffect(() => {
    fetchCollections()
    fetchClaims()
  }, [fetchCollections, fetchClaims])

  const canManageCollections = ginvRole === 'ginv_bpo_facturacion' || ginvRole === 'ginv_admin'
  const canRequestClaims = ginvRole === 'ginv_bpo_facturacion' || ginvRole === 'ginv_admin'
  const canApproveClaims = ginvRole === 'ginv_socio_aprobador' || ginvRole === 'ginv_admin'
  const canSendClaims = ginvRole === 'ginv_bpo_facturacion' || ginvRole === 'ginv_admin'

  const filtered = useMemo(() => {
    let result = invoices

    if (bucketFilter !== 'all') {
      result = result.filter((invoice) => invoice.bucket === bucketFilter)
    }

    if (invoiceStatusFilter !== 'all') {
      result = result.filter((invoice) => invoice.status === invoiceStatusFilter)
    }

    if (search) {
      const query = search.toLowerCase()
      result = result.filter((invoice) =>
        (invoice.sap_invoice_number ?? '').toLowerCase().includes(query)
        || (invoice.job_code ?? '').toLowerCase().includes(query)
        || (invoice.client_name ?? '').toLowerCase().includes(query),
      )
    }

    return result
  }, [invoices, bucketFilter, invoiceStatusFilter, search])

  const metrics = useMemo(() => {
    const pending = invoices.filter((invoice) => invoice.bucket === 'pending')
    const overdue = invoices.filter((invoice) => invoice.bucket === 'overdue')
    const paid = invoices.filter((invoice) => invoice.bucket === 'paid')
    const totalOutstanding = invoices.reduce((acc, invoice) => acc + (invoice.outstanding_eur ?? 0), 0)
    const overdueOutstanding = overdue.reduce((acc, invoice) => acc + (invoice.outstanding_eur ?? 0), 0)

    return {
      pendingCount: pending.length,
      overdueCount: overdue.length,
      paidCount: paid.length,
      totalOutstanding,
      overdueOutstanding,
    }
  }, [invoices])

  const selectedClaimInvoice = useMemo(
    () => (claimInvoiceId ? invoices.find((invoice) => invoice.id === claimInvoiceId) ?? null : null),
    [claimInvoiceId, invoices],
  )

  async function handleMarkPaid(invoiceId: string) {
    setPayingInvoiceId(invoiceId)
    const { error: markError } = await markAsPaid(invoiceId)
    setPayingInvoiceId(null)
    if (markError) {
      toast.error(markError)
      return
    }
    toast.success('Factura marcada como cobrada')
  }

  async function handleExportXlsx() {
    if (filtered.length === 0) {
      toast.error('No hay facturas para exportar')
      return
    }

    const deduped = dedupeCollectionsForExport(filtered)

    try {
      await exportTableToXlsx(
        deduped.rows,
        [
          { header: 'Nº SAP', accessor: (row) => row.sap_invoice_number ?? row.id.slice(0, 8) },
          { header: 'Job', accessor: (row) => row.job_code ?? '' },
          { header: 'Cliente', accessor: (row) => row.client_name ?? '' },
          { header: 'País cliente', accessor: (row) => row.client_country ?? '' },
          {
            header: 'Fecha factura',
            accessor: (row) => row.sap_invoice_date ? format(new Date(row.sap_invoice_date), 'dd/MM/yyyy', { locale: es }) : '',
          },
          {
            header: 'Vencimiento',
            accessor: (row) => row.due_date_resolved
              ? format(new Date(row.due_date_resolved), 'dd/MM/yyyy', { locale: es })
              : '',
          },
          { header: 'Bucket cobro', accessor: (row) => BUCKET_LABELS[row.bucket] },
          { header: 'Días vencida', accessor: 'days_overdue' },
          { header: 'Importe EUR', accessor: (row) => row.amount_due_eur_resolved ?? '' },
          { header: 'Saldo EUR', accessor: (row) => row.outstanding_eur ?? '' },
          { header: 'Filas fusionadas', accessor: 'duplicate_count' },
        ],
        xlsxFilename('cxc_recobro'),
        'CxC',
      )
      if (deduped.duplicatesRemoved > 0) {
        toast.warning(
          `Excel exportado sin duplicidades: ${deduped.duplicatesRemoved} fila(s) fusionada(s) en ${deduped.duplicateGroups} grupo(s).`,
        )
      } else {
        toast.success('Excel CxC exportado')
      }
    } catch {
      toast.error('No se pudo exportar el Excel CxC')
    }
  }

  function openClaimDialog(invoice: CollectionInvoice) {
    const sapNumber = invoice.sap_invoice_number ?? invoice.id.slice(0, 8)
    setClaimInvoiceId(invoice.id)
    setClaimToInput('')
    setClaimCcInput('')
    setClaimSubject(`Recordatorio de pago factura ${sapNumber}`)
    setClaimBody(buildClaimBody(invoice))
    setClaimDialogOpen(true)
  }

  function closeClaimDialog() {
    setClaimDialogOpen(false)
    setClaimInvoiceId(null)
    setClaimToInput('')
    setClaimCcInput('')
    setClaimSubject('')
    setClaimBody('')
    setClaimSubmitting(false)
  }

  async function handleCreateClaim() {
    if (!user || !selectedClaimInvoice) return

    const parsedTo = parseEmailList(claimToInput)
    if (parsedTo.error) {
      toast.error(parsedTo.error)
      return
    }
    if (parsedTo.emails.length === 0) {
      toast.error('Indica al menos un destinatario principal')
      return
    }

    const parsedCc = parseEmailList(claimCcInput)
    if (parsedCc.error) {
      toast.error(parsedCc.error)
      return
    }

    setClaimSubmitting(true)
    const { error: createError } = await createClaim({
      clientInvoiceId: selectedClaimInvoice.id,
      jobId: selectedClaimInvoice.job_id,
      subject: claimSubject.trim(),
      body: claimBody.trim(),
      recipients: parsedTo.emails.map((email) => ({ name: email, email })),
      ccRecipients: parsedCc.emails.map((email) => ({ name: email, email })),
      responsibleRecipients: selectedClaimInvoice.responsible_contacts,
      createdBy: user.id,
    })
    setClaimSubmitting(false)

    if (createError) {
      toast.error(createError)
      return
    }

    toast.success('Reclamación creada y enviada a aprobación')
    closeClaimDialog()
  }

  function openDecisionDialog(mode: ClaimDecisionMode, claimId: string) {
    setDecisionMode(mode)
    setDecisionClaimId(claimId)
    setDecisionNotes('')
    setDecisionDialogOpen(true)
  }

  function closeDecisionDialog() {
    setDecisionDialogOpen(false)
    setDecisionClaimId(null)
    setDecisionNotes('')
    setDecisionSubmitting(false)
  }

  async function handleDecisionSubmit() {
    if (!user || !decisionClaimId) return

    setDecisionSubmitting(true)
    const result = decisionMode === 'approve'
      ? await approveClaim(decisionClaimId, user.id, decisionNotes.trim() || undefined)
      : await rejectClaim(decisionClaimId, user.id, decisionNotes.trim() || undefined)
    setDecisionSubmitting(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(decisionMode === 'approve' ? 'Reclamación aprobada' : 'Reclamación rechazada')
    closeDecisionDialog()
  }

  async function handleSendClaim(claimId: string) {
    if (!user) return
    setSendingClaimId(claimId)
    const { error: sendError } = await sendClaim(claimId, user.id)
    setSendingClaimId(null)

    if (sendError) {
      toast.error(sendError)
      return
    }
    toast.success('Reclamación enviada y registrada')
  }

  function renderBucketBadge(bucket: CollectionBucket, daysOverdue: number) {
    const isOverdue = bucket === 'overdue'
    const isPaid = bucket === 'paid'

    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium"
        style={{
          color: isOverdue
            ? 'var(--status-error)'
            : isPaid
              ? 'var(--status-success)'
              : 'var(--status-info)',
          backgroundColor: isOverdue
            ? 'var(--status-error-bg)'
            : isPaid
              ? 'var(--status-success-bg)'
              : 'var(--status-info-bg)',
          borderRadius: 'var(--g-radius-full)',
        }}
      >
        {isOverdue && <AlertTriangle className="h-3 w-3" />}
        {isPaid && <CheckCircle2 className="h-3 w-3" />}
        {BUCKET_LABELS[bucket]}
        {isOverdue && daysOverdue > 0 ? ` (${daysOverdue}d)` : ''}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            CxC y Recobro
          </h1>
          <p style={{ color: 'var(--g-text-secondary)' }}>
            Facturas pendientes y vencidas de cobro para seguimiento operativo
          </p>
        </div>
        <Button variant="outline" onClick={handleExportXlsx} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CxC
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--status-info)' }}>{metrics.pendingCount}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Pendientes</div>
        </div>
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--status-error)' }}>{metrics.overdueCount}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Vencidas</div>
        </div>
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--status-success)' }}>{metrics.paidCount}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Cobradas</div>
        </div>
        <div
          className="p-4 lg:col-span-2"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-lg font-bold" style={{ color: 'var(--g-text-primary)' }}>
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(metrics.totalOutstanding)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>
            Saldo pendiente total ({new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(metrics.overdueOutstanding)} vencido)
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--g-text-tertiary)' }} />
          <Input
            placeholder="Buscar por SAP, Job o cliente..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={bucketFilter}
          onChange={(event) => setBucketFilter(event.target.value as FilterBucket)}
          className="w-[220px]"
        >
          <option value="all">Todos los buckets</option>
          <option value="pending">Pendientes</option>
          <option value="overdue">Vencidas</option>
          <option value="paid">Cobradas</option>
          <option value="unknown">Sin datos</option>
        </Select>
        <Select
          value={invoiceStatusFilter}
          onChange={(event) => setInvoiceStatusFilter(event.target.value)}
          className="w-[220px]"
        >
          <option value="all">Todos los estados factura</option>
          <option value="issued">Emitida</option>
          <option value="delivered">Entregada</option>
          <option value="platform_required">Pte. plataforma</option>
          <option value="platform_completed">Plataforma OK</option>
        </Select>
      </div>

      {(error || claimsError) && (
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--status-error-bg)',
            color: 'var(--status-error)',
            borderRadius: 'var(--g-radius-md)',
          }}
        >
          {error ?? claimsError}
        </div>
      )}

      <div
        style={{
          backgroundColor: 'var(--g-surface-card)',
          borderRadius: 'var(--g-radius-lg)',
          border: '1px solid var(--g-border-default)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--g-brand-3308)' }} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Nº SAP</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Job / Cliente</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Fecha factura</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Vencimiento</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Cobro</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Importe EUR</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Saldo EUR</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8" style={{ color: 'var(--g-text-tertiary)' }}>
                    No hay facturas para estos filtros
                  </td>
                </tr>
              ) : (
                filtered.map((invoice) => (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--g-text-primary)' }}>
                      {invoice.sap_invoice_number ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {invoice.job_code ?? '—'}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                        {invoice.client_name ?? 'Sin cliente'} {invoice.client_country ? `(${invoice.client_country})` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                      {invoice.sap_invoice_date
                        ? format(new Date(invoice.sap_invoice_date), 'dd MMM yyyy', { locale: es })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                      {invoice.due_date_resolved
                        ? format(new Date(invoice.due_date_resolved), 'dd MMM yyyy', { locale: es })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {renderBucketBadge(invoice.bucket, invoice.days_overdue)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--g-text-primary)' }}>
                      {typeof invoice.amount_due_eur_resolved === 'number'
                        ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(invoice.amount_due_eur_resolved)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--g-text-primary)' }}>
                      {typeof invoice.outstanding_eur === 'number'
                        ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(invoice.outstanding_eur)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        {canRequestClaims && invoice.bucket !== 'paid' && (
                          <Button size="sm" variant="outline" onClick={() => openClaimDialog(invoice)}>
                            Reclamar
                          </Button>
                        )}
                        {canManageCollections && invoice.bucket !== 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={payingInvoiceId === invoice.id}
                            onClick={() => handleMarkPaid(invoice.id)}
                          >
                            {payingInvoiceId === invoice.id ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <CircleDollarSign className="h-3.5 w-3.5 mr-1" />
                            )}
                            Cobrada
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div
        style={{
          backgroundColor: 'var(--g-surface-card)',
          borderRadius: 'var(--g-radius-lg)',
          border: '1px solid var(--g-border-default)',
          overflow: 'hidden',
        }}
      >
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--g-border-default)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--g-text-primary)' }}>
            Reclamaciones de cobro
          </h2>
        </div>
        {claimsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--g-brand-3308)' }} />
          </div>
        ) : claims.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--g-text-tertiary)' }}>
            No hay reclamaciones registradas
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Fecha</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Factura / Cliente</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Estado</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Dest.</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Aprobación</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Envío</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => {
                const status = CLAIM_STATUS_CONFIG[claim.status] ?? CLAIM_STATUS_CONFIG.pending_approval
                return (
                  <tr key={claim.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                      {format(new Date(claim.created_at), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {claim.sap_invoice_number ?? claim.client_invoice_id.slice(0, 8)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                        {claim.job_code ?? '—'} {claim.client_name ? `· ${claim.client_name}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex px-2 py-0.5 text-xs font-medium"
                        style={{
                          color: status.color,
                          backgroundColor: status.bg,
                          borderRadius: 'var(--g-radius-full)',
                        }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                      {claim.recipient_count} TO / {claim.cc_count + claim.responsible_count} CC
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                      {claim.approved_at
                        ? format(new Date(claim.approved_at), 'dd MMM yyyy HH:mm', { locale: es })
                        : claim.rejected_at
                          ? `Rechazada ${format(new Date(claim.rejected_at), 'dd MMM yyyy HH:mm', { locale: es })}`
                          : 'Pendiente'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                      {claim.sent_at
                        ? format(new Date(claim.sent_at), 'dd MMM yyyy HH:mm', { locale: es })
                        : 'No enviada'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        {claim.status === 'pending_approval' && canApproveClaims && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openDecisionDialog('approve', claim.id)}>
                              Aprobar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openDecisionDialog('reject', claim.id)}>
                              Rechazar
                            </Button>
                          </>
                        )}
                        {claim.status === 'approved' && canSendClaims && (
                          <Button
                            size="sm"
                            onClick={() => handleSendClaim(claim.id)}
                            disabled={sendingClaimId === claim.id}
                          >
                            {sendingClaimId === claim.id ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5 mr-1" />
                            )}
                            Enviar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Dialog
        open={claimDialogOpen}
        onClose={closeClaimDialog}
        title="Nueva reclamación de cobro"
        description="Se crea en estado pendiente de aprobación. Los responsables del Job irán en copia."
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="claim-to">
              Destinatarios (TO) <span style={{ color: 'var(--status-error)' }}>*</span>
            </Label>
            <Input
              id="claim-to"
              value={claimToInput}
              onChange={(event) => setClaimToInput(event.target.value)}
              placeholder="cliente1@acme.com, cliente2@acme.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="claim-cc">CC manual (opcional)</Label>
            <Input
              id="claim-cc"
              value={claimCcInput}
              onChange={(event) => setClaimCcInput(event.target.value)}
              placeholder="equipo@acme.com"
            />
          </div>
          <div className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>
            CC responsables:{' '}
            {selectedClaimInvoice?.responsible_contacts.length
              ? selectedClaimInvoice.responsible_contacts.map((contact) => contact.email).join(', ')
              : 'sin responsables asignados al Job'}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="claim-subject">
              Asunto <span style={{ color: 'var(--status-error)' }}>*</span>
            </Label>
            <Input
              id="claim-subject"
              value={claimSubject}
              onChange={(event) => setClaimSubject(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="claim-body">
              Mensaje <span style={{ color: 'var(--status-error)' }}>*</span>
            </Label>
            <Textarea
              id="claim-body"
              value={claimBody}
              onChange={(event) => setClaimBody(event.target.value)}
              rows={7}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeClaimDialog}>Cancelar</Button>
          <Button
            onClick={handleCreateClaim}
            disabled={claimSubmitting || !claimSubject.trim() || !claimBody.trim()}
          >
            {claimSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar a aprobación
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={decisionDialogOpen}
        onClose={closeDecisionDialog}
        title={decisionMode === 'approve' ? 'Aprobar reclamación' : 'Rechazar reclamación'}
        description="El comentario de aprobación/rechazo quedará registrado en la trazabilidad."
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="decision-notes">Comentario</Label>
          <Textarea
            id="decision-notes"
            value={decisionNotes}
            onChange={(event) => setDecisionNotes(event.target.value)}
            rows={4}
            placeholder="Comentario opcional..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeDecisionDialog}>Cancelar</Button>
          <Button onClick={handleDecisionSubmit} disabled={decisionSubmitting}>
            {decisionSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {decisionMode === 'approve' ? 'Aprobar' : 'Rechazar'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

