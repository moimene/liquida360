import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InfoPanel } from '@/components/ui/info-panel'
import {
  Briefcase,
  ArrowLeftRight,
  BarChart3,
  FileSpreadsheet,
  Building2,
  Plug,
  ChevronRight,
  CircleDot,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

/* ── Integration Definitions ──────────────────────── */

interface IntegrationFeature {
  label: string
  description: string
}

interface IntegrationDef {
  id: string
  name: string
  category: 'crm' | 'erp'
  icon: React.ElementType
  shortDescription: string
  longDescription: string
  features: IntegrationFeature[]
  compatibleSystems: string[]
  status: 'available' | 'coming_soon'
}

const INTEGRATIONS: IntegrationDef[] = [
  {
    id: 'crm-expedientes',
    name: 'CRM de clientes',
    category: 'crm',
    icon: Briefcase,
    shortDescription: 'Enlace con expedientes de asuntos para imputar costes',
    longDescription:
      'Conecta LIQUIDA360 con el CRM del despacho para vincular cada liquidacion al expediente o asunto correspondiente. Permite la imputacion automatica de costes de corresponsalia al asunto del cliente, eliminando la reconciliacion manual.',
    features: [
      {
        label: 'Vinculacion de asuntos',
        description:
          'Asocia cada liquidacion a un expediente/asunto del CRM automaticamente por corresponsal y referencia.',
      },
      {
        label: 'Imputacion de costes',
        description:
          'Los importes liquidados se imputan directamente como coste del asunto en el CRM, con desglose por concepto.',
      },
      {
        label: 'Sincronizacion de clientes',
        description:
          'Mapea corresponsales de LIQUIDA360 con entidades del CRM (contactos, proveedores, colaboradores externos).',
      },
      {
        label: 'Trazabilidad completa',
        description:
          'Desde el expediente en el CRM se puede acceder al detalle de la liquidacion, factura y certificado asociados.',
      },
    ],
    compatibleSystems: ['Aderant', 'Elite 3E', 'Clio', 'PracticePanther', 'LegalSuite'],
    status: 'available',
  },
  {
    id: 'crm-rentabilidad',
    name: 'Rentabilidad por asunto/cliente',
    category: 'crm',
    icon: BarChart3,
    shortDescription: 'Analisis de rentabilidad integrando costes de corresponsalia',
    longDescription:
      'Complementa los informes de rentabilidad del CRM incorporando los costes reales de corresponsalia por asunto y cliente. Proporciona visibilidad sobre el impacto de estos pagos en el margen de cada expediente.',
    features: [
      {
        label: 'Dashboard de rentabilidad',
        description:
          'Panel con metricas de coste de corresponsalia vs. facturacion por asunto, con filtros por cliente, periodo y jurisdiccion.',
      },
      {
        label: 'Alertas de desviacion',
        description:
          'Notificaciones cuando el coste de corresponsalia supera un umbral configurable del presupuesto del asunto.',
      },
      {
        label: 'Exportacion de informes',
        description:
          'Genera informes PDF/Excel con desglose de costes de corresponsalia para reporting a socios y direccion.',
      },
      {
        label: 'Previsiones de gasto',
        description:
          'Proyeccion de gastos de corresponsalia basada en asuntos abiertos y patrones historicos.',
      },
    ],
    compatibleSystems: ['Aderant', 'Elite 3E', 'Clio', 'LegalSuite', 'Power BI'],
    status: 'available',
  },
  {
    id: 'erp-contabilidad',
    name: 'ERP / Contabilidad',
    category: 'erp',
    icon: Building2,
    shortDescription: 'Sincronizacion bidireccional con sistemas contables',
    longDescription:
      'Integra LIQUIDA360 con el ERP o sistema contable del despacho para automatizar el ciclo completo de pago: desde la solicitud de pago hasta el asiento contable, eliminando la doble entrada de datos y reduciendo errores.',
    features: [
      {
        label: 'Sincronizacion de pagos',
        description:
          'Las solicitudes de pago aprobadas se envian automaticamente al ERP como ordenes de pago con todos los datos fiscales.',
      },
      {
        label: 'Asientos contables automaticos',
        description:
          'Genera asientos de gasto, provision y pago en el plan contable del despacho, respetando centros de coste y dimensiones analiticas.',
      },
      {
        label: 'Reconciliacion bancaria',
        description:
          'Cruza los pagos ejecutados en el ERP con las liquidaciones de LIQUIDA360 para confirmar el estado de pago automaticamente.',
      },
      {
        label: 'Gestion fiscal integrada',
        description:
          'Valida retenciones, tipos de IVA y requisitos fiscales del pais del corresponsal contra el maestro fiscal del ERP.',
      },
    ],
    compatibleSystems: ['SAP Business One', 'SAP S/4HANA', 'Microsoft Dynamics 365', 'Sage', 'A3ERP', 'Navision'],
    status: 'available',
  },
]

/* ── Component ────────────────────────────────────── */

export function IntegrationsTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function handleRequestActivation(integration: IntegrationDef) {
    toast.info(`Solicitud de activacion enviada para "${integration.name}"`, {
      description:
        'Nuestro equipo tecnico se pondra en contacto contigo para configurar la integracion.',
    })
  }

  const crmIntegrations = INTEGRATIONS.filter((i) => i.category === 'crm')
  const erpIntegrations = INTEGRATIONS.filter((i) => i.category === 'erp')

  return (
    <div className="flex flex-col gap-6">
      <InfoPanel variant="info" dismissible dismissKey="settings-integrations">
        Las integraciones permiten conectar LIQUIDA360 con los sistemas del despacho para automatizar flujos de trabajo,
        eliminar doble entrada de datos y obtener visibilidad completa sobre los costes de corresponsalia.
      </InfoPanel>

      {/* CRM Section */}
      <IntegrationSection
        title="CRM de clientes"
        description="Vincula liquidaciones con expedientes del CRM para imputacion de costes y analisis de rentabilidad."
        icon={Briefcase}
        integrations={crmIntegrations}
        expandedId={expandedId}
        onToggle={setExpandedId}
        onRequestActivation={handleRequestActivation}
      />

      {/* ERP Section */}
      <IntegrationSection
        title="ERP / Contabilidad"
        description="Sincronizacion bidireccional con sistemas contables para automatizar pagos y asientos."
        icon={Building2}
        integrations={erpIntegrations}
        expandedId={expandedId}
        onToggle={setExpandedId}
        onRequestActivation={handleRequestActivation}
      />

      {/* Roadmap hint */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center"
              style={{
                backgroundColor: 'var(--g-sec-100)',
                borderRadius: 'var(--g-radius-md)',
              }}
            >
              <Plug className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            </div>
            <div className="flex-1">
              <p
                className="font-medium"
                style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-body)' }}
              >
                ¿Necesitas otra integracion?
              </p>
              <p
                className="mt-0.5"
                style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}
              >
                Contacta con nuestro equipo para evaluar integraciones personalizadas con otros sistemas del despacho.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info('Funcionalidad disponible proximamente', {
                  description: 'Se abrira un formulario de solicitud de integracion personalizada.',
                })
              }
            >
              Solicitar
              <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ── Integration Section ──────────────────────────── */

