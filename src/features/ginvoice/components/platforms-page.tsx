import { useEffect, useState, useMemo } from 'react'
import { useGInvPlatforms } from '../hooks/use-ginv-platforms'
import { useGInvInvoices } from '../hooks/use-ginv-invoices'
import { PLATFORM_STATUS_CONFIG } from '../constants/ginvoice-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Search, Plus, MonitorSmartphone, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSignedUrl } from '../hooks/use-signed-url'

export function PlatformsPage() {
  const { tasks, loading, fetchTasks, createTask, updateTaskStatus, completeTask } = useGInvPlatforms()
  const { invoices, fetchInvoices } = useGInvInvoices()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Create task dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formInvoiceId, setFormInvoiceId] = useState('')
  const [formPlatform, setFormPlatform] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formInvNum, setFormInvNum] = useState('')
  const [formOrder, setFormOrder] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formSla, setFormSla] = useState('')

  // Complete task dialog
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null)
  const [evidenceFile, setEvidenceFile] = useState<File | undefined>()
  const [completing, setCompleting] = useState(false)
  const { getUrl: getSignedUrl } = useSignedUrl()

  useEffect(() => {
    fetchTasks()
    fetchInvoices()
  }, [fetchTasks, fetchInvoices])

  // Invoices that can have platform tasks
  const eligibleInvoices = useMemo(
    () => invoices.filter((i) => ['issued', 'delivered', 'platform_required'].includes(i.status)),
    [invoices],
  )

  const filtered = useMemo(() => {
    let result = tasks
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.platform_name.toLowerCase().includes(q) ||
          (t.client_platform_code ?? '').toLowerCase().includes(q) ||
          (t.invoice_number ?? '').toLowerCase().includes(q),
      )
    }
    return result
  }, [tasks, statusFilter, search])

  const pendingCount = tasks.filter((t) => t.status === 'pending').length
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length
  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const overdueCount = tasks.filter((t) => t.sla_due_at && isPast(new Date(t.sla_due_at)) && t.status !== 'completed').length

  async function handleCreate() {
    if (!formInvoiceId || !formPlatform.trim()) return
    setSubmitting(true)
    const { error } = await createTask({
      clientInvoiceId: formInvoiceId,
      platformName: formPlatform.trim(),
      clientPlatformCode: formCode || undefined,
      invoiceNumber: formInvNum || undefined,
      orderNumber: formOrder || undefined,
      notes: formNotes || undefined,
      slaDueAt: formSla || undefined,
    })
    setSubmitting(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Tarea de plataforma creada')
    setDialogOpen(false)
    resetForm()
  }

  function resetForm() {
    setFormInvoiceId('')
    setFormPlatform('')
    setFormCode('')
    setFormInvNum('')
    setFormOrder('')
    setFormNotes('')
    setFormSla('')
  }

  async function handleStatusChange(id: string, status: 'pending' | 'in_progress' | 'blocked') {
    const { error } = await updateTaskStatus(id, status)
    if (error) toast.error(error)
    else toast.success('Estado actualizado')
  }

  function openCompleteDialog(taskId: string) {
    setCompleteTaskId(taskId)
    setEvidenceFile(undefined)
    setCompleteDialogOpen(true)
  }

  async function handleComplete() {
    if (!completeTaskId) return
    setCompleting(true)
    const { error } = await completeTask(completeTaskId, evidenceFile)
    setCompleting(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Tarea completada')
    setCompleteDialogOpen(false)
    fetchInvoices()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Plataformas
          </h1>
          <p style={{ color: 'var(--g-text-secondary)' }}>
            Registro y seguimiento de facturas en plataformas de clientes
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--status-warning)' }}>{pendingCount}</div>
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
          <div className="text-2xl font-bold" style={{ color: 'var(--status-info)' }}>{inProgressCount}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>En curso</div>
        </div>
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--status-success)' }}>{completedCount}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Completadas</div>
        </div>
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--status-error)' }}>{overdueCount}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Vencidas SLA</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--g-text-tertiary)' }} />
          <Input
            placeholder="Buscar plataforma, código o nº factura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[180px]"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(PLATFORM_STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </Select>
      </div>

      {/* Tasks table */}
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
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Plataforma</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Código</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Nº Factura</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>SLA</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>PDF</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Estado</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8" style={{ color: 'var(--g-text-tertiary)' }}>
                    No hay tareas de plataforma
                  </td>
                </tr>
              ) : (
                filtered.map((task) => {
                  const sc = PLATFORM_STATUS_CONFIG[task.status] ?? PLATFORM_STATUS_CONFIG.pending
                  const overdue = task.sla_due_at && isPast(new Date(task.sla_due_at)) && task.status !== 'completed'
                  return (
                    <tr key={task.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        <div className="flex items-center gap-2">
                          <MonitorSmartphone className="h-4 w-4" style={{ color: 'var(--g-text-tertiary)' }} />
                          {task.platform_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                        {task.client_platform_code || '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>
                        {task.invoice_number || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: overdue ? 'var(--status-error)' : 'var(--g-text-secondary)' }}>
                        {task.sla_due_at ? format(new Date(task.sla_due_at), 'dd MMM yyyy', { locale: es }) : '—'}
                        {overdue && <span className="ml-1 font-medium">(vencida)</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            const invoice = invoices.find((i) => i.id === task.client_invoice_id)
                            if (!invoice?.pdf_file_path) {
                              toast.error('Factura sin PDF registrado')
                              return
                            }
                            const { url, error } = await getSignedUrl({
                              bucketId: 'ginv-documents',
                              path: invoice.pdf_file_path,
                              expiresIn: 300,
                            })
                            if (error || !url) {
                              toast.error(error ?? 'No se pudo abrir el PDF')
                              return
                            }
                            window.open(url, '_blank')
                          }}
                        >
                          PDF
                        </Button>
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
                        <div className="flex justify-end gap-1">
                          {task.status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(task.id, 'in_progress')}>
                              Iniciar
                            </Button>
                          )}
                          {(task.status === 'pending' || task.status === 'in_progress') && (
                            <Button size="sm" onClick={() => openCompleteDialog(task.id)}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Completar
                            </Button>
                          )}
                          {task.status === 'in_progress' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(task.id, 'blocked')}>
                              Bloquear
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

      {/* Create task dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); resetForm() }}
        title="Nueva tarea de plataforma"
        description="Registra la factura en la plataforma del cliente"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pt-invoice">Factura</Label>
            <select
              id="pt-invoice"
              className="flex h-10 w-full px-3 text-sm border rounded-md"
              style={{
                backgroundColor: 'var(--g-surface-card)',
                color: 'var(--g-text-primary)',
                borderColor: 'var(--g-border-subtle)',
                borderRadius: 'var(--g-radius-md)',
              }}
              value={formInvoiceId}
              onChange={(e) => setFormInvoiceId(e.target.value)}
            >
              <option value="">Seleccionar factura</option>
              {eligibleInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.sap_invoice_number || inv.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pt-platform">
                Plataforma <span style={{ color: 'var(--status-error)' }}>*</span>
              </Label>
              <Input id="pt-platform" value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)} placeholder="ej. Ariba, Coupa" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pt-code">Código cliente</Label>
              <Input id="pt-code" value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="Código en plataforma" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pt-invnum">Nº Factura</Label>
              <Input id="pt-invnum" value={formInvNum} onChange={(e) => setFormInvNum(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pt-order">Nº Pedido</Label>
              <Input id="pt-order" value={formOrder} onChange={(e) => setFormOrder(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pt-sla">Fecha SLA</Label>
            <Input id="pt-sla" type="date" value={formSla} onChange={(e) => setFormSla(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pt-notes">Notas</Label>
            <Input id="pt-notes" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Observaciones opcionales" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={submitting || !formInvoiceId || !formPlatform.trim()}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Tarea
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Complete task dialog */}
      <Dialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        title="Completar tarea"
        description="Opcionalmente adjunta evidencia de registro"
      >
        <div className="flex flex-col gap-1.5">
          <Label>Evidencia (captura/PDF)</Label>
          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setEvidenceFile(e.target.files?.[0])} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleComplete} disabled={completing}>
            {completing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
