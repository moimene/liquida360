import { useEffect, useState, useMemo } from 'react'
import { useGInvInvoices } from '../hooks/use-ginv-invoices'
import { useGInvBilling } from '../hooks/use-ginv-billing'
import { useAuth } from '@/features/auth'
import { INVOICE_STATUS_CONFIG } from '../constants/ginvoice-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Search, FileOutput, Check, ThumbsUp, FileText, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSignedUrl } from '../hooks/use-signed-url'
import { buildSapDeepLink } from '../lib/sap-links'
import { getSapPayloadAttachmentCount, getSapPayloadFxSummary } from '../lib/fx-audit'

export function InvoicesPage() {
  const {
    invoices,
    loading,
    fetchInvoices,
    createInvoice,
    registerSapInvoice,
    requestPartnerApproval,
    approveAsPartner,
  } = useGInvInvoices()
  const { batches, fetchBatches } = useGInvBilling()
  const { user, ginvRole } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Create invoice dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [createSubmitting, setCreateSubmitting] = useState(false)

  // SAP registration dialog
  const [sapDialogOpen, setSapDialogOpen] = useState(false)
  const [sapInvoiceId, setSapInvoiceId] = useState<string | null>(null)
  const [sapNumber, setSapNumber] = useState('')
  const [sapDate, setSapDate] = useState('')
  const [sapPdf, setSapPdf] = useState<File | undefined>()
  const [sapSubmitting, setSapSubmitting] = useState(false)

  // PDF viewer state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const { getUrl: getSignedUrl, loading: loadingPdf } = useSignedUrl()

  useEffect(() => {
    fetchInvoices()
    fetchBatches()
  }, [fetchInvoices, fetchBatches])

  const isPartner = ginvRole === 'ginv_socio_aprobador' || ginvRole === 'ginv_admin'

  const filtered = useMemo(() => {
    let result = invoices
    if (statusFilter !== 'all') {
      result = result.filter((i) => i.status === statusFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (i) =>
          (i.sap_invoice_number ?? '').toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q),
      )
    }
    return result
  }, [invoices, statusFilter, search])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    invoices.forEach((i) => {
      counts[i.status] = (counts[i.status] ?? 0) + 1
    })
    return counts
  }, [invoices])

  async function handleCreate() {
    if (!user || !selectedBatchId) return
    setCreateSubmitting(true)
    const { error } = await createInvoice(selectedBatchId, user.id)
    setCreateSubmitting(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Factura creada')
    setCreateDialogOpen(false)
    setSelectedBatchId('')
  }

  async function handleRequestApproval(id: string) {
    const { error } = await requestPartnerApproval(id)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Enviada para aprobación del socio')
  }

  async function handleApprove(id: string) {
    const { error } = await approveAsPartner(id)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Factura aprobada — lista para SAP')
  }

  function openSapDialog(id: string) {
    setSapInvoiceId(id)
    setSapNumber('')
    setSapDate('')
    setSapPdf(undefined)
    setSapDialogOpen(true)
  }

  async function handleRegisterSap() {
    if (!sapInvoiceId || !sapNumber.trim() || !sapDate) return
    setSapSubmitting(true)
    const { error, warning } = await registerSapInvoice(sapInvoiceId, sapNumber.trim(), sapDate, sapPdf)
    setSapSubmitting(false)
    if (error) {
      toast.error(error)
      return
    }
    if (warning) toast.warning(warning)
    toast.success('Factura emitida en SAP')
    setSapDialogOpen(false)
  }

  function openSapInvoice(sapInvoiceNumber: string) {
    const sapUrl = buildSapDeepLink(sapInvoiceNumber)
    if (!sapUrl) {
      toast.error('Configura la URL SAP en Ajustes G-Invoice (plantilla con {ref}).')
      return
    }
    window.open(sapUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Facturas Cliente
          </h1>
          <p style={{ color: 'var(--g-text-secondary)' }}>
            Emisión, aprobación y registro de facturas a clientes
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <FileOutput className="h-4 w-4 mr-2" />
          Nueva Factura
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['invoice_draft', 'pending_partner_approval', 'ready_for_sap', 'issued'] as const).map((status) => {
          const config = INVOICE_STATUS_CONFIG[status]
          return (
            <div
              key={status}
              className="p-4"
              style={{
                backgroundColor: 'var(--g-surface-card)',
                borderRadius: 'var(--g-radius-lg)',
                border: '1px solid var(--g-border-default)',
              }}
            >
              <div className="text-2xl font-bold" style={{ color: config.color }}>
                {statusCounts[status] ?? 0}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>
                {config.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--g-text-tertiary)' }} />
          <Input
            placeholder="Buscar por nº factura SAP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[220px]"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(INVOICE_STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </Select>
      </div>

      {/* Table */}
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
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>ID</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Nº SAP</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Fecha SAP</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Adj. tasa</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>FX EUR</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>PDF</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Estado</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8" style={{ color: 'var(--g-text-tertiary)' }}>
                    No hay facturas
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const sc = INVOICE_STATUS_CONFIG[inv.status] ?? INVOICE_STATUS_CONFIG.invoice_draft
                  const sapInvoiceNumber = inv.sap_invoice_number ?? undefined
                  const attachmentCount = getSapPayloadAttachmentCount(inv.sap_payload)
                  const fxSummary = getSapPayloadFxSummary(inv.sap_payload)
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--g-text-primary)' }}>
                        {inv.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {sapInvoiceNumber ? (
                          <button
                            className="inline-flex items-center gap-1 text-sm font-medium"
                            style={{ color: 'var(--g-brand-3308)' }}
                            onClick={() => openSapInvoice(sapInvoiceNumber)}
                          >
                            {sapInvoiceNumber}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>
                        {inv.sap_invoice_date ? format(new Date(inv.sap_invoice_date), 'dd MMM yyyy', { locale: es }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                        {attachmentCount > 0 ? `${attachmentCount} adj.` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                        {typeof fxSummary.totalAmountEur === 'number'
                          ? `${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(fxSummary.totalAmountEur)}${fxSummary.missingRatesCount > 0 ? ` (${fxSummary.missingRatesCount} sin TC)` : ''}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {inv.pdf_file_path ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              const { url, error } = await getSignedUrl({
                                bucketId: 'ginv-documents',
                                path: inv.pdf_file_path!,
                                expiresIn: 300,
                              })
                              if (error || !url) {
                                toast.error(error ?? 'No se pudo abrir el PDF')
                                return
                              }
                              setPdfUrl(url)
                              setPdfViewerOpen(true)
                            }}
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            Ver
                          </Button>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--g-text-tertiary)' }}>Sin PDF</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-0.5 text-xs font-medium"
                          style={{ color: sc.color, backgroundColor: sc.bg, borderRadius: 'var(--g-radius-full)' }}
                        >
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {inv.status === 'invoice_draft' && (
                            <Button size="sm" variant="outline" onClick={() => handleRequestApproval(inv.id)}>
                              Solicitar aprobación
                            </Button>
                          )}
                          {inv.status === 'pending_partner_approval' && isPartner && (
                            <Button size="sm" onClick={() => handleApprove(inv.id)}>
                              <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                              Aprobar
                            </Button>
                          )}
                          {inv.status === 'ready_for_sap' && (
                            <Button size="sm" onClick={() => openSapDialog(inv.id)}>
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Emitir en SAP
                            </Button>
                          )}
                          {inv.status === 'issued' && sapInvoiceNumber && (
                            <Button size="sm" variant="outline" onClick={() => openSapInvoice(sapInvoiceNumber)}>
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              Abrir SAP
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create invoice dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Nueva Factura Cliente"
        description="Selecciona el lote de facturación para generar la factura"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="batch-select">Lote de facturación</Label>
          <Select id="batch-select" value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)}>
            <option value="">Seleccionar lote</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id.slice(0, 8)} — {b.status}
              </option>
            ))}
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={createSubmitting || !selectedBatchId}>
            {createSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Factura
          </Button>
        </DialogFooter>
      </Dialog>

      {/* SAP registration dialog */}
      <Dialog
        open={sapDialogOpen}
        onClose={() => setSapDialogOpen(false)}
        title="Emitir factura en SAP"
        description="Registra el número de factura SAP y adjunta el PDF"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sap-inv-num">
              Nº Factura SAP <span style={{ color: 'var(--status-error)' }}>*</span>
            </Label>
            <Input id="sap-inv-num" value={sapNumber} onChange={(e) => setSapNumber(e.target.value)} placeholder="ej. 9000012345" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sap-inv-date">
              Fecha Factura <span style={{ color: 'var(--status-error)' }}>*</span>
            </Label>
            <Input id="sap-inv-date" type="date" value={sapDate} onChange={(e) => setSapDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>PDF Factura</Label>
            <Input type="file" accept=".pdf" onChange={(e) => setSapPdf(e.target.files?.[0])} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSapDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleRegisterSap} disabled={sapSubmitting || !sapNumber.trim() || !sapDate}>
            {sapSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Emitir
          </Button>
        </DialogFooter>
      </Dialog>

      {/* PDF Viewer */}
      <Dialog
        open={pdfViewerOpen}
        onClose={() => {
          setPdfViewerOpen(false)
          setPdfUrl(null)
        }}
        title="Factura PDF"
        description="Vista previa del documento"
      >
        {loadingPdf && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--g-brand-3308)' }} />
          </div>
        )}
        {!loadingPdf && pdfUrl && (
          <div className="border" style={{ height: '70vh' }}>
            <iframe title="Factura PDF" src={pdfUrl} className="w-full h-full" />
          </div>
        )}
      </Dialog>
    </div>
  )
}
