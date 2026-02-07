import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { APP_NAME, CERTIFICATE_ALERT_DEFAULTS } from '@/lib/constants'
import { Shield, Clock, Banknote } from 'lucide-react'

interface InfoRowProps {
  icon: React.ElementType
  label: string
  value: string
  description?: string
}

function InfoRow({ icon: Icon, label, value, description }: InfoRowProps) {
  return (
    <div
      className="flex items-start gap-4 py-4"
      style={{ borderBottom: '1px solid var(--g-border-default)' }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center"
        style={{
          backgroundColor: 'var(--g-sec-100)',
          borderRadius: 'var(--g-radius-md)',
        }}
      >
        <Icon className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
      </div>
      <div className="flex-1">
        <p
          className="font-medium"
          style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-body)' }}
        >
          {label}
        </p>
        {description && (
          <p
            className="mt-0.5"
            style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}
          >
            {description}
          </p>
        )}
      </div>
      <span
        className="font-bold shrink-0"
        style={{ color: 'var(--g-brand-3308)', fontSize: 'var(--g-text-body)' }}
      >
        {value}
      </span>
    </div>
  )
}

export function GeneralTab() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h3
          className="font-bold"
          style={{ fontSize: 'var(--g-text-h4)', color: 'var(--g-text-primary)' }}
        >
          Informacion general
        </h3>
        <p className="mt-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
          Parametros globales de la plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plataforma</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col">
          <InfoRow
            icon={Shield}
            label="Nombre de la aplicacion"
            value={APP_NAME}
            description="Identificador de la plataforma"
          />
          <InfoRow
            icon={Banknote}
            label="Moneda por defecto"
            value="EUR"
            description="Moneda predeterminada para nuevas liquidaciones"
          />
          <InfoRow
            icon={Clock}
            label="Validez de certificados"
            value={`${CERTIFICATE_ALERT_DEFAULTS.DEFAULT_VALIDITY_YEARS} ano`}
            description="Periodo de validez por defecto al crear certificados"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automatizaciones</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col">
          <InfoRow
            icon={Clock}
            label="Verificacion de certificados"
            value="06:00 UTC"
            description="Ejecucion diaria de check-certificates via pg_cron"
          />
          <InfoRow
            icon={Clock}
            label="Generacion de notificaciones"
            value="06:15 UTC"
            description="Ejecucion diaria de generate-notifications via pg_cron"
          />
        </CardContent>
      </Card>
    </div>
  )
}
