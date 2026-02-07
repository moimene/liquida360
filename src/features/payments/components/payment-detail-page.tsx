import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Play,
  FileText,
  CreditCard,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { usePaymentRequests } from '../hooks/use-payment-requests'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { getPaymentStatusConfig } from '@/lib/payment-utils'
import { formatAmount } from '@/lib/liquidation-utils'
import { formatDate } from '@/lib/certificate-utils'
import { COUNTRIES } from '@/lib/countries'
import type { PaymentRequest, Liquidation } from '@/types'

type PaymentRequestFull = PaymentRequest & {
  liquidations?: Liquidation & {
    correspondents?: { name: string; country: string }
  }
}

export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const role = useAuth((s) => s.role)
  const { requests, loading, fetchRequests, markInProgress, markPaid, rejectRequest } =
    usePaymentRequests()

  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<'paid' | 'rejected' | null>(null)
  const [notes, setNotes] = useState('')

  const request = useMemo(
    () => requests.find((r) => r.id === id) as PaymentRequestFull | undefined,
    [requests, id],
  )

  useEffect(() => {
    if (requests.length === 0) {
      fetchRequests()
    }
  }, [requests.length, fetchRequests])

  const statusConfig = request ? getPaymentStatusConfig(request.status) : null
  const liq = request?.liquidations
  const correspondentName = liq?.correspondents?.name ?? '—'
  const correspondentCountry = useMemo(() => {
    const code = liq?.correspondents?.country
    if (!code) return ''
    return COUNTRIES.find((c) => c.code === code)?.name ?? code
  }, [liq])

  const canProcess =
    (role === 'financiero' || role === 'admin') &&
    (request?.status === 'pending' || request?.status === 'in_progress')

  const canStart = request?.status === 'pending' && (role === 'financiero' || role === 'admin')

  async function handleStart() {
    if (!id || !user) return
    setActionLoading(true)
    const { error } = await markInProgress(id, user.id)
    setActionLoading(false)

    if (error) {
      toast.error('Error al iniciar proceso', { description: error })
    } else {
      toast.success('Solicitud marcada como en proceso')
    }
  }

  async function handleConfirm() {
    if (!id || !user || !confirmDialog) return
    setActionLoading(true)

    if (confirmDialog === 'paid') {
      const { error } = await markPaid(id, user.id, notes || undefined)
      setActionLoading(false)
      if (error) {
        toast.error('Error al marcar como pagada', { description: error })
      } else {
        toast.success('Pago completado correctamente')
        setConfirmDialog(null)
        setNotes('')
      }
    } else {
      const { error } = await rejectRequest(id, user.id, notes || undefined)
      setActionLoading(false)
      if (error) {
        toast.error('Error al rechazar', { description: error })
      } else {
        toast.success('Solicitud rechazada')
        setConfirmDialog(null)
        setNotes('')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="skeleton h-8 w-64 rounded" />
        <div className="skeleton h-48 w-full rounded" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[40vh]">
        <p style={{ color: 'var(--g-text-secondary)' }}>Solicitud no encontrada</p>
        <Button variant="outline" onClick={() => navigate('/payments')}>
          <ArrowLeft className="h-4 w-4" />
          Volver a la cola
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/payments')}
            aria-label="Volver a la cola"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2
                className="font-bold"
                style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
              >
                Solicitud de Pago
              </h2>
              {statusConfig && (
                <Badge variant={statusConfig.badgeVariant}>{statusConfig.label}</Badge>
              )}
            </div>
            <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
              {correspondentName}
              {correspondentCountry ? ` · ${correspondentCountry}` : ''}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {canStart && (
            <Button variant="outline" onClick={handleStart} loading={actionLoading}>
              <Play className="h-4 w-4" />
              Iniciar proceso
            </Button>
          )}
          {canProcess && (
            <>
              <Button onClick={() => setConfirmDialog('paid')} loading={actionLoading}>
                <CheckCircle2 className="h-4 w-4" />
                Marcar como pagada
              </Button>
              <Button
                variant="destructive"
                onClick={() => setConfirmDialog('rejected')}
                loading={actionLoading}
              >
                <XCircle className="h-4 w-4" />
                Rechazar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liquidation Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Datos de la liquidación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-4">
              <DetailRow label="Corresponsal" value={correspondentName} />
              {liq && (
                <>
                  <DetailRow label="Importe" value={formatAmount(liq.amount, liq.currency)} bold />
                  <DetailRow label="Divisa" value={liq.currency} />
                  <DetailRow label="Concepto" value={liq.concept} />
                  {liq.reference && <DetailRow label="Referencia" value={liq.reference} />}
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Payment Request Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Información de la solicitud
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <dt className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                  Estado
                </dt>
                <dd>
                  {statusConfig && (
                    <Badge variant={statusConfig.badgeVariant}>{statusConfig.label}</Badge>
                  )}
                </dd>
              </div>
              <div className="border-t" style={{ borderColor: 'var(--g-border-default)' }} />
              <DetailRow label="Solicitada" value={formatDate(request.requested_at)} />
              {request.processed_at && (
                <>
                  <div className="border-t" style={{ borderColor: 'var(--g-border-default)' }} />
                  <DetailRow label="Procesada" value={formatDate(request.processed_at)} />
                </>
              )}
              {request.processed_by && (
                <>
                  <div className="border-t" style={{ borderColor: 'var(--g-border-default)' }} />
                  <DetailRow label="Procesada por" value={request.processed_by} />
                </>
              )}
              {request.notes && (
                <>
                  <div className="border-t" style={{ borderColor: 'var(--g-border-default)' }} />
                  <div>
                    <dt className="text-sm mb-1" style={{ color: 'var(--g-text-secondary)' }}>
                      Notas
                    </dt>
                    <dd
                      className="text-sm p-3"
                      style={{
                        color: 'var(--g-text-primary)',
                        backgroundColor: 'var(--g-surface-muted)',
                        borderRadius: 'var(--g-radius-sm)',
                      }}
                    >
                      {request.notes}
                    </dd>
                  </div>
                </>
              )}
            </dl>

            {/* Guidance */}
            <div
              className="mt-6 p-3 text-xs"
              style={{
                backgroundColor: 'var(--g-surface-muted)',
                borderRadius: 'var(--g-radius-sm)',
                color: 'var(--g-text-secondary)',
              }}
            >
              {request.status === 'pending' && (
                <p>
                  Esta solicitud está pendiente. Inicia el proceso para indicar que estás trabajando
                  en ella.
                </p>
              )}
              {request.status === 'in_progress' && (
                <p>
                  La solicitud está en proceso. Cuando completes el pago, márcala como pagada con
                  las notas pertinentes.
                </p>
              )}
              {request.status === 'paid' && (
                <p>Pago completado. La liquidación asociada también se ha actualizado.</p>
              )}
              {request.status === 'rejected' && (
                <p>La solicitud ha sido rechazada. La liquidación permanece en estado aprobado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Link to liquidation */}
      {liq && (
        <Card>
          <CardContent className="py-3">
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: 'var(--g-brand-3308)' }}
              onClick={() => navigate(`/liquidations/${liq.id}`)}
            >
              <Building2 className="h-4 w-4" />
              Ver liquidación asociada →
            </button>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog !== null}
        onClose={() => {
          setConfirmDialog(null)
          setNotes('')
        }}
        title={confirmDialog === 'paid' ? 'Confirmar pago' : 'Rechazar solicitud'}
        description={
          confirmDialog === 'paid'
            ? 'Confirma que el pago ha sido realizado.'
            : 'Indica el motivo del rechazo.'
        }
      >
        <div className="flex flex-col gap-4">
          {liq && (
            <div
              className="flex justify-between items-center p-3"
              style={{
                backgroundColor: 'var(--g-surface-muted)',
                borderRadius: 'var(--g-radius-sm)',
              }}
            >
              <span className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                {correspondentName}
              </span>
              <span className="font-bold" style={{ color: 'var(--g-brand-3308)' }}>
                {formatAmount(liq.amount, liq.currency)}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notas {confirmDialog === 'rejected' ? '' : '(opcional)'}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                confirmDialog === 'paid'
                  ? 'Nº de transferencia, referencia bancaria...'
                  : 'Motivo del rechazo...'
              }
            />
          </div>
        </div>

        <DialogFooter className="mt-6 -mx-6 -mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setConfirmDialog(null)
              setNotes('')
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={confirmDialog === 'rejected' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            loading={actionLoading}
          >
            {confirmDialog === 'paid' ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirmar pago
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Rechazar
              </>
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

/* ── Detail Row ──────────────────────────────────────── */

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
        {label}
      </dt>
      <dd
        className={`text-sm ${bold ? 'font-bold' : 'font-medium'}`}
        style={{
          color: bold ? 'var(--g-brand-3308)' : 'var(--g-text-primary)',
        }}
      >
        {value}
      </dd>
    </div>
  )
}
