import { useEffect, useState, useMemo } from 'react'
import { useGInvAccounting } from '../hooks/use-ginv-accounting'
import { useAuth } from '@/features/auth'
import { INTAKE_STATUS_CONFIG, INTAKE_TYPE_LABELS } from '../constants/ginvoice-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Search, Download, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useSignedUrl } from '../hooks/use-signed-url'

export function AccountingPage() {
  const { items, loading, fetchAccountingQueue, sendToAccounting, postToSap, exportCsvData } = useGInvAccounting()
  const { user } = useAuth()
  const { getUrl: getSignedUrl, loading: loadingPdf } = useSignedUrl()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // SAP posting dialog
  const [sapDialogOpen, setSapDialogOpen] = useState(false)
  const [sapItemId, setSapItemId] = useState<string | null>(null)
  const [sapReference, setSapReference] = useState('')
  const [sapNotes, setSapNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAccountingQueue()
  }, [fetchAccountingQueue])

  const filtered = useMemo(() => {
    let result = items
    if (statusFilter !== 'all') {
      result = result.filter((i) => i.status === statusFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (i) =>
          (i.invoice_number ?? '').toLowerCase().includes(q) ||
          (i.concept_text ?? '').toLowerCase().includes(q),
      )
    }
    return result
  }, [items, statusFilter, search])

  const approvedCount = items.filter((i) => i.status === 'approved').length
  const sentCount = items.filter((i) => i.status === 'sent_to_accounting').length
  const postedCount = items.filter((i) => i.status === 'posted').length

  async function handleSendToAccounting(id: string) {
    const { error } = await sendToAccounting(id)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Enviado a contabilización')
  }

  function openSapDialog(itemId: string) {
    setSapItemId(itemId)
    setSapReference('')
    setSapNotes('')
    setSapDialogOpen(true)
  }

  async function handlePostSap() {
    if (!sapItemId || !user || !sapReference.trim()) return
    setSubmitting(true)
    const { error } = await postToSap(sapItemId, sapReference.trim(), user.id, sapNotes)
    setSubmitting(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Contabilizado en SAP')
    setSapDialogOpen(false)
  }

  function handleExportCsv() {
    const csv = exportCsvData()
    if (!csv.includes('\n')) {
      toast.error('No hay items para exportar')
      return
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contabilizacion_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Contabilización
          </h1>
          <p style={{ color: 'var(--g-text-secondary)' }}>
            Cola BPO de contabilización y registro SAP
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCsv}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--status-info)' }}>
            {approvedCount}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Aprobados (pendientes)</div>
        </div>
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--status-warning)' }}>
            {sentCount}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>En contabilización</div>
        </div>
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--status-success)' }}>
            {postedCount}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Contabilizados</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--g-text-tertiary)' }} />
          <Input
            placeholder="Buscar por nº factura o concepto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[200px]"
        >
          <option value="all">Todos los estados</option>
          <option value="approved">Aprobados</option>
          <option value="sent_to_accounting">En contabilización</option>
          <option value="posted">Contabilizados</option>
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
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Tipo</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Nº Factura</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Importe</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Concepto</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Documento</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Estado</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8" style={{ color: 'var(--g-text-tertiary)' }}>
                    No hay items en la cola de contabilización
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const statusConfig = INTAKE_STATUS_CONFIG[item.status] ?? INTAKE_STATUS_CONFIG.draft
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {INTAKE_TYPE_LABELS[item.type] ?? item.type}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {item.invoice_number || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: item.currency }).format(item.amount)}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: 'var(--g-text-secondary)' }}>
                        {item.concept_text || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {item.file_path ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={loadingPdf}
                            onClick={async () => {
                              const { url, error } = await getSignedUrl({
                                bucketId: 'ginv-documents',
                                path: item.file_path!,
                                expiresIn: 300,
                              })
                              if (error || !url) {
                                toast.error(error ?? 'No se pudo abrir el PDF')
                                return
                              }
                              window.open(url, '_blank')
                            }}
                          >
                            Ver
                          </Button>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--g-text-tertiary)' }}>Sin archivo</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-0.5 text-xs font-medium"
                          style={{
                            color: statusConfig.color,
                            backgroundColor: statusConfig.bg,
                            borderRadius: 'var(--g-radius-full)',
                          }}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.status === 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendToAccounting(item.id)}
                          >
                            Enviar a contab.
                          </Button>
                        )}
                        {item.status === 'sent_to_accounting' && (
                          <Button
                            size="sm"
                            onClick={() => openSapDialog(item.id)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Registrar SAP
                          </Button>
                        )}
                        {item.status === 'posted' && (
                          <span className="text-xs" style={{ color: 'var(--status-success)' }}>
                            Contabilizado
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* SAP posting dialog */}
      <Dialog
        open={sapDialogOpen}
        onClose={() => setSapDialogOpen(false)}
        title="Registrar contabilización SAP"
        description="Introduce la referencia del asiento en SAP"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sap-ref">
              Referencia SAP <span style={{ color: 'var(--status-error)' }}>*</span>
            </Label>
            <Input
              id="sap-ref"
              value={sapReference}
              onChange={(e) => setSapReference(e.target.value)}
              placeholder="ej. 5000012345"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sap-notes">Notas</Label>
            <Textarea
              id="sap-notes"
              value={sapNotes}
              onChange={(e) => setSapNotes(e.target.value)}
              placeholder="Observaciones opcionales..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSapDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePostSap} disabled={submitting || !sapReference.trim()}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
