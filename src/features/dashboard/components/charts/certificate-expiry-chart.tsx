import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import type { Certificate } from '@/types'
import { getCertificateStatus } from '@/lib/certificate-utils'
import { differenceInDays, parseISO } from 'date-fns'
import { FileCheck } from 'lucide-react'

interface CertificateExpiryChartProps {
  certificates: Certificate[]
}

export function CertificateExpiryChart({ certificates }: CertificateExpiryChartProps) {
  const chartData = useMemo(() => {
    const today = new Date()
    return certificates
      .map((cert) => {
        const info = getCertificateStatus(cert.expiry_date)
        if (info.status === 'valid' && info.daysRemaining > 90) return null
        const corr = (cert as Certificate & { correspondents?: { name: string } }).correspondents
        const days = differenceInDays(parseISO(cert.expiry_date), today)
        return {
          name: corr?.name ?? 'Sin corresponsal',
          days: Math.max(days, 0),
          color:
            days > 60
              ? 'var(--status-success)'
              : days > 30
                ? 'var(--status-warning)'
                : 'var(--status-error)',
        }
      })
      .filter(Boolean)
      .sort((a, b) => a!.days - b!.days)
      .slice(0, 8) as { name: string; days: number; color: string }[]
  }, [certificates])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificados por vencer</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title="Sin vencimientos próximos"
            description="Todos los certificados están vigentes por más de 90 días"
          />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--g-text-secondary)' }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--g-text-secondary)' }}
                width={75}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--g-surface-card)',
                  border: '1px solid var(--g-border-default)',
                  borderRadius: 'var(--g-radius-sm)',
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value} días`, 'Días restantes']}
              />
              <Bar dataKey="days" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
