import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt, FileCheck, AlertTriangle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InfoTip } from '@/components/ui/info-tip'
import { InfoPanel } from '@/components/ui/info-panel'
import { useAuth } from '@/features/auth'
import { PORTAL_HELP } from '../constants/help-texts'
import { usePortalCorrespondent } from '../hooks/use-portal-correspondent'
import { usePortalLiquidations } from '../hooks/use-portal-liquidations'
import { usePortalCertificates } from '../hooks/use-portal-certificates'
import { getStatusConfig, formatAmount } from '@/lib/liquidation-utils'
import { formatDate, getCertificateStatus } from '@/lib/certificate-utils'

export function PortalDashboardPage() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const { correspondent, fetchCorrespondent } = usePortalCorrespondent()
  const { liquidations, fetchLiquidations } = usePortalLiquidations()
  const { certificates, fetchCertificates } = usePortalCertificates()

  useEffect(() => {
    if (user?.id) {
      fetchCorrespondent(user.id)
    }
  }, [user?.id, fetchCorrespondent])

  useEffect(() => {
    if (correspondent?.id) {
      fetchLiquidations(correspondent.id)
      fetchCertificates(correspondent.id)
    }
  }, [correspondent?.id, fetchLiquidations, fetchCertificates])

  const stats = useMemo(() => {
    const drafts = liquidations.filter((l) => l.status === 'draft').length
    const pending = liquidations.filter(
      (l) => l.status === 'pending_approval' || l.status === 'approved' || l.status === 'payment_requested',
    ).length
    const paid = liquidations.filter((l) => l.status === 'paid').length

    const validCerts = certificates.filter((c) => getCertificateStatus(c.expiry_date).status === 'valid').length
    const expiringCerts = certificates.filter((c) => {
      const s = getCertificateStatus(c.expiry_date).status
      return s === 'expiring_soon' || s === 'expired'
    }).length

    return { drafts, pending, paid, validCerts, expiringCerts, totalCerts: certificates.length }
  }, [liquidations, certificates])

  const recentLiquidations = useMemo(
    () => liquidations.slice(0, 5),
    [liquidations],
  )

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1
          className="font-bold"
          style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
        >
          Bienvenido, {correspondent?.name ?? 'Corresponsal'}
        </h1>
        <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
          Panel de control de tu portal de corresponsal
        </p>
      </div>

      <InfoPanel variant="tip" dismissible dismissKey="portal-welcome" className="mb-2">
        {PORTAL_HELP.dashboardWelcome}
      </InfoPanel>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Receipt}
          label="Subidas"
          value={stats.drafts}
          color="var(--g-text-secondary)"
          helpTip={PORTAL_HELP.kpiBorradores}
        />
        <KPICard
          icon={Clock}
          label="Aceptadas / pendientes"
          value={stats.pending}
          color="var(--status-alert)"
          helpTip={PORTAL_HELP.kpiEnProceso}
        />
        <KPICard
          icon={Receipt}
          label="Pagadas"
          value={stats.paid}
          color="var(--g-brand-3308)"
          helpTip={PORTAL_HELP.kpiPagadas}
        />
        <KPICard
          icon={FileCheck}
          label="Certificados vigentes"
          value={`${stats.validCerts}/${stats.totalCerts}`}
          color={stats.expiringCerts > 0 ? 'var(--status-error)' : 'var(--g-brand-3308)'}
          helpTip={PORTAL_HELP.kpiCertificados}
        />
      </div>

      {/* Certificate alert */}
      {stats.expiringCerts > 0 && (
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: 'var(--status-alert)' }} />
            <p className="text-sm" style={{ color: 'var(--g-text-primary)' }}>
              Tienes <strong>{stats.expiringCerts}</strong> certificado(s) vencido(s) o proximo(s) a
              vencer.{' '}
              <button
                onClick={() => navigate('/portal/certificates')}
                className="font-medium underline"
                style={{ color: 'var(--g-brand-3308)' }}
              >
                Ver certificados
              </button>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Facturas recientes</span>
            <button
              onClick={() => navigate('/portal/invoices')}
              className="text-sm font-medium"
              style={{ color: 'var(--g-brand-3308)' }}
            >
              Ver todas
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLiquidations.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--g-text-secondary)' }}>
              No tienes facturas todavia.{' '}
              <button
                onClick={() => navigate('/portal/invoices')}
                className="font-medium underline"
                style={{ color: 'var(--g-brand-3308)' }}
              >
                Crea tu primera factura
              </button>
            </p>
          ) : (
            <div className="flex flex-col divide-y" style={{ borderColor: 'var(--g-border-default)' }}>
              {recentLiquidations.map((l) => {
                const config = getStatusConfig(l.status)
                return (
                  <button
                    key={l.id}
                    onClick={() => navigate(`/portal/invoices/${l.id}`)}
                    className="flex items-center justify-between py-3 text-left w-full transition-colors"
                    style={{ borderColor: 'var(--g-border-default)' }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {l.concept}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                        {formatDate(l.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-sm font-bold"
                        style={{ color: 'var(--g-brand-3308)' }}
                      >
                        {formatAmount(l.amount, l.currency)}
                      </span>
                      <Badge variant={config.badgeVariant}>{config.label}</Badge>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KPICard({
  icon: Icon,
  label,
  value,
  color,
  helpTip,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  helpTip?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div
          className="flex h-10 w-10 items-center justify-center shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
            borderRadius: 'var(--g-radius-md)',
          }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: 'var(--g-text-primary)' }}>
            {value}
          </p>
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--g-text-secondary)' }}>
            {label}
            {helpTip && <InfoTip content={helpTip} side="bottom" />}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
