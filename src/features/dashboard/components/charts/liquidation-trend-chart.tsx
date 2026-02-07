import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Liquidation } from '@/types'
import { format, parseISO, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

interface LiquidationTrendChartProps {
  liquidations: Liquidation[]
}

export function LiquidationTrendChart({ liquidations }: LiquidationTrendChartProps) {
  const chartData = useMemo(() => {
    const grouped = new Map<string, { total: number; count: number }>()

    for (const liq of liquidations) {
      const monthKey = format(startOfMonth(parseISO(liq.created_at)), 'yyyy-MM')
      const existing = grouped.get(monthKey) ?? { total: 0, count: 0 }
      grouped.set(monthKey, {
        total: existing.total + liq.amount,
        count: existing.count + 1,
      })
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, val]) => ({
        month: format(parseISO(`${key}-01`), 'MMM yy', { locale: es }),
        total: Math.round(val.total),
        count: val.count,
      }))
  }, [liquidations])

  if (chartData.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia de liquidaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--g-border-default)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--g-text-secondary)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--g-text-secondary)' }} width={60} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--g-surface-card)',
                border: '1px solid var(--g-border-default)',
                borderRadius: 'var(--g-radius-sm)',
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value.toLocaleString('es-ES')} EUR`, 'Importe']}
            />
            <Bar dataKey="total" fill="var(--g-brand-3308)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
