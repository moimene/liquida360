import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Liquidation } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--g-sec-300)',
  pending_approval: 'var(--status-warning)',
  approved: 'var(--g-brand-bright)',
  payment_requested: 'var(--g-brand-3308)',
  paid: 'var(--status-success)',
  rejected: 'var(--status-error)',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente',
  approved: 'Aceptada',
  payment_requested: 'Fecha de pago',
  paid: 'Pagada',
  rejected: 'Rechazada',
}

interface LiquidationStatusChartProps {
  liquidations: Liquidation[]
}

export function LiquidationStatusChart({ liquidations }: LiquidationStatusChartProps) {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const liq of liquidations) {
      counts[liq.status] = (counts[liq.status] ?? 0) + 1
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_LABELS[status] ?? status,
        value: count,
        color: STATUS_COLORS[status] ?? 'var(--g-sec-300)',
      }))
  }, [liquidations])

  if (chartData.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución por estado</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--g-surface-card)',
                border: '1px solid var(--g-border-default)',
                borderRadius: 'var(--g-radius-sm)',
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span style={{ color: 'var(--g-text-secondary)', fontSize: 12 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