function IntegrationSection({
  title,
  description,
  icon: SectionIcon,
  integrations,
  expandedId,
  onToggle,
  onRequestActivation,
}: {
  title: string
  description: string
  icon: React.ElementType
  integrations: IntegrationDef[]
  expandedId: string | null
  onToggle: (id: string | null) => void
  onRequestActivation: (i: IntegrationDef) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <SectionIcon className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
        <div>
          <h3
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h4)', color: 'var(--g-text-primary)' }}
          >
            {title}
          </h3>
          <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
            {description}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            expanded={expandedId === integration.id}
            onToggle={() =>
              onToggle(expandedId === integration.id ? null : integration.id)
            }
            onRequestActivation={() => onRequestActivation(integration)}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Integration Card ─────────────────────────────── */

function IntegrationCard({
  integration,
  expanded,
  onToggle,
  onRequestActivation,
}: {
  integration: IntegrationDef
  expanded: boolean
  onToggle: () => void
  onRequestActivation: () => void
}) {
  const Icon = integration.icon

  return (
    <Card>
      {/* Header — always visible, clickable to expand */}
      <button
        type="button"
        className="w-full text-left"
        onClick={onToggle}
      >
        <CardHeader className="flex flex-row items-center gap-4 pb-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center"
            style={{
              backgroundColor: 'var(--g-sec-100)',
              borderRadius: 'var(--g-radius-md)',
            }}
          >
            <Icon className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{integration.name}</CardTitle>
              <Badge variant="secondary">
                {integration.status === 'available' ? 'Disponible' : 'Proximamente'}
              </Badge>
            </div>
            <p
              className="mt-0.5 truncate"
              style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}
            >
              {integration.shortDescription}
            </p>
          </div>
          <ChevronRight
            className="h-5 w-5 shrink-0 transition-transform"
            style={{
              color: 'var(--g-text-secondary)',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          />
        </CardHeader>
      </button>

      {/* Expanded content */}
      {expanded && (
        <CardContent className="pt-0">
          <div
            className="pt-4 flex flex-col gap-5"
            style={{ borderTop: '1px solid var(--g-border-default)' }}
          >
            {/* Description */}
            <p
              className="leading-relaxed"
              style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-body)' }}
            >
              {integration.longDescription}
            </p>

            {/* Features */}
            <div className="flex flex-col gap-3">
              <p
                className="font-medium text-xs uppercase tracking-wider"
                style={{ color: 'var(--g-text-secondary)' }}
              >
                Funcionalidades
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {integration.features.map((feature) => (
                  <div
                    key={feature.label}
                    className="flex gap-3 p-3"
                    style={{
                      backgroundColor: 'var(--g-surface-muted)',
                      borderRadius: 'var(--g-radius-md)',
                    }}
                  >
                    <CircleDot
                      className="h-4 w-4 shrink-0 mt-0.5"
                      style={{ color: 'var(--g-brand-3308)' }}
                    />
                    <div>
                      <p
                        className="font-medium text-sm"
                        style={{ color: 'var(--g-text-primary)' }}
                      >
                        {feature.label}
                      </p>
                      <p
                        className="mt-0.5 text-xs leading-relaxed"
                        style={{ color: 'var(--g-text-secondary)' }}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compatible systems */}
            <div className="flex flex-col gap-2">
              <p
                className="font-medium text-xs uppercase tracking-wider"
                style={{ color: 'var(--g-text-secondary)' }}
              >
                Sistemas compatibles
              </p>
              <div className="flex flex-wrap gap-2">
                {integration.compatibleSystems.map((sys) => (
                  <span
                    key={sys}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: 'var(--g-surface-muted)',
                      borderRadius: 'var(--g-radius-full)',
                      color: 'var(--g-text-primary)',
                      border: '1px solid var(--g-border-default)',
                    }}
                  >
                    <FileSpreadsheet className="h-3 w-3" style={{ color: 'var(--g-text-secondary)' }} />
                    {sys}
                  </span>
                ))}
              </div>
            </div>

            {/* Data flow diagram (mock) */}
            <div
              className="flex items-center justify-center gap-4 py-4 px-6"
              style={{
                backgroundColor: 'var(--g-surface-muted)',
                borderRadius: 'var(--g-radius-lg)',
                border: '1px dashed var(--g-border-default)',
              }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{
                  backgroundColor: 'var(--g-surface-card)',
                  borderRadius: 'var(--g-radius-md)',
                  border: '1px solid var(--g-border-default)',
                }}
              >
                <Plug className="h-4 w-4" style={{ color: 'var(--g-brand-3308)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--g-text-primary)' }}>
                  LIQUIDA360
                </span>
              </div>
              <ArrowLeftRight className="h-5 w-5" style={{ color: 'var(--g-text-secondary)' }} />
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{
                  backgroundColor: 'var(--g-surface-card)',
                  borderRadius: 'var(--g-radius-md)',
                  border: '1px solid var(--g-border-default)',
                }}
              >
                <Icon className="h-4 w-4" style={{ color: 'var(--g-brand-3308)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--g-text-primary)' }}>
                  {integration.name}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between pt-2">
              <p
                className="text-xs"
                style={{ color: 'var(--g-text-secondary)' }}
              >
                La activacion requiere configuracion tecnica con tu equipo IT.
              </p>
              <Button onClick={onRequestActivation}>
                Solicitar activacion
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
