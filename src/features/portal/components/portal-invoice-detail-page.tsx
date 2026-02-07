import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Send, FileText, CreditCard, Download, Check, X, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth'
import { usePortalCorrespondent } from '../hooks/use-portal-correspondent'
import { usePortalLiquidations } from '../hooks/use-portal-liquidations'
import { getStatusConfig, formatAmount, STATUS_TIMELINE } from '@/lib/liquidation-utils'
import { formatDate } from '@/lib/certificate-utils'

export function PortalInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const { correspondent, fetchCorrespondent } = usePortalCorrespondent()
  const { liquidations, fetchLiquidations, submitForApproval } = usePortalLiquidations()
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchCorrespondent(user.id)
    }
  }, [user?.id, fetchCorrespondent])

  useEffect(() => {
    if (correspondent?.id) {
      fetchLiquidations(correspondent.id)
    }
  }, [correspondent?.id, fetchLiquidations])

  const liquidation = useMemo(() => liquidations.find((l) => l.id === id), [liquidations, id])
  const statusConfig = liquidation ? getStatusConfig(liquidation.status) : null

  const canSubmitForApproval = liquidation?.status === 'draft'

  async function handleSubmitForApproval() {
    if (!id) return
    setActionLoading(true)
    const { error } = await submitForApproval(id)
    setActionLoading(false)

    if (error) {
      toast.error('Error al enviar', { description: error })
    } else {
      toast.success('Factura enviada para aprobacion')
    }
  }

  if (!liquidation) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[40vh]">
        <p style={{ color: 'var(--g-text-secondary)' }}>Factura no encontrada</p>
        <Button variant="outline" onClick={() => navigate('/portal/invoices')}>
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
            onClick={() => navigate('/portal/invoices')}
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
              {liquidation.concept}
            </p>
          </div>
        </div>

        {/* Action buttons - only submit for approval for corresponsal */}
        <div className="flex items-center gap-2">
          {canSubmitForApproval && (
            <Button onClick={handleSubmitForApproval} loading={actionLoading}>
              <Send className="h-4 w-4" />
              Enviar a aprobacion
            </Button>
          )}
        </div>
      </div>

      {/* Status Timeline (readonly) */}
      <PortalStatusTimeline
        currentStatus={liquidation.status}
        isRejected={liquidation.status === 'rejected'}
      />

      {/* Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Datos de la factura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-4">
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
              <DetailRow label="Creada" value={formatDate(liquidation.created_at)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Estado del proceso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <dt className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                  Estado actual
                </dt>
                <dd>
                  {statusConfig && (
                    <Badge variant={statusConfig.badgeVariant}>{statusConfig.label}</Badge>
                  )}
                </dd>
              </div>
            </dl>

            {/* Invoice PDF download link */}
            {liquidation.invoice_url && (
              <div className="mt-4">
                <a
                  href={liquidation.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--g-surface-muted)',
                    color: 'var(--g-brand-3308)',
                    borderRadius: 'var(--g-radius-sm)',
                  }}
                >
                  <Download className="h-4 w-4" />
                  Descargar factura
                </a>
              </div>
            )}

            {/* Status guidance */}
            <div
              className="mt-6 p-3 text-xs"
              style={{
                backgroundColor: 'var(--g-surface-muted)',
                borderRadius: 'var(--g-radius-sm)',
                color: 'var(--g-text-secondary)',
              }}
            >
              {liquidation.status === 'draft' && (
                <p>Tu factura esta en borrador. Enviala a aprobacion cuando este lista.</p>
              )}
              {liquidation.status === 'pending_approval' && (
                <p>Tu factura esta pendiente de aprobacion por un supervisor.</p>
              )}
              {liquidation.status === 'approved' && (
                <p>Tu factura ha sido aprobada. Se procedera a solicitar el pago.</p>
              )}
              {liquidation.status === 'payment_requested' && (
                <p>Se ha solicitado el pago al departamento financiero. En breve sera procesado.</p>
              )}
              {liquidation.status === 'paid' && <p>Pago completado. Tu factura ha sido abonada.</p>}
              {liquidation.status === 'rejected' && (
                <p>Tu factura ha sido rechazada. Contacta con el equipo para mas informacion.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* -- Status Timeline (readonly for portal) -- */

function PortalStatusTimeline({
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

                {i < STATUS_TIMELINE.length - 1 && (
                  <div
                    className="flex-1 h-px mx-2"
                    style={{
                      backgroundColor:
                        isCompleted && !isRejected
                          ? 'var(--g-brand-3308)'
                          : 'var(--g-border-default)',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

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
            Factura rechazada
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
        {label}
      </dt>
      <dd
        className={`text-sm ${bold ? 'font-bold' : 'font-medium'}`}
        style={{ color: bold ? 'var(--g-brand-3308)' : 'var(--g-text-primary)' }}
      >
        {value}
      </dd>
    </div>
  )
}
