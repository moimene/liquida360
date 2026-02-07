import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Receipt, FileCheck, AlertTriangle, CreditCard, Eye } from 'lucide-react'
import { useLiquidations } from '@/features/liquidations/hooks/use-liquidations'
import { useCertificates } from '@/features/certificates/hooks/use-certificates'
import { usePaymentRequests } from '@/features/payments/hooks/use-payment-requests'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { getStatusConfig, formatAmount } from '@/lib/liquidation-utils'
import { getCertificateStatus, formatDate } from '@/lib/certificate-utils'

export function DashboardPage() {
  const navigate = useNavigate()
  const role = useAuth((s) => s.role)
  const { liquidations, loading: loadingLiq, fetchLiquidations } = useLiquidations()
  const { certificates, loading: loadingCerts, fetchCertificates } = useCertificates()
  const { requests, loading: loadingPay, fetchRequests } = usePaymentRequests()

  useEffect(() => {
    fetchLiquidations()
    fetchCertificates()
    if (role === 'financiero' || role === 'admin') {
      fetchRequests()
    }
  }, [fetchLiquidations, fetchCertificates, fetchRequests, role])

  const stats = useMemo(() => {
    const pendingLiquidations = liquidations.filter(
      (l) => l.status === 'draft' || l.status === 'pending_approval',
    ).length

    const approvedLiquidations = liquidations.filter(
      (l) => l.status === 'approved' || l.status === 'payment_requested',
    ).length

    const validCerts = certificates.filter((c) => {
      const info = getCertificateStatus(c.expiry_date)
      return info.status === 'valid'
    }).length

    const expiringCerts = certificates.filter((c) => {
      const info = getCertificateStatus(c.expiry_date)
      return info.status === 'expiring_soon'
    }).length

    const expiredCerts = certificates.filter((c) => {
      const info = getCertificateStatus(c.expiry_date)
      return info.status === 'expired'
    }).length

    const pendingPayments = requests.filter(
      (r) => r.status === 'pending' || r.status === 'in_progress',
    ).length

    return {
      pendingLiquidations,
      approvedLiquidations,
      validCerts,
      expiringCerts,
      expiredCerts,
      pendingPayments,
      totalCertificates: certificates.length,
    }
  }, [liquidations, certificates, requests])

  const recentLiquidations = liquidations.slice(0, 5)
  const loading = loadingLiq || loadingCerts || loadingPay

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Liquidaciones pendientes"
          value={loading ? '—' : String(stats.pendingLiquidations)}
          icon={Receipt}
          variant={stats.pendingLiquidations > 0 ? 'warning' : undefined}
          badgeLabel={stats.pendingLiquidations > 0 ? 'Pendientes' : undefined}
        />
        <MetricCard
          title="Certificados vigentes"
          value={loading ? '—' : String(stats.validCerts)}
          icon={FileCheck}
          variant="success"
          badgeLabel="Vigentes"
          subtext={`${stats.totalCertificates} total`}
        />
        <MetricCard
          title="Certificados por vencer"
          value={loading ? '—' : String(stats.expiringCerts + stats.expiredCerts)}
          icon={AlertTriangle}
          variant={stats.expiringCerts + stats.expiredCerts > 0 ? 'destructive' : undefined}
          badgeLabel={stats.expiringCerts + stats.expiredCerts > 0 ? 'Urgente' : undefined}
          subtext={stats.expiredCerts > 0 ? `${stats.expiredCerts} vencidos` : undefined}
        />
        {role === 'financiero' || role === 'admin' ? (
          <MetricCard
            title="Pagos pendientes"
            value={loading ? '—' : String(stats.pendingPayments)}
            icon={CreditCard}
            variant={stats.pendingPayments > 0 ? 'warning' : undefined}
            badgeLabel={stats.pendingPayments > 0 ? 'En cola' : undefined}
          />
        ) : (
          <MetricCard
            title="En aprobación/pago"
            value={loading ? '—' : String(stats.approvedLiquidations)}
            icon={Clock}
            subtext="Liquidaciones en proceso"
          />
        )}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Recent Liquidations */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Liquidaciones recientes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/liquidations')}
              style={{ color: 'var(--g-brand-3308)' }}
            >
              Ver todas →
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-12 w-full rounded" />
                ))}
              </div>
            ) : recentLiquidations.length === 0 ? (
              <p style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-body)' }}>
                No hay liquidaciones aún.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {recentLiquidations.map((liq) => {
                  const config = getStatusConfig(liq.status)
                  const corr = (liq as typeof liq & { correspondents?: { name: string } })
                    .correspondents
                  return (
                    <button
                      key={liq.id}
                      type="button"
                      className="flex items-center justify-between p-3 text-left transition-colors w-full"
                      style={{ borderRadius: 'var(--g-radius-sm)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--g-surface-muted)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                      onClick={() => navigate(`/liquidations/${liq.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--g-text-primary)' }}
                          >
                            {corr?.name ?? '—'}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                            {formatDate(liq.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={config.badgeVariant}>{config.label}</Badge>
                        <span
                          className="text-sm font-bold"
                          style={{ color: 'var(--g-brand-3308)' }}
                        >
                          {formatAmount(liq.amount, liq.currency)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificate Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas de certificados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="skeleton h-10 w-full rounded" />
                ))}
              </div>
            ) : stats.expiringCerts + stats.expiredCerts === 0 ? (
              <div className="text-center py-4">
                <FileCheck
                  className="h-8 w-8 mx-auto mb-2"
                  style={{ color: 'var(--status-success)', opacity: 0.6 }}
                />
                <p className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                  Todos los certificados están vigentes
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {stats.expiredCerts > 0 && (
                  <div
                    className="flex items-center gap-3 p-3"
                    style={{
                      backgroundColor: 'hsl(0, 84%, 60%, 0.08)',
                      borderRadius: 'var(--g-radius-sm)',
                    }}
                  >
                    <AlertTriangle
                      className="h-4 w-4 shrink-0"
                      style={{ color: 'var(--status-error)' }}
                    />
                    <p className="text-sm font-medium" style={{ color: 'var(--status-error)' }}>
                      {stats.expiredCerts} certificado{stats.expiredCerts > 1 ? 's' : ''} vencido
                      {stats.expiredCerts > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                {stats.expiringCerts > 0 && (
                  <div
                    className="flex items-center gap-3 p-3"
                    style={{
                      backgroundColor: 'hsl(45, 93%, 47%, 0.08)',
                      borderRadius: 'var(--g-radius-sm)',
                    }}
                  >
                    <Clock
                      className="h-4 w-4 shrink-0"
                      style={{ color: 'var(--status-warning)' }}
                    />
                    <p className="text-sm font-medium" style={{ color: 'var(--status-warning)' }}>
                      {stats.expiringCerts} próximo{stats.expiringCerts > 1 ? 's' : ''} a vencer
                    </p>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-1"
                  onClick={() => navigate('/certificates')}
                >
                  <Eye className="h-4 w-4" />
                  Ver certificados
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
  subtext,
  variant,
  badgeLabel,
}: {
  title: string
  value: string
  icon: React.ElementType
  subtext?: string
  variant?: 'success' | 'warning' | 'destructive'
  badgeLabel?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--g-text-secondary)' }}>
              {title}
            </p>
            <p
              className="mt-2 font-bold"
              style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
            >
              {value}
            </p>
            {subtext && (
              <p
                className="mt-1"
                style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}
              >
                {subtext}
              </p>
            )}
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center"
            style={{
              backgroundColor: 'var(--g-sec-100)',
              borderRadius: 'var(--g-radius-md)',
            }}
          >
            <Icon className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
          </div>
        </div>
        {variant && badgeLabel && (
          <div className="mt-3">
            <Badge variant={variant}>{badgeLabel}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
