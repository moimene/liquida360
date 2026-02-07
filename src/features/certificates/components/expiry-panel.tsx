import { useMemo } from 'react'
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InfoTip } from '@/components/ui/info-tip'
import type { Certificate } from '@/types'
import { getCertificateStatus, formatDate } from '@/lib/certificate-utils'
import { COUNTRIES } from '@/lib/countries'
import { CERTIFICATES_HELP } from '../constants/help-texts'

interface ExpiryPanelProps {
  certificates: Certificate[]
}

export function ExpiryPanel({ certificates }: ExpiryPanelProps) {
  const alerts = useMemo(() => {
    return certificates
      .map((cert) => ({
        cert,
        info: getCertificateStatus(cert.expiry_date),
      }))
      .filter(({ info }) => info.status !== 'valid' || info.daysRemaining <= 90)
      .sort((a, b) => a.info.daysRemaining - b.info.daysRemaining)
  }, [certificates])

  if (alerts.length === 0) return null

  const expired = alerts.filter((a) => a.info.status === 'expired')
  const expiringSoon = alerts.filter((a) => a.info.status === 'expiring_soon')

  return (
    <div className="flex flex-col gap-3">
      {/* Expired */}
      {expired.length > 0 && (
        <Card
          style={{
            borderLeft: '4px solid var(--status-error)',
          }}
        >
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <ShieldAlert
                className="h-5 w-5 mt-0.5 shrink-0"
                style={{ color: 'var(--status-error)' }}
              />
              <div className="flex-1">
                <p className="font-bold text-sm flex items-center gap-1" style={{ color: 'var(--g-text-primary)' }}>
                  {expired.length} certificado{expired.length !== 1 ? 's' : ''} vencido
                  {expired.length !== 1 ? 's' : ''}
                  <InfoTip content={CERTIFICATES_HELP.expiryThresholdTip} side="right" />
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {expired.map(({ cert }) => {
                    const corr = cert as Certificate & { correspondents?: { name: string } }
                    const country = COUNTRIES.find((c) => c.code === cert.issuing_country)
                    return (
                      <Badge key={cert.id} variant="destructive">
                        {corr.correspondents?.name ?? 'Sin nombre'} ·{' '}
                        {country?.name ?? cert.issuing_country} · {formatDate(cert.expiry_date)}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring soon */}
      {expiringSoon.length > 0 && (
        <Card
          style={{
            borderLeft: '4px solid var(--status-warning)',
          }}
        >
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="h-5 w-5 mt-0.5 shrink-0"
                style={{ color: 'var(--status-warning)' }}
              />
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: 'var(--g-text-primary)' }}>
                  {expiringSoon.length} certificado{expiringSoon.length !== 1 ? 's' : ''} próximo
                  {expiringSoon.length !== 1 ? 's' : ''} a vencer
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {expiringSoon.map(({ cert, info }) => {
                    const corr = cert as Certificate & { correspondents?: { name: string } }
                    return (
                      <Badge key={cert.id} variant="warning">
                        <Clock className="h-3 w-3 mr-1" />
                        {corr.correspondents?.name ?? 'Sin nombre'} · {info.daysRemaining} días
                      </Badge>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
