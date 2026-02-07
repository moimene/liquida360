import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLiquidations } from '../hooks/use-liquidations'
import { getStatusConfig, formatAmount } from '@/lib/liquidation-utils'
import { formatDate } from '@/lib/certificate-utils'
import type { Correspondent } from '@/types'

interface CorrespondentLiquidationsTabProps {
  correspondent: Correspondent
}

export function CorrespondentLiquidationsTab({ correspondent }: CorrespondentLiquidationsTabProps) {
  const navigate = useNavigate()
  const { liquidations, loading, fetchByCorrespondent } = useLiquidations()

  useEffect(() => {
    fetchByCorrespondent(correspondent.id)
  }, [correspondent.id, fetchByCorrespondent])

  const stats = useMemo(() => {
    const total = liquidations.length
    const paid = liquidations.filter((l) => l.status === 'paid').length
    const pending = liquidations.filter(
      (l) =>
        l.status === 'draft' ||
        l.status === 'pending_approval' ||
        l.status === 'approved' ||
        l.status === 'payment_requested',
    ).length
    const totalAmount = liquidations
      .filter((l) => l.status !== 'rejected')
      .reduce((sum, l) => sum + l.amount, 0)
    const mainCurrency = liquidations.length > 0 ? liquidations[0].currency : 'EUR'

    return { total, paid, pending, totalAmount, mainCurrency }
  }, [liquidations])

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="skeleton h-20 w-full rounded" />
        <div className="skeleton h-48 w-full rounded" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={String(stats.total)} />
        <StatCard label="Pagadas" value={String(stats.paid)} />
        <StatCard label="En proceso" value={String(stats.pending)} />
        <StatCard
          label="Importe total"
          value={formatAmount(stats.totalAmount, stats.mainCurrency)}
          highlight
        />
      </div>

      {/* List */}
      {liquidations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p
              style={{
                color: 'var(--g-text-secondary)',
                fontSize: 'var(--g-text-body)',
              }}
            >
              No hay liquidaciones para este corresponsal
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de liquidaciones</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--g-border-default)',
                    }}
                  >
                    <th
                      className="px-4 py-3 text-left font-medium"
                      style={{
                        color: 'var(--g-text-secondary)',
                        fontSize: 'var(--g-text-small)',
                        backgroundColor: 'var(--g-surface-muted)',
                      }}
                    >
                      Fecha
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium"
                      style={{
                        color: 'var(--g-text-secondary)',
                        fontSize: 'var(--g-text-small)',
                        backgroundColor: 'var(--g-surface-muted)',
                      }}
                    >
                      Importe
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium"
                      style={{
                        color: 'var(--g-text-secondary)',
                        fontSize: 'var(--g-text-small)',
                        backgroundColor: 'var(--g-surface-muted)',
                      }}
                    >
                      Concepto
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium"
                      style={{
                        color: 'var(--g-text-secondary)',
                        fontSize: 'var(--g-text-small)',
                        backgroundColor: 'var(--g-surface-muted)',
                      }}
                    >
                      Estado
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium"
                      style={{
                        color: 'var(--g-text-secondary)',
                        fontSize: 'var(--g-text-small)',
                        backgroundColor: 'var(--g-surface-muted)',
                      }}
                    />
                  </tr>
                </thead>
                <tbody>
                  {liquidations.map((liq) => {
                    const config = getStatusConfig(liq.status)
                    return (
                      <tr
                        key={liq.id}
                        className="transition-colors cursor-pointer"
                        style={{
                          borderBottom: '1px solid var(--g-border-default)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--g-surface-muted)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        onClick={() => navigate(`/liquidations/${liq.id}`)}
                      >
                        <td className="px-4 py-3" style={{ color: 'var(--g-text-primary)' }}>
                          {formatDate(liq.created_at)}
                        </td>
                        <td
                          className="px-4 py-3 font-bold"
                          style={{ color: 'var(--g-brand-3308)' }}
                        >
                          {formatAmount(liq.amount, liq.currency)}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--g-text-primary)' }}>
                          <span className="truncate max-w-[200px] block" title={liq.concept}>
                            {liq.concept}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={config.badgeVariant}>{config.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/liquidations/${liq.id}`)
                            }}
                            aria-label="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ── Stat Card ───────────────────────────────────────── */

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className="p-4"
      style={{
        backgroundColor: 'var(--g-surface-card)',
        border: '1px solid var(--g-border-default)',
        borderRadius: 'var(--g-radius-lg)',
      }}
    >
      <p
        className="text-xs font-medium uppercase tracking-wider mb-1"
        style={{ color: 'var(--g-text-secondary)' }}
      >
        {label}
      </p>
      <p
        className="text-lg font-bold"
        style={{ color: highlight ? 'var(--g-brand-3308)' : 'var(--g-text-primary)' }}
      >
        {value}
      </p>
    </div>
  )
}
