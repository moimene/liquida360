import { useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { useGInvDashboard } from '../hooks/use-ginv-dashboard'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, AlertTriangle, FileWarning, ShieldAlert, Clock3, Send, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function GInvoiceDashboardPage() {
  const { ginvRole } = useAuth()
  const { loading, error, metrics, alerts, queue, events, refresh } = useGInvDashboard()

  useEffect(() => {
    refresh()
  }, [refresh])

  const cards = metrics
    ? [
        { label: 'Ingesta pendientes', value: metrics.intakeSubmitted + metrics.intakePendingApproval, color: 'var(--status-warning)' },
        { label: 'UTTAI bloqueados', value: metrics.intakeUttaiBlocked, color: 'var(--status-error)' },
        { label: 'Compliance rojo', value: metrics.intakeComplianceIssues, color: 'var(--status-error)' },
        { label: 'En contab.', value: metrics.accountingInQueue, color: 'var(--status-info)' },
        { label: 'Listos para facturar', value: metrics.readyToBill, color: 'var(--g-brand-3308)' },
        { label: 'Facturas listas SAP', value: metrics.invoicesReady, color: 'var(--status-info)' },
        { label: 'Emitidas hoy', value: metrics.invoicesIssuedToday, color: 'var(--status-success)' },
        { label: 'Entregas pendientes', value: metrics.deliveriesPending, color: 'var(--status-warning)' },
        { label: 'Plataformas vencidas', value: metrics.platformsOverdue, color: 'var(--status-error)' },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="font-bold"
          style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
        >
          G-Invoice Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <div
          className="p-4"
          style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', borderRadius: 'var(--g-radius-md)' }}
        >
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="p-4"
            style={{
              backgroundColor: 'var(--g-surface-card)',
              borderRadius: 'var(--g-radius-lg)',
              border: '1px solid var(--g-border-default)',
            }}
          >
            <div className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>{card.label}</div>
            <div className="text-3xl font-bold mt-1" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Work queue */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: 'var(--g-text-primary)' }}>Work queue</h2>
            <span className="text-xs" style={{ color: 'var(--g-text-tertiary)' }}>Rol: {ginvRole ?? '—'}</span>
          </div>
          <div
            style={{
              backgroundColor: 'var(--g-surface-card)',
              borderRadius: 'var(--g-radius-lg)',
              border: '1px solid var(--g-border-default)',
              overflow: 'hidden',
            }}
          >
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--g-brand-3308)' }} />
              </div>
            ) : queue.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: 'var(--g-text-tertiary)' }}>
                No hay tareas pendientes
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                    <th className="text-left px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>Tipo</th>
                    <th className="text-left px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>Detalle</th>
                    <th className="text-left px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>Estado</th>
                    <th className="text-left px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>Creado</th>
                    <th className="text-right px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--g-text-primary)' }}>{item.type}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>{item.label}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-0.5 text-xs font-medium"
                          style={{
                            color: 'var(--g-text-primary)',
                            backgroundColor: 'var(--g-surface-hover)',
                            borderRadius: 'var(--g-radius-full)',
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-tertiary)' }}>
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={item.actionPath}
                          className="text-sm font-medium"
                          style={{ color: 'var(--g-brand-3308)' }}
                        >
                          Ir
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-3">
          <h2 className="font-semibold" style={{ color: 'var(--g-text-primary)' }}>Alertas</h2>
          <div
            className="space-y-2"
            style={{
              backgroundColor: 'var(--g-surface-card)',
              borderRadius: 'var(--g-radius-lg)',
              border: '1px solid var(--g-border-default)',
              padding: '12px',
            }}
          >
            {alerts.length === 0 ? (
              <div className="text-sm" style={{ color: 'var(--g-text-tertiary)' }}>Sin alertas</div>
            ) : (
              alerts.map((a, idx) => {
                const Icon = a.type === 'uttai' ? ShieldAlert : a.type === 'compliance' ? FileWarning : a.type === 'platform' ? Clock3 : a.type === 'delivery' ? Send : AlertTriangle
                return (
                  <div key={idx} className="flex items-start gap-2">
                    <Icon className="h-4 w-4" style={{ color: 'var(--status-warning)' }} />
                    <div>
                      <div className="text-sm" style={{ color: 'var(--g-text-primary)' }}>{a.title}</div>
                      {a.detail && <div className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>{a.detail}</div>}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Timeline */}
          <h2 className="font-semibold" style={{ color: 'var(--g-text-primary)' }}>Últimos eventos</h2>
          <div
            style={{
              backgroundColor: 'var(--g-surface-card)',
              borderRadius: 'var(--g-radius-lg)',
              border: '1px solid var(--g-border-default)',
              padding: '12px',
            }}
          >
            {events.length === 0 ? (
              <div className="text-sm" style={{ color: 'var(--g-text-tertiary)' }}>Sin actividad reciente</div>
            ) : (
              <ul className="space-y-2">
                {events.map((e) => (
                  <li key={e.id} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--g-brand-3308)' }} />
                    <div>
                      <div className="text-sm" style={{ color: 'var(--g-text-primary)' }}>
                        {e.table_name} — {e.action}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--g-text-tertiary)' }}>
                        {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: es })}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
