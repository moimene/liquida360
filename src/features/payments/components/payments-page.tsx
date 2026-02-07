import { useEffect, useMemo } from 'react'
import { Clock, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { InfoTip } from '@/components/ui/info-tip'
import { InfoPanel } from '@/components/ui/info-panel'
import { usePaymentRequests } from '../hooks/use-payment-requests'
import { usePaymentsRealtime } from '../hooks/use-payments-realtime'
import { PaymentsTable } from './payments-table'
import { PAYMENTS_HELP } from '../constants/help-texts'

export function PaymentsPage() {
  const { requests, loading, fetchRequests } = usePaymentRequests()

  // Realtime subscription for live updates
  usePaymentsRealtime()

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'pending').length
    const inProgress = requests.filter((r) => r.status === 'in_progress').length
    const paid = requests.filter((r) => r.status === 'paid').length
    const rejected = requests.filter((r) => r.status === 'rejected').length
    return { pending, inProgress, paid, rejected }
  }, [requests])

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2
          className="font-bold"
          style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
        >
          Cola de Pagos
        </h2>
        <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
          Gestiona las solicitudes de pago del departamento financiero
        </p>
      </div>

      <InfoPanel variant="info" dismissible dismissKey="payments-flow">{PAYMENTS_HELP.pageInfoPanel}</InfoPanel>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Pendientes"
          value={stats.pending}
          icon={Clock}
          color="var(--status-warning)"
          helpText={PAYMENTS_HELP.statPending}
        />
        <StatCard
          label="En proceso"
          value={stats.inProgress}
          icon={Loader2}
          color="var(--g-brand-3308)"
          helpText={PAYMENTS_HELP.statInProgress}
        />
        <StatCard
          label="Pagadas"
          value={stats.paid}
          icon={CheckCircle2}
          color="var(--status-success)"
          helpText={PAYMENTS_HELP.statPaid}
        />
        <StatCard
          label="Rechazadas"
          value={stats.rejected}
          icon={XCircle}
          color="var(--status-error)"
          helpText={PAYMENTS_HELP.statRejected}
        />
      </div>

      {/* Table */}
      <PaymentsTable data={requests} loading={loading} />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  helpText,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  helpText?: string
}) {
  return (
    <div
      className="flex items-center gap-4 p-4"
      style={{
        backgroundColor: 'var(--g-surface-card)',
        border: '1px solid var(--g-border-default)',
        borderRadius: 'var(--g-radius-lg)',
      }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center shrink-0"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          borderRadius: 'var(--g-radius-md)',
        }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--g-text-primary)' }}>
          {value}
        </p>
        <p
          className="text-xs font-medium uppercase tracking-wider flex items-center gap-1"
          style={{ color: 'var(--g-text-secondary)' }}
        >
          {label}{helpText && <InfoTip content={helpText} side="bottom" />}
        </p>
      </div>
    </div>
  )
}
