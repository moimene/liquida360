import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  CreditCard,
  Banknote,
  Check,
  X,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLiquidations } from '../hooks/use-liquidations'
import { usePaymentRequests } from '@/features/payments/hooks/use-payment-requests'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { getStatusConfig, formatAmount, STATUS_TIMELINE } from '@/lib/liquidation-utils'
import { formatDate } from '@/lib/certificate-utils'
import { COUNTRIES } from '@/lib/countries'
import type { Liquidation } from '@/types'

export function LiquidationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const role = useAuth((s) => s.role)
  const { liquidations, loading, fetchLiquidations, submitForApproval, approve, reject } =
    useLiquidations()

  const { createRequest } = usePaymentRequests()
  const [actionLoading, setActionLoading] = useState(false)

  const liquidation = useMemo(() => liquidations.find((l) => l.id === id), [liquidations, id]) as
    | (Liquidation & { correspondents?: { name: string; country: string } })
    | undefined

  useEffect(() => {
    if (liquidations.length === 0) {
      fetchLiquidations()
    }
  }, [liquidations.length, fetchLiquidations])

  const statusConfig = liquidation ? getStatusConfig(liquidation.status) : null

  const correspondentName = liquidation?.correspondents?.name ?? '—'
  const correspondentCountry = useMemo(() => {
    const code = (liquidation?.correspondents as { country?: string })?.country
    if (!code) return ''
    return COUNTRIES.find((c) => c.code === code)?.name ?? code
  }, [liquidation])

  // Determine which actions the current user can take
  const canSubmitForApproval =
    liquidation?.status === 'draft' && (role === 'pagador' || role === 'admin')

  const canApprove =
    liquidation?.status === 'pending_approval' && (role === 'supervisor' || role === 'admin')

  const canReject =
    liquidation?.status === 'pending_approval' && (role === 'supervisor' || role === 'admin')

  const canRequestPayment =
    liquidation?.status === 'approved' &&
    liquidation?.certificate_id !== null &&
    (role === 'pagador' || role === 'supervisor' || role === 'admin')

  async function handleRequestPayment() {
    if (!id) return
    setActionLoading(true)
    const { error } = await createRequest(id)
    setActionLoading(false)

    if (error) {
      toast.error('Error al solicitar pago', { description: error })
    } else {
      // Re-fetch to update the liquidation status in the store
      fetchLiquidations()
      toast.success('Solicitud de pago enviada al departamento financiero')
    }
  }

  async function handleSubmitForApproval() {
    if (!id) return
    setActionLoading(true)
    const { error } = await submitForApproval(id)
    setActionLoading(false)

    if (error) {
      toast.error('Error al enviar', { description: error })
    } else {
      toast.success('Liquidación enviada para aprobación')
    }
  }

  async function handleApprove() {
    if (!id || !user) return
    setActionLoading(true)
    const { error } = await approve(id, user.id)
    setActionLoading(false)

    if (error) {
      toast.error('Error al aprobar', { description: error })
    } else {
      toast.success('Liquidación aprobada')
    }
  }

  async function handleReject() {
    if (!id) return
    setActionLoading(true)
    const { error } = await reject(id)
    setActionLoading(false)

    if (error) {
      toast.error('Error al rechazar', { description: error })
    } else {
      toast.success('Liquidación rechazada')
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

  if (!liquidation) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[40vh]">
        <p style={{ color: 'var(--g-text-secondary)' }}>Liquidación no encontrada</p>
        <Button variant="outline" onClick={() => navigate('/liquidations')}>
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
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
            onClick={() => navigate('/liquidations')}
            aria-label="Volver al listado"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2
                className="font-bold"
                style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
              >
                {formatAmount(liquidation.amount, liquidation.currency)}
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
          {canSubmitForApproval && (
            <Button onClick={handleSubmitForApproval} loading={actionLoading}>
              <Send className="h-4 w-4" />
              Enviar a aprobación
            </Button>
          )}
          {canApprove && (
            <Button onClick={handleApprove} loading={actionLoading}>
              <CheckCircle2 className="h-4 w-4" />
              Aprobar
            </Button>
          )}
          {canReject && (
            <Button variant="destructive" onClick={handleReject} loading={actionLoading}>
              <XCircle className="h-4 w-4" />
              Rechazar
            </Button>
          )}
          {canRequestPayment && (
            <Button onClick={handleRequestPayment} loading={actionLoading}>
              <Banknote className="h-4 w-4" />
              Solicitar pago
            </Button>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <StatusTimeline
        currentStatus={liquidation.status}
        isRejected={liquidation.status === 'rejected'}
      />

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
              <DetailRow
                label="Importe"
                value={formatAmount(liquidation.amount, liquidation.currency)}
                bold
              />
              <DetailRow label="Divisa" value={liquidation.currency} />
              <DetailRow label="Concepto" value={liquidation.concept} />
              {liquidation.reference && (
                <DetailRow label="Referencia" value={liquidation.reference} />
              )}
              {liquidation.invoice_url && (
                <div className="flex justify-between items-center">
                  <dt className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                    Factura
                  </dt>
                  <dd>
                    <a
                      href={liquidation.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium"
                      style={{ color: 'var(--g-brand-3308)' }}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Descargar PDF
                    </a>
                  </dd>
                </div>
              )}
              <DetailRow label="Creada" value={formatDate(liquidation.created_at)} />
              {liquidation.updated_at !== liquidation.created_at && (
                <DetailRow
                  label="Última actualización"
                  value={formatDate(liquidation.updated_at)}
                />
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Información de pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <dt className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                  Certificado
                </dt>
                <dd>
                  {liquidation.certificate_id ? (
                    <Badge variant="success">Vigente</Badge>
                  ) : (
                    <Badge variant="destructive">Sin certificado</Badge>
                  )}
                </dd>
              </div>
              <div className="border-t" style={{ borderColor: 'var(--g-border-default)' }} />
              <div className="flex justify-between items-center">
                <dt className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                  Estado del flujo
                </dt>
                <dd>
                  {statusConfig && (
                    <Badge variant={statusConfig.badgeVariant}>{statusConfig.label}</Badge>
                  )}
                </dd>
              </div>
              {liquidation.approved_by && (
                <>
                  <div className="border-t" style={{ borderColor: 'var(--g-border-default)' }} />
                  <DetailRow label="Aprobada por" value={liquidation.approved_by} />
                </>
              )}
            </dl>

            {/* Next steps guidance */}
            <div
              className="mt-6 p-3 text-xs"
              style={{
                backgroundColor: 'var(--g-surface-muted)',
                borderRadius: 'var(--g-radius-sm)',
                color: 'var(--g-text-secondary)',
              }}
            >
              {liquidation.status === 'draft' && (
                <p>Envía la liquidación para aprobación cuando esté lista.</p>
              )}
              {liquidation.status === 'pending_approval' && (
                <p>Pendiente de que un supervisor apruebe o rechace la liquidación.</p>
              )}
              {liquidation.status === 'approved' && (
                <p>
                  Liquidación aprobada.{' '}
                  {liquidation.certificate_id
                    ? 'Puedes solicitar el pago al departamento financiero.'
                    : 'Se necesita un certificado vigente para solicitar el pago.'}
                </p>
              )}
              {liquidation.status === 'payment_requested' && (
                <p>
                  Solicitud de pago enviada al departamento financiero. Esperando procesamiento.
                </p>
              )}
              {liquidation.status === 'paid' && (
                <p>Pago completado. La liquidación está cerrada.</p>
              )}
              {liquidation.status === 'rejected' && (
                <p>La liquidación ha sido rechazada. Puedes crear una nueva desde el listado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ── Status Timeline ─────────────────────────────────── */

function StatusTimeline({
  currentStatus,
  isRejected,
}: {
  currentStatus: string
  isRejected: boolean
}) {
  const currentStep = isRejected ? -1 : STATUS_TIMELINE.findIndex((s) => s.key === currentStatus)

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          {STATUS_TIMELINE.map((step, i) => {
            const isCompleted = !isRejected && i < currentStep
            const isCurrent = !isRejected && i === currentStep

            return (
              <div key={step.key} className="flex items-center flex-1">
                {/* Node */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor: isCompleted
                        ? 'var(--g-brand-3308)'
                        : isCurrent
                          ? 'var(--g-brand-3308)'
                          : isRejected && i === 0
                            ? 'hsl(0, 84%, 60%)'
                            : 'var(--g-surface-muted)',
                      color:
                        isCompleted || isCurrent
                          ? 'var(--g-text-inverse)'
                          : isRejected && i === 0
                            ? 'white'
                            : 'var(--g-text-secondary)',
                      borderRadius: 'var(--g-radius-full)',
                      transition: 'all var(--g-transition-normal)',
                    }}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : isRejected && i === 0 ? (
                      <X className="h-4 w-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className="text-xs font-medium text-center whitespace-nowrap"
                    style={{
                      color:
                        isCompleted || isCurrent
                          ? 'var(--g-text-primary)'
                          : 'var(--g-text-secondary)',
                    }}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {i < STATUS_TIMELINE.length - 1 && (
                  <div
                    className="flex-1 h-px mx-2"
                    style={{
                      backgroundColor:
                        isCompleted && !isRejected
                          ? 'var(--g-brand-3308)'
                          : 'var(--g-border-default)',
                      transition: 'background-color var(--g-transition-normal)',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Rejected banner */}
        {isRejected && (
          <div
            className="flex items-center gap-2 mt-4 p-3 text-sm font-medium"
            style={{
              backgroundColor: 'hsl(0, 84%, 60%, 0.08)',
              borderRadius: 'var(--g-radius-sm)',
              color: 'var(--status-error)',
            }}
            role="alert"
          >
            <XCircle className="h-4 w-4 shrink-0" />
            Liquidación rechazada
          </div>
        )}
      </CardContent>
    </Card>
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
