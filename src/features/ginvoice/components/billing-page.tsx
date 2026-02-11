import { useEffect, useState, useMemo } from 'react'
import { useGInvBilling } from '../hooks/use-ginv-billing'
import { useGInvJobs } from '../hooks/use-ginv-jobs'
import { useAuth } from '@/features/auth'
import { INTAKE_STATUS_CONFIG, INTAKE_TYPE_LABELS } from '../constants/ginvoice-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Search, Package, FileStack } from 'lucide-react'
import { toast } from 'sonner'
import { useSignedUrl } from '../hooks/use-signed-url'

export function BillingPage() {
  const {
    readyItems,
    batches,
    batchItems,
    loading,
    fetchReadyToBill,
    fetchBatches,
    fetchBatchItems,
    createBatch,
    setDecision,
    updateUttaiSubjectObliged,
  } = useGInvBilling()
  const { jobs, fetchJobs } = useGInvJobs()
  const { user } = useAuth()
  const { getUrl: getSignedUrl, loading: loadingPdf } = useSignedUrl()
  const [search, setSearch] = useState('')
  const [jobFilter, setJobFilter] = useState<string>('all')
  const [tab, setTab] = useState<'items' | 'batches'>('items')

  // Batch creation dialog
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [batchJobId, setBatchJobId] = useState('')
  const [batchUttai, setBatchUttai] = useState<string>('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  // Batch detail dialog
  const [detailBatchId, setDetailBatchId] = useState<string | null>(null)

  useEffect(() => {
    fetchReadyToBill()
    fetchBatches()
    fetchJobs()
  }, [fetchReadyToBill, fetchBatches, fetchJobs])

  // Items that are posted (ready to be grouped into batches)
  const postedItems = useMemo(() => readyItems.filter((i) => i.status === 'posted'), [readyItems])
  const readyToBillItems = useMemo(() => readyItems.filter((i) => i.status === 'ready_to_bill'), [readyItems])

  const filteredItems = useMemo(() => {
    let result = postedItems
    if (jobFilter !== 'all') {
      result = result.filter((i) => i.job_id === jobFilter)
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
  }, [postedItems, jobFilter, search])

  const jobOptions = useMemo(() => {
    const jobIds = new Set(postedItems.map((i) => i.job_id).filter(Boolean))
    return jobs.filter((j) => jobIds.has(j.id))
  }, [postedItems, jobs])

  function toggleItemSelection(id: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openBatchDialog() {
    if (selectedItems.size === 0) {
      toast.error('Selecciona al menos un cargo')
      return
    }
    // All selected must belong to the same job
    const selectedArr = Array.from(selectedItems)
    const jobIds = new Set(postedItems.filter((i) => selectedArr.includes(i.id)).map((i) => i.job_id))
    if (jobIds.size > 1) {
      toast.error('Todos los cargos deben pertenecer al mismo Job')
      return
    }
    const jobId = Array.from(jobIds)[0]
    if (jobId) setBatchJobId(jobId)
    setBatchUttai('')
    setBatchDialogOpen(true)
  }

  async function handleCreateBatch() {
    if (!user || !batchJobId) return
    setSubmitting(true)
    const uttaiValue = batchUttai === 'yes' ? true : batchUttai === 'no' ? false : null
    const { error } = await createBatch(batchJobId, Array.from(selectedItems), user.id, uttaiValue)
    setSubmitting(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Lote creado correctamente')
    setBatchDialogOpen(false)
    setSelectedItems(new Set())
    fetchReadyToBill()
    fetchBatches()
  }

  async function handleDecision(batchItemId: string, decision: 'emit' | 'transfer' | 'discard') {
    const { error } = await setDecision(batchItemId, decision)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Decisión registrada')
  }

  async function handleUttaiToggle(batchId: string, current: boolean | null) {
    const newValue = current === true ? false : true
    const { error } = await updateUttaiSubjectObliged(batchId, newValue)
    if (error) toast.error(error)
  }

  function openBatchDetail(batchId: string) {
    setDetailBatchId(batchId)
    fetchBatchItems(batchId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Para Facturar
          </h1>
          <p style={{ color: 'var(--g-text-secondary)' }}>
            Cargos contabilizados disponibles para emisión de factura
          </p>
        </div>
        {tab === 'items' && selectedItems.size > 0 && (
          <Button onClick={openBatchDialog}>
            <Package className="h-4 w-4 mr-2" />
            Crear lote ({selectedItems.size})
          </Button>
        )}
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
            {postedItems.length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Contabilizados (pte. agrupar)</div>
        </div>
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--g-brand-3308)' }}>
            {readyToBillItems.length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>En lotes para facturar</div>
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
            {batches.length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Lotes creados</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1" style={{ borderBottom: '1px solid var(--g-border-default)' }}>
        <button
          className="px-4 py-2 text-sm font-medium transition-colors"
          style={{
            color: tab === 'items' ? 'var(--g-brand-3308)' : 'var(--g-text-secondary)',
            borderBottom: tab === 'items' ? '2px solid var(--g-brand-3308)' : '2px solid transparent',
          }}
          onClick={() => setTab('items')}
        >
          Cargos disponibles
        </button>
        <button
          className="px-4 py-2 text-sm font-medium transition-colors"
          style={{
            color: tab === 'batches' ? 'var(--g-brand-3308)' : 'var(--g-text-secondary)',
            borderBottom: tab === 'batches' ? '2px solid var(--g-brand-3308)' : '2px solid transparent',
          }}
          onClick={() => setTab('batches')}
        >
          Lotes ({batches.length})
        </button>
      </div>

      {tab === 'items' && (
        <>
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
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="w-[220px]"
            >
              <option value="all">Todos los jobs</option>
              {jobOptions.map((j) => (
                <option key={j.id} value={j.id}>{j.job_code} — {j.client_name}</option>
              ))}
            </Select>
          </div>

          {/* Items table */}
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
                    <th className="text-left px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(new Set(filteredItems.map((i) => i.id)))
                          } else {
                            setSelectedItems(new Set())
                          }
                        }}
                        checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Tipo</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Nº Factura</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Importe</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Concepto</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Documento</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8" style={{ color: 'var(--g-text-tertiary)' }}>
                        No hay cargos contabilizados disponibles
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const sc = INTAKE_STATUS_CONFIG[item.status] ?? INTAKE_STATUS_CONFIG.draft
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.id)}
                              onChange={() => toggleItemSelection(item.id)}
                            />
                          </td>
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
                              style={{ color: sc.color, backgroundColor: sc.bg, borderRadius: 'var(--g-radius-full)' }}
                            >
                              {sc.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'batches' && (
        <div
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
            overflow: 'hidden',
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Lote</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Job</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Estado</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Suj. Obligado</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8" style={{ color: 'var(--g-text-tertiary)' }}>
                    No hay lotes creados
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const job = jobs.find((j) => j.id === batch.job_id)
                  return (
                    <tr key={batch.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--g-text-primary)' }}>
                        {batch.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {job ? `${job.job_code} — ${job.client_name}` : batch.job_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-0.5 text-xs font-medium"
                          style={{
                            color: 'var(--status-info)',
                            backgroundColor: 'var(--status-info-bg)',
                            borderRadius: 'var(--g-radius-full)',
                          }}
                        >
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="text-xs font-medium px-2 py-0.5"
                          style={{
                            color: batch.uttai_subject_obliged === true ? 'var(--status-warning)' : batch.uttai_subject_obliged === false ? 'var(--status-success)' : 'var(--g-text-tertiary)',
                            backgroundColor: batch.uttai_subject_obliged === true ? 'var(--status-warning-bg)' : batch.uttai_subject_obliged === false ? 'var(--status-success-bg)' : 'var(--g-surface-hover)',
                            borderRadius: 'var(--g-radius-full)',
                          }}
                          onClick={() => handleUttaiToggle(batch.id, batch.uttai_subject_obliged)}
                        >
                          {batch.uttai_subject_obliged === true && 'Sí'}
                          {batch.uttai_subject_obliged === false && 'No'}
                          {batch.uttai_subject_obliged === null && 'Sin definir'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openBatchDetail(batch.id)}
                        >
                          <FileStack className="h-3.5 w-3.5 mr-1" />
                          Ver cargos
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create batch dialog */}
      <Dialog
        open={batchDialogOpen}
        onClose={() => setBatchDialogOpen(false)}
        title="Crear lote de facturación"
        description={`${selectedItems.size} cargo(s) seleccionado(s)`}
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label>Job</Label>
            <Input
              value={jobs.find((j) => j.id === batchJobId)?.job_code ?? batchJobId}
              disabled
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="batch-uttai">Sujeto obligado UTTAI</Label>
            <Select id="batch-uttai" value={batchUttai} onChange={(e) => setBatchUttai(e.target.value)}>
              <option value="">Sin definir</option>
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateBatch} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Lote
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Batch detail dialog */}
      <Dialog
        open={!!detailBatchId}
        onClose={() => setDetailBatchId(null)}
        title="Cargos del lote"
        description="Decisiones por cargo: emitir, transferir o descartar"
      >
        <div className="max-h-[50vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'var(--g-text-secondary)' }}>Item</th>
                <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'var(--g-text-secondary)' }}>Decisión</th>
                <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: 'var(--g-text-secondary)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {batchItems.map((bi) => (
                <tr key={bi.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--g-text-primary)' }}>
                    {bi.intake_item_id.slice(0, 8)}
                  </td>
                  <td className="px-3 py-2">
                    {bi.decision ? (
                      <span
                        className="inline-flex px-2 py-0.5 text-xs font-medium"
                        style={{
                          color: bi.decision === 'emit' ? 'var(--status-success)' : bi.decision === 'transfer' ? 'var(--status-info)' : 'var(--status-error)',
                          backgroundColor: bi.decision === 'emit' ? 'var(--status-success-bg)' : bi.decision === 'transfer' ? 'var(--status-info-bg)' : 'var(--status-error-bg)',
                          borderRadius: 'var(--g-radius-full)',
                        }}
                      >
                        {bi.decision === 'emit' ? 'Emitir' : bi.decision === 'transfer' ? 'Transferir' : 'Descartar'}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--g-text-tertiary)' }}>Pendiente</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        className="px-2 py-0.5 text-xs font-medium transition-colors"
                        style={{
                          color: bi.decision === 'emit' ? 'white' : 'var(--status-success)',
                          backgroundColor: bi.decision === 'emit' ? 'var(--status-success)' : 'transparent',
                          borderRadius: 'var(--g-radius-sm)',
                          border: '1px solid var(--status-success)',
                        }}
                        onClick={() => handleDecision(bi.id, 'emit')}
                      >
                        Emitir
                      </button>
                      <button
                        className="px-2 py-0.5 text-xs font-medium transition-colors"
                        style={{
                          color: bi.decision === 'transfer' ? 'white' : 'var(--status-info)',
                          backgroundColor: bi.decision === 'transfer' ? 'var(--status-info)' : 'transparent',
                          borderRadius: 'var(--g-radius-sm)',
                          border: '1px solid var(--status-info)',
                        }}
                        onClick={() => handleDecision(bi.id, 'transfer')}
                      >
                        Transferir
                      </button>
                      <button
                        className="px-2 py-0.5 text-xs font-medium transition-colors"
                        style={{
                          color: bi.decision === 'discard' ? 'white' : 'var(--status-error)',
                          backgroundColor: bi.decision === 'discard' ? 'var(--status-error)' : 'transparent',
                          borderRadius: 'var(--g-radius-sm)',
                          border: '1px solid var(--status-error)',
                        }}
                        onClick={() => handleDecision(bi.id, 'discard')}
                      >
                        Descartar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDetailBatchId(null)}>
            Cerrar
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
