import { useEffect, useState, useMemo } from 'react'
import { useGInvDeliveries } from '../hooks/use-ginv-deliveries'
import { useGInvInvoices } from '../hooks/use-ginv-invoices'
import { useAuth } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Send, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface RecipientInput {
  name: string
  email: string
}

export function DeliveryPage() {
  const { deliveries, loading: loadingDeliveries, fetchDeliveries, createDelivery } = useGInvDeliveries()
  const { invoices, loading: loadingInvoices, fetchInvoices } = useGInvInvoices()
  const { user } = useAuth()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipients, setRecipients] = useState<RecipientInput[]>([{ name: '', email: '' }])

  const loading = loadingDeliveries || loadingInvoices

  useEffect(() => {
    fetchDeliveries()
    fetchInvoices()
  }, [fetchDeliveries, fetchInvoices])

  // Invoices ready for delivery (issued status)
  const deliverableInvoices = useMemo(
    () => invoices.filter((i) => i.status === 'issued'),
    [invoices],
  )

  function addRecipient() {
    setRecipients([...recipients, { name: '', email: '' }])
  }

  function removeRecipient(index: number) {
    setRecipients(recipients.filter((_, i) => i !== index))
  }

  function updateRecipient(index: number, field: keyof RecipientInput, value: string) {
    setRecipients(recipients.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  async function handleSend() {
    if (!user || !selectedInvoiceId) return
    const validRecipients = recipients.filter((r) => r.email.trim())
    if (validRecipients.length === 0) {
      toast.error('Añade al menos un destinatario con email')
      return
    }

    setSubmitting(true)
    const { error } = await createDelivery({
      clientInvoiceId: selectedInvoiceId,
      deliveryType: 'email',
      recipients: validRecipients,
      subject: subject || 'Factura adjunta',
      body: body || '',
      sentBy: user.id,
    })
    setSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }
    toast.success('Entrega registrada correctamente')
    setDialogOpen(false)
    resetForm()
    fetchInvoices()
  }

  function resetForm() {
    setSelectedInvoiceId('')
    setSubject('')
    setBody('')
    setRecipients([{ name: '', email: '' }])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Entregas
          </h1>
          <p style={{ color: 'var(--g-text-secondary)' }}>
            Envío de facturas a clientes
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={deliverableInvoices.length === 0}>
          <Send className="h-4 w-4 mr-2" />
          Nueva Entrega
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
            {deliverableInvoices.length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Pte. entrega</div>
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
            {deliveries.filter((d) => d.status === 'sent').length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Enviadas</div>
        </div>
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--g-text-primary)' }}>
            {deliveries.length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>Total entregas</div>
        </div>
      </div>

      {/* Deliveries table */}
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
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Factura</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Tipo</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Destinatarios</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Asunto</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Estado</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Enviado</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8" style={{ color: 'var(--g-text-tertiary)' }}>
                    No hay entregas registradas
                  </td>
                </tr>
              ) : (
                deliveries.map((del) => (
                  <tr key={del.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--g-text-primary)' }}>
                      {del.client_invoice_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>
                      {del.delivery_type}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                      {Array.isArray(del.recipients) ? del.recipients.length : 0} destinatario(s)
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: 'var(--g-text-secondary)' }}>
                      {del.subject || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex px-2 py-0.5 text-xs font-medium"
                        style={{
                          color: del.status === 'sent' ? 'var(--status-success)' : 'var(--status-warning)',
                          backgroundColor: del.status === 'sent' ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
                          borderRadius: 'var(--g-radius-full)',
                        }}
                      >
                        {del.status === 'sent' ? 'Enviada' : del.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-tertiary)' }}>
                      {del.sent_at ? formatDistanceToNow(new Date(del.sent_at), { addSuffix: true, locale: es }) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Send delivery dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); resetForm() }}
        title="Enviar factura a cliente"
        description="Selecciona la factura y configura los destinatarios"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="del-invoice">Factura emitida</Label>
            <select
              id="del-invoice"
              className="flex h-10 w-full px-3 text-sm border rounded-md"
              style={{
                backgroundColor: 'var(--g-surface-card)',
                color: 'var(--g-text-primary)',
                borderColor: 'var(--g-border-subtle)',
                borderRadius: 'var(--g-radius-md)',
              }}
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
            >
              <option value="">Seleccionar factura</option>
              {deliverableInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.sap_invoice_number || inv.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="del-subject">Asunto</Label>
            <Input id="del-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Factura adjunta" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="del-body">Mensaje</Label>
            <Textarea id="del-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Cuerpo del email..." rows={3} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Destinatarios</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addRecipient}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Añadir
              </Button>
            </div>
            {recipients.map((r, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder="Nombre"
                  value={r.name}
                  onChange={(e) => updateRecipient(i, 'name', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="email@ejemplo.com"
                  type="email"
                  value={r.email}
                  onChange={(e) => updateRecipient(i, 'email', e.target.value)}
                  className="flex-1"
                />
                {recipients.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRecipient(i)}>
                    <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--status-error)' }} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>Cancelar</Button>
          <Button onClick={handleSend} disabled={submitting || !selectedInvoiceId}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Send className="h-4 w-4 mr-1" />
            Enviar
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
