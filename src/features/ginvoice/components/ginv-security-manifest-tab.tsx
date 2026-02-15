import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Server,
  Globe,
  Lock,
  Database,
  Eye,
  FileText,
  Users,
  KeyRound,
  Workflow,
  Clock,
  Building2,
  Scale,
  Map,
  Cloud,
  ExternalLink,
  Receipt,
  Banknote,
  FileWarning,
} from 'lucide-react'

/* ─────────────── Types ─────────────── */

type ComplianceLevel = 'cumple' | 'parcial' | 'no_cumple' | 'no_aplica'

interface ControlRow {
  id: string
  control: string
  requirement: string
  current: ComplianceLevel
  detail: string
  action?: string
}

interface MigrationPhase {
  phase: string
  timeline: string
  items: string[]
  risk: 'bajo' | 'medio' | 'alto'
}

/* ─────────────── Helpers ─────────────── */

function ComplianceBadge({ level }: { level: ComplianceLevel }) {
  const config: Record<ComplianceLevel, { label: string; bg: string; fg: string; icon: React.ElementType }> = {
    cumple: { label: 'Cumple', bg: 'var(--g-status-success-bg)', fg: 'var(--g-status-success)', icon: CheckCircle2 },
    parcial: { label: 'Parcial', bg: 'var(--g-status-warning-bg)', fg: 'var(--g-status-warning)', icon: AlertTriangle },
    no_cumple: { label: 'No cumple', bg: 'var(--g-status-error-bg)', fg: 'var(--g-status-error)', icon: XCircle },
    no_aplica: { label: 'N/A', bg: 'var(--g-sec-100)', fg: 'var(--g-text-secondary)', icon: ArrowRight },
  }
  const c = config[level]
  const Icon = c.icon
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.fg, borderRadius: 'var(--g-radius-sm)' }}
    >
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  )
}

function RiskBadge({ risk }: { risk: 'bajo' | 'medio' | 'alto' | 'critico' }) {
  const config: Record<string, { label: string; bg: string; fg: string }> = {
    bajo: { label: 'Bajo', bg: 'var(--g-status-success-bg)', fg: 'var(--g-status-success)' },
    medio: { label: 'Medio', bg: 'var(--g-status-warning-bg)', fg: 'var(--g-status-warning)' },
    alto: { label: 'Alto', bg: 'var(--g-status-error-bg)', fg: 'var(--g-status-error)' },
    critico: { label: 'Critico', bg: 'var(--g-status-error-bg)', fg: 'var(--g-status-error)' },
  }
  const c = config[risk]
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
      style={{ backgroundColor: c.bg, color: c.fg, borderRadius: 'var(--g-radius-sm)' }}
    >
      {c.label}
    </span>
  )
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center mt-0.5"
        style={{ backgroundColor: 'var(--g-sec-100)', borderRadius: 'var(--g-radius-md)' }}
      >
        <Icon className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
      </div>
      <div>
        <h3 className="font-bold" style={{ fontSize: 'var(--g-text-h4)', color: 'var(--g-text-primary)' }}>
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-left" style={{ fontSize: 'var(--g-text-small)' }}>
        {children}
      </table>
    </div>
  )
}

function Th({ children, width }: { children: React.ReactNode; width?: string }) {
  return (
    <th
      className="px-3 py-2.5 font-medium whitespace-nowrap"
      style={{
        color: 'var(--g-text-secondary)',
        backgroundColor: 'var(--g-sec-100)',
        borderBottom: '2px solid var(--g-border-default)',
        width,
      }}
    >
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      className="px-3 py-3 align-top"
      style={{ color: 'var(--g-text-primary)', borderBottom: '1px solid var(--g-border-default)' }}
    >
      {children}
    </td>
  )
}

/* ─────────────── Data ─────────────── */

const MANIFEST_VERSION = '1.0'
const MANIFEST_DATE = '2026-02-15'
const APP_CLASSIFICATION = 'Herramienta de gestion interna (entorno corporativo)'
const DATA_CLASSIFICATION = 'Media-Alta sensibilidad (datos financieros operativos + datos de clientes del despacho)'

const providerComparison = [
  { provider: 'Garrigues', iso27001: true, soc2: false, ens: true, gdpr: true, jurisdiction: 'Espana / UE' },
  { provider: 'Vercel (Frontend)', iso27001: true, soc2: true, ens: false, gdpr: true, jurisdiction: 'EE.UU. (Edge global)' },
  { provider: 'Supabase (Backend)', iso27001: false, soc2: true, ens: false, gdpr: true, jurisdiction: 'Singapur / EE.UU. (AWS)' },
]

const dataInventory = [
  { category: 'Proveedores (vendors)', fields: 'Nombre, NIF, pais, estado compliance', sensitivity: 'Media', pii: 'Si (NIF, nombre comercial)', location: 'Supabase (PostgreSQL)' },
  { category: 'Documentos de compliance', fields: 'Certificados residencia fiscal, cartas de socios, fechas emision/expiracion', sensitivity: 'Media', pii: 'No', location: 'Supabase (DB + Storage)' },
  { category: 'Facturas de proveedores (intake)', fields: 'Importes, moneda, tipo cambio, numero factura, concepto, PDF factura', sensitivity: 'Alta', pii: 'No', location: 'Supabase (DB + Storage)' },
  { category: 'Asuntos / Clientes (jobs)', fields: 'Codigo asunto, codigo cliente, nombre cliente, estado UTTAI', sensitivity: 'Alta', pii: 'Si (datos identificativos de clientes del despacho)', location: 'Supabase (PostgreSQL)' },
  { category: 'Contabilizacion SAP', fields: 'Referencia SAP, payload JSON, fecha contabilizacion', sensitivity: 'Alta', pii: 'No', location: 'Supabase (PostgreSQL)' },
  { category: 'Facturas a cliente', fields: 'Numero factura SAP, fecha, PDF, estado emision, importe, cobros', sensitivity: 'Alta', pii: 'No', location: 'Supabase (DB + Storage)' },
  { category: 'Entregas y plataformas', fields: 'Destinatarios email, asunto, body, evidencia upload, SLA', sensitivity: 'Media', pii: 'Si (emails de contacto de clientes)', location: 'Supabase (PostgreSQL)' },
  { category: 'Reclamaciones de cobro', fields: 'Importes pendientes, destinatarios, notas aprobacion, estado claim', sensitivity: 'Alta', pii: 'Si (emails clientes, datos financieros)', location: 'Supabase (PostgreSQL)' },
  { category: 'Solicitudes UTTAI', fields: 'Estado bloqueo, notas, usuario solicitante/resolutor', sensitivity: 'Media', pii: 'Si (user_id)', location: 'Supabase (PostgreSQL)' },
  { category: 'Usuarios internos', fields: 'Email, rol ginv_*, metadatos auth', sensitivity: 'Media', pii: 'Si (email corporativo)', location: 'Supabase Auth' },
]

const isoControls: ControlRow[] = [
  { id: 'A.5.1', control: 'Politicas de seguridad', requirement: 'Politica documentada y aprobada', current: 'cumple', detail: 'Cubierto por SGSI Garrigues. G-Invoice hereda la politica corporativa y suma este manifiesto especifico.' },
  { id: 'A.5.2', control: 'Roles y responsabilidades', requirement: 'Asignacion clara de funciones', current: 'cumple', detail: '6 roles diferenciados con separacion de funciones (operador, BPO proveedores, BPO facturacion, socio aprobador, compliance UTTAI, admin). Principio de 4 ojos en claims.' },
  { id: 'A.5.7', control: 'Inteligencia de amenazas', requirement: 'Monitorizacion proactiva', current: 'parcial', detail: 'Supabase SOC 2 cubre monitorizacion basica. Sin threat intelligence dedicado para G-Invoice.', action: 'Incluir en revision trimestral del comite de seguridad. Evaluar Azure Defender en migracion.' },
  { id: 'A.5.10', control: 'Uso aceptable de activos', requirement: 'Normas de uso de la informacion', current: 'parcial', detail: 'G-Invoice maneja datos de clientes del despacho (codigos, nombres). Requiere politica explicita de uso.', action: 'Documentar normas de uso de datos de clientes en contexto G-Invoice. Restringir exportacion masiva.' },
  { id: 'A.5.12', control: 'Clasificacion de la informacion', requirement: 'Clasificacion formal de datos', current: 'cumple', detail: 'Inventario de datos clasificado en este manifiesto. Datos financieros + clientes = media-alta sensibilidad.' },
  { id: 'A.5.15', control: 'Control de acceso', requirement: 'Acceso basado en roles y minimo privilegio', current: 'cumple', detail: 'RBAC via JWT app_metadata.ginv_role + RLS en 11 tablas + feature flag is_ginvoice_enabled(). Aislamiento total del dominio LIQUIDA360.' },
  { id: 'A.5.17', control: 'Informacion de autenticacion', requirement: 'Gestion segura de credenciales', current: 'cumple', detail: 'Supabase Auth (GoTrue) con bcrypt. JWT con expiracion. Sin almacenamiento local de passwords.' },
  { id: 'A.5.19', control: 'Seguridad con proveedores', requirement: 'Evaluacion de proveedores criticos', current: 'parcial', detail: 'Supabase: SOC 2 Type II (sin ISO 27001). Vercel: ISO 27001 + SOC 2. GAP critico para datos media-alta.', action: 'URGENTE: Formalizar DPA con Supabase. Evaluar migracion acelerada a Azure para G-Invoice.' },
  { id: 'A.5.22', control: 'Supervision de proveedores', requirement: 'Revision periodica', current: 'parcial', detail: 'No existe procedimiento formal de revision periodica de proveedores cloud.', action: 'Establecer revision semestral de certificaciones para proveedores que manejen datos media-alta.' },
  { id: 'A.5.23', control: 'Seguridad en servicios cloud', requirement: 'Evaluacion de riesgos cloud', current: 'parcial', detail: 'Analisis de GAP heredado de LIQUIDA360. Riesgo elevado por datos de clientes en jurisdiccion US.', action: 'Implementar medidas compensatorias inmediatas. Priorizar G-Invoice en roadmap de migracion Azure.' },
  { id: 'A.5.24', control: 'Gestion de incidentes', requirement: 'Procedimiento de respuesta', current: 'parcial', detail: 'Supabase tiene respuesta a incidentes SOC 2. Sin procedimiento interno especifico para G-Invoice.', action: 'Crear procedimiento de respuesta a incidentes que cubra fuga de datos de clientes.' },
  { id: 'A.5.33', control: 'Proteccion de registros', requirement: 'Registros de auditoria protegidos', current: 'parcial', detail: 'Auditoria heredada de LIQUIDA360 (audit_log admin-only). G-Invoice requiere auditoria propia en tablas financieras.', action: 'Extender triggers de auditoria a ginv_intake_items, ginv_client_invoices, ginv_collection_claims.' },
  { id: 'A.5.34', control: 'Privacidad y PII', requirement: 'Cumplimiento RGPD', current: 'parcial', detail: 'Datos PII incluyen nombres/codigos de clientes del despacho y emails de contacto. Mayor sensibilidad que LIQUIDA360.', action: 'Evaluar necesidad de DPIA (Art. 35 RGPD) por tratamiento de datos de clientes del despacho.' },
  { id: 'A.8.1', control: 'Dispositivos de usuario', requirement: 'Proteccion endpoints', current: 'no_aplica', detail: 'App web SPA. No instala software en dispositivos. Proteccion de endpoints es responsabilidad corporativa Garrigues.' },
  { id: 'A.8.3', control: 'Restriccion de acceso', requirement: 'Control de acceso a informacion', current: 'cumple', detail: 'RLS en 11 tablas G-Invoice. Politicas granulares por rol. Trigger guard en collection_claims impide escalado. Principio de 4 ojos.' },
  { id: 'A.8.5', control: 'Autenticacion segura', requirement: 'Autenticacion robusta', current: 'parcial', detail: 'Email/password + JWT via Supabase Auth. Sin MFA. Para datos de clientes, MFA es necesario.', action: 'CRITICO: Implementar MFA para todos los roles G-Invoice antes de piloto interno.' },
  { id: 'A.8.9', control: 'Gestion de configuracion', requirement: 'Configuraciones controladas', current: 'cumple', detail: 'Env vars en .env (gitignored). Service Role Key solo en Edge Functions. Feature flag ginv_enabled por usuario.' },
  { id: 'A.8.10', control: 'Eliminacion de informacion', requirement: 'Borrado seguro', current: 'parcial', detail: 'CASCADE/RESTRICT en FK. Sin procedimiento formal de purgado. Datos financieros requieren retencion legal.', action: 'Definir politica de retencion alineada con obligaciones fiscales (5 anios min) y RGPD.' },
  { id: 'A.8.12', control: 'Prevencion de fuga de datos', requirement: 'DLP basico', current: 'parcial', detail: 'RLS previene acceso no autorizado. Sin DLP dedicado. Exportacion SAP (CSV/XLSX) podria ser vector de fuga.', action: 'Implementar logging de exportaciones SAP. Evaluar DLP para descargas masivas.' },
  { id: 'A.8.24', control: 'Uso de criptografia', requirement: 'Cifrado de datos', current: 'parcial', detail: 'TLS en transito (Supabase + Vercel). Cifrado en reposo (AWS). Sin E2EE aplicativo.', action: 'RECOMENDADO: E2EE para PDFs de facturas y datos de clientes antes de almacenamiento.' },
  { id: 'A.8.25', control: 'Ciclo de vida de desarrollo', requirement: 'Desarrollo seguro', current: 'cumple', detail: 'TypeScript strict, Zod validation, ESLint, no eval/dangerouslySetInnerHTML. Doble validacion client+server.' },
  { id: 'A.8.28', control: 'Codificacion segura', requirement: 'Practicas de secure coding', current: 'cumple', detail: 'Sin inyeccion SQL (Supabase client). XSS prevenido por React JSX. CSRF mitigado por JWT Bearer. JSONB sanitizado.' },
  { id: 'A.8.29', control: 'Testing de seguridad', requirement: 'Pruebas de seguridad', current: 'parcial', detail: 'E2E tests cubren flujos G-Invoice. Sin pentesting formal ni SAST/DAST.', action: 'CRITICO: Pentesting obligatorio antes de produccion, dada sensibilidad de datos.' },
]

const soc2Comparison = [
  { aspect: 'Enfoque', soc2: 'Controles de servicio (5 Trust Criteria)', iso: 'Sistema de Gestion completo (ISMS)', gap: 'medio' as const },
  { aspect: 'Alcance', soc2: 'Definido por el proveedor', iso: 'Toda la organizacion', gap: 'medio' as const },
  { aspect: 'Gobierno', soc2: 'Implicito en controles', iso: 'Explicito: contexto, liderazgo, planificacion', gap: 'alto' as const },
  { aspect: 'Gestion de riesgo', soc2: 'Evaluacion de riesgos del servicio', iso: 'Proceso formal PDCA de analisis y tratamiento', gap: 'alto' as const },
  { aspect: 'Controles', soc2: '5 categorias (Trust Criteria)', iso: '93 controles (Anexo A 2022)', gap: 'medio' as const },
  { aspect: 'Proteccion datos financieros', soc2: 'Procesamiento/integridad cubiertos', iso: 'Controles explicitos de clasificacion y DLP', gap: 'alto' as const },
  { aspect: 'Secreto profesional', soc2: 'No contemplado especificamente', iso: 'Integrable en clasificacion de activos (A.5.12)', gap: 'critico' as const },
  { aspect: 'Reconocimiento', soc2: 'Principalmente EE.UU.', iso: 'Global (especialmente Europa)', gap: 'alto' as const },
  { aspect: 'Frecuencia auditoria', soc2: 'Anual', iso: 'Anual (externa) + internas periodicas', gap: 'bajo' as const },
]

const riskMatrix = [
  { risk: 'Exposicion de datos de clientes del despacho (Cloud Act)', probability: 'Media', impact: 'Alto', level: 'alto' as const, mitigation: 'G-Invoice maneja codigos de asunto y nombres de clientes. Migracion a Azure Spain Central prioritaria. E2EE interim.' },
  { risk: 'Fuga de datos financieros via exportacion SAP', probability: 'Media', impact: 'Alto', level: 'alto' as const, mitigation: 'Logging de exportaciones. DLP en descargas. Restriccion de roles que pueden exportar.' },
  { risk: 'Brecha de seguridad en Supabase', probability: 'Muy baja', impact: 'Alto', level: 'medio' as const, mitigation: 'SOC 2 Type II vigente. Monitoreo continuo. DPA con notificacion 24h. Backup independiente.' },
  { risk: 'Acceso no autorizado a reclamaciones de cobro', probability: 'Baja', impact: 'Alto', level: 'medio' as const, mitigation: 'Trigger guard con principio de 4 ojos. RLS restrictiva. Separacion BPO/socio aprobador.' },
  { risk: 'Manipulacion de tipos de cambio (FX)', probability: 'Baja', impact: 'Medio', level: 'medio' as const, mitigation: 'Constraints DB (exchange_rate > 0, amount_eur >= 0). Auditoria de cambios en importes.' },
  { risk: 'No conformidad en auditoria ISO 27001 Garrigues', probability: 'Alta', impact: 'Alto', level: 'alto' as const, mitigation: 'Este manifiesto documenta GAPs. Datos de clientes elevan el riesgo respecto a LIQUIDA360.' },
  { risk: 'Perdida de datos por fallo de Supabase', probability: 'Muy baja', impact: 'Alto', level: 'medio' as const, mitigation: 'Backups automaticos de Supabase. Implementar backup independiente en EU.' },
  { risk: 'Incumplimiento de retencion fiscal (5 anios)', probability: 'Media', impact: 'Medio', level: 'medio' as const, mitigation: 'Definir politica de retencion. Impedir borrado de registros contabilizados.' },
  { risk: 'Transferencia internacional no conforme RGPD', probability: 'Alta', impact: 'Alto', level: 'alto' as const, mitigation: 'Datos de clientes en US requiere SCC + evaluacion TIA. Migracion Azure elimina este riesgo.' },
]

const migrationRoadmap: MigrationPhase[] = [
  {
    phase: 'Fase 0: Situacion actual (Demostrador)',
    timeline: 'Presente',
    risk: 'medio',
    items: [
      'Arquitectura Supabase (BaaS) + Vercel (Frontend) operativa',
      'Security review interna completada (heredada de LIQUIDA360)',
      'RLS en 11 tablas G-Invoice + trigger guard en collection_claims',
      '6 roles diferenciados con separacion de funciones',
      'Manifiesto de seguridad G-Invoice publicado (este documento)',
      'RIESGO: Datos de clientes del despacho en jurisdiccion US',
    ],
  },
  {
    phase: 'Fase 1: Medidas compensatorias inmediatas',
    timeline: '0-1 mes',
    risk: 'medio',
    items: [
      'Implementar MFA para todos los roles G-Invoice (Supabase Auth TOTP)',
      'Activar triggers de auditoria en tablas financieras G-Invoice',
      'Implementar logging de exportaciones SAP (CSV/XLSX)',
      'Formalizar DPA (Data Processing Agreement) con Supabase',
      'Configurar region EU (eu-central-1) para proyecto Supabase',
      'Realizar evaluacion TIA (Transfer Impact Assessment) para datos de clientes',
      'Activar rate limiting y CORS estricto en Supabase',
      'Documentar normas de uso de datos de clientes en G-Invoice',
    ],
  },
  {
    phase: 'Fase 2: Hardening para piloto interno',
    timeline: '1-3 meses',
    risk: 'medio',
    items: [
      'Implementar CSP (Content Security Policy) headers estrictos',
      'E2EE para PDFs de facturas y datos sensibles de clientes',
      'Pentesting formal por tercero independiente (scope: G-Invoice)',
      'Configurar SAST/DAST en pipeline CI/CD',
      'Crear procedimiento de gestion de incidentes especifico',
      'Realizar DPIA (Art. 35 RGPD) por tratamiento de datos de clientes',
      'Definir politica de retencion alineada con obligaciones fiscales',
      'Implementar DLP basico para exportaciones masivas',
    ],
  },
  {
    phase: 'Fase 3: Migracion a Microsoft Azure corporativo',
    timeline: '3-6 meses (PRIORITARIO para G-Invoice)',
    risk: 'alto',
    items: [
      'Migrar a entorno Azure de Garrigues (Spain Central):',
      '  - Azure Database for PostgreSQL (esquema G-Invoice + RLS intactos)',
      '  - Azure Static Web Apps (frontend React sin cambios)',
      '  - Azure Functions (~40 endpoints, patron CRUD + workflows)',
      '  - Azure Blob Storage (facturas PDF, certificados compliance)',
      'Integrar Microsoft Entra ID (SSO + MFA corporativo Garrigues)',
      'Mapeo de roles G-Invoice a grupos de seguridad Entra ID',
      'Adaptar RLS a contexto de sesion Entra ID (variables de sesion)',
      'Implementar Azure Key Vault para gestion de secretos',
      'Integrar Azure Monitor + Application Insights (SOC Garrigues)',
      'Pentesting + auditoria por equipo de seguridad Garrigues',
      'RESULTADO: Todos los GAPs eliminados. Conformidad plena ISO 27001 + ENS.',
    ],
  },
]

/* ─────────────── Component ─────────────── */

export function GInvSecurityManifestTab() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl pb-8">
      {/* ── Header ── */}
      <div
        className="p-6"
        style={{
          backgroundColor: 'var(--g-sec-100)',
          borderRadius: 'var(--g-radius-lg)',
          borderLeft: '4px solid var(--g-brand-3308)',
        }}
      >
        <div className="flex items-start gap-4">
          <Shield className="h-8 w-8 mt-0.5 shrink-0" style={{ color: 'var(--g-brand-3308)' }} />
          <div>
            <h2
              className="font-bold"
              style={{ fontSize: 'var(--g-text-h3)', color: 'var(--g-text-primary)' }}
            >
              Manifiesto de Seguridad - G-Invoice
            </h2>
            <p className="mt-1" style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
              Evaluacion de cumplimiento ISO 27001:2022 y SOC 2, analisis de riesgos y roadmap de migracion
              para el Comite de Seguridad de Garrigues. Dominio de facturacion digital.
            </p>
            <div className="flex flex-wrap gap-4 mt-3" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
              <span>Version: <strong style={{ color: 'var(--g-text-primary)' }}>{MANIFEST_VERSION}</strong></span>
              <span>Fecha: <strong style={{ color: 'var(--g-text-primary)' }}>{MANIFEST_DATE}</strong></span>
              <span>Clasificacion: <strong style={{ color: 'var(--g-text-primary)' }}>{APP_CLASSIFICATION}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 1. Resumen ejecutivo ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            1. Resumen ejecutivo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4" style={{ fontSize: 'var(--g-text-body)' }}>
          <p style={{ color: 'var(--g-text-primary)' }}>
            <strong>G-Invoice</strong> es el modulo de facturacion digital de la plataforma LIQUIDA360,
            que gestiona el ciclo completo de facturas de proveedores, contabilizacion SAP, emision
            de facturas a clientes, entregas por plataforma y reclamaciones de cobro.
            Opera como herramienta de gestion interna con datos de <strong>media-alta sensibilidad</strong>.
          </p>
          <div
            className="p-4"
            style={{
              backgroundColor: 'var(--g-status-error-bg)',
              borderRadius: 'var(--g-radius-md)',
              border: '1px solid var(--g-status-error)',
            }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--g-status-error)' }} />
              <div>
                <p className="font-medium" style={{ color: 'var(--g-text-primary)' }}>
                  Clasificacion: Media-Alta sensibilidad
                </p>
                <p className="mt-1" style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>
                  A diferencia de LIQUIDA360 (baja-media), G-Invoice SI procesa datos identificativos
                  de clientes del despacho (codigos de asunto, nombres de clientes), datos financieros
                  (importes de facturas, tipos de cambio, cobros) y datos de contacto de clientes
                  (emails de destinatarios de entregas y reclamaciones). Esto eleva significativamente
                  el perfil de riesgo y los requisitos de cumplimiento.
                </p>
              </div>
            </div>
          </div>

          {/* Key differences from LIQUIDA360 */}
          <SectionTitle
            icon={FileWarning}
            title="Diferencias clave respecto al manifiesto LIQUIDA360"
            subtitle="Factores que elevan el perfil de riesgo de G-Invoice"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: 'Datos de clientes del despacho', desc: 'Codigos de asunto, nombres de clientes, emails de contacto. LIQUIDA360 solo manejaba corresponsales (proveedores externos).', severity: 'alto' as const },
              { title: 'Datos financieros ampliados', desc: 'Importes multi-divisa, tipos de cambio, cobros, facturas SAP. Mayor volumen y complejidad que liquidaciones simples.', severity: 'alto' as const },
              { title: 'Integracion SAP', desc: 'Exportacion de datos contables (CSV/XLSX). Vector potencial de fuga de datos si no se controla.', severity: 'medio' as const },
              { title: 'Workflow de 4 ojos', desc: 'Claims de cobro requieren aprobacion de socio. Datos sensibles visibles en flujo de aprobacion.', severity: 'medio' as const },
            ].map((d) => (
              <div
                key={d.title}
                className="p-3 flex items-start gap-2"
                style={{
                  backgroundColor: d.severity === 'alto' ? 'var(--g-status-error-bg)' : 'var(--g-status-warning-bg)',
                  borderRadius: 'var(--g-radius-md)',
                }}
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: d.severity === 'alto' ? 'var(--g-status-error)' : 'var(--g-status-warning)' }} />
                <div>
                  <p className="font-medium" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-primary)' }}>{d.title}</p>
                  <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Arquitectura y proveedores ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            2. Arquitectura y certificaciones de proveedores
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            G-Invoice comparte la misma arquitectura de proveedores que LIQUIDA360.
            Sin embargo, la mayor sensibilidad de los datos eleva la criticidad de los GAPs identificados.
          </p>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Proveedor</Th>
                <Th>ISO 27001</Th>
                <Th>SOC 2</Th>
                <Th>ENS</Th>
                <Th>RGPD</Th>
                <Th>Jurisdiccion</Th>
              </tr>
            </thead>
            <tbody>
              {providerComparison.map((p) => (
                <tr key={p.provider}>
                  <Td>
                    <span className="font-medium">{p.provider}</span>
                  </Td>
                  <Td>{p.iso27001 ? <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--g-status-success)' }} /> : <XCircle className="h-4 w-4" style={{ color: 'var(--g-status-error)' }} />}</Td>
                  <Td>{p.soc2 ? <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--g-status-success)' }} /> : <span style={{ color: 'var(--g-text-secondary)' }}>-</span>}</Td>
                  <Td>{p.ens ? <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--g-status-success)' }} /> : <XCircle className="h-4 w-4" style={{ color: 'var(--g-text-secondary)' }} />}</Td>
                  <Td>{p.gdpr ? <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--g-status-success)' }} /> : <XCircle className="h-4 w-4" style={{ color: 'var(--g-status-error)' }} />}</Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{p.jurisdiction}</span></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
          <div
            className="p-4"
            style={{
              backgroundColor: 'var(--g-status-error-bg)',
              borderRadius: 'var(--g-radius-md)',
              border: '1px solid var(--g-status-error)',
            }}
          >
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--g-status-error)' }} />
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-primary)' }}>
                <strong>GAP CRITICO para G-Invoice:</strong> Supabase (backend) carece de certificacion ISO 27001
                y opera sobre infraestructura AWS (jurisdiccion EE.UU.). Al manejar datos de clientes del despacho
                y datos financieros, este GAP es de mayor criticidad que en LIQUIDA360.
                La migracion a Azure Spain Central es <strong>prioritaria</strong> para G-Invoice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Inventario de datos ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            3. Inventario y clasificacion de datos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Clasificacion de todos los datos gestionados por G-Invoice segun sensibilidad y tipo.
            G-Invoice gestiona 11 tablas propias y un bucket de almacenamiento privado.
          </p>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Categoria</Th>
                <Th>Campos</Th>
                <Th>Sensibilidad</Th>
                <Th>PII</Th>
                <Th>Ubicacion</Th>
              </tr>
            </thead>
            <tbody>
              {dataInventory.map((d) => (
                <tr key={d.category}>
                  <Td><span className="font-medium">{d.category}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{d.fields}</span></Td>
                  <Td><RiskBadge risk={d.sensitivity === 'Baja' ? 'bajo' : d.sensitivity === 'Media' ? 'medio' : 'alto'} /></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{d.pii}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{d.location}</span></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
          <div
            className="p-4"
            style={{
              backgroundColor: 'var(--g-status-warning-bg)',
              borderRadius: 'var(--g-radius-md)',
              border: '1px solid var(--g-status-warning)',
            }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--g-status-warning)' }} />
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-primary)' }}>
                <strong>Datos de clientes del despacho presentes:</strong> A diferencia de LIQUIDA360,
                G-Invoice SI almacena datos identificativos de clientes (ginv_jobs: client_code, client_name)
                y emails de contacto (ginv_deliveries, ginv_collection_claims). Aunque no incluye
                secreto profesional ni datos Art. 9 RGPD, la presencia de datos de clientes eleva
                la clasificacion a <strong>media-alta</strong> y puede requerir DPIA.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Controles de seguridad implementados ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            4. Controles de seguridad implementados
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* 4a. Autenticacion */}
          <SectionTitle
            icon={KeyRound}
            title="4.1 Autenticacion y gestion de identidad"
            subtitle="Basado en Supabase Auth (GoTrue) + feature flag ginv_enabled"
          />
          <TableWrapper>
            <thead>
              <tr>
                <Th>Control</Th>
                <Th>Estado</Th>
                <Th>Detalle</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { control: 'Autenticacion email/password', status: 'cumple' as ComplianceLevel, detail: 'Supabase Auth con bcrypt hashing' },
                { control: 'Tokens JWT con expiracion', status: 'cumple' as ComplianceLevel, detail: 'JWT firmado con app_metadata.ginv_role (inmutable por usuario)' },
                { control: 'Feature flag por usuario', status: 'cumple' as ComplianceLevel, detail: 'is_ginvoice_enabled() controla acceso al dominio. Desactivacion granular.' },
                { control: 'Aislamiento de dominio', status: 'cumple' as ComplianceLevel, detail: 'GInvoiceRoute separa completamente el workspace G-Invoice del dominio LIQUIDA360' },
                { control: 'Gestion de sesiones', status: 'cumple' as ComplianceLevel, detail: 'getSession() + onAuthStateChange para invalidacion en tiempo real' },
                { control: 'MFA (multifactor)', status: 'no_cumple' as ComplianceLevel, detail: 'No implementado. CRITICO para G-Invoice dada la sensibilidad de datos de clientes.' },
              ].map((row) => (
                <tr key={row.control}>
                  <Td><span className="font-medium">{row.control}</span></Td>
                  <Td><ComplianceBadge level={row.status} /></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.detail}</span></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>

          {/* 4b. Roles */}
          <SectionTitle
            icon={Users}
            title="4.2 Control de acceso basado en roles (RBAC)"
            subtitle="6 roles con separacion de funciones + principio de 4 ojos + RLS en 11 tablas"
          />
          <TableWrapper>
            <thead>
              <tr>
                <Th>Rol</Th>
                <Th>Alcance</Th>
                <Th>Restricciones clave</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { role: 'ginv_operador', scope: 'Crear intake items (facturas proveedor / tasas)', restriction: 'Solo ve y edita sus propios intake items. No accede a facturacion ni cobros.' },
                { role: 'ginv_bpo_proveedores', scope: 'Gestionar contabilizacion SAP, compliance vendors', restriction: 'Ve todos los intake items. Gestiona postings SAP. No puede facturar ni aprobar claims.' },
                { role: 'ginv_bpo_facturacion', scope: 'Billing, emision facturas, entregas, claims, plataformas', restriction: 'Crea claims pero NO puede aprobarlos (4 ojos). No puede contabilizar en SAP.' },
                { role: 'ginv_socio_aprobador', scope: 'Aprobar/rechazar facturas y claims de cobro', restriction: 'Solo puede aprobar/rechazar. No puede crear ni enviar claims.' },
                { role: 'ginv_compliance_uttai', scope: 'Gestion UTTAI y documentos compliance de vendors', restriction: 'Acceso a documentos y solicitudes UTTAI. Sin acceso a datos financieros de facturacion.' },
                { role: 'ginv_admin', scope: 'Acceso completo a G-Invoice', restriction: 'Unico rol que puede eliminar registros, gestionar usuarios y configurar el dominio.' },
              ].map((row) => (
                <tr key={row.role}>
                  <Td>
                    <span
                      className="font-mono font-medium px-2 py-0.5"
                      style={{
                        backgroundColor: 'var(--g-sec-100)',
                        borderRadius: 'var(--g-radius-sm)',
                        fontSize: 'var(--g-text-small)',
                      }}
                    >
                      {row.role}
                    </span>
                  </Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.scope}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.restriction}</span></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>

          {/* 4c. Workflows */}
          <SectionTitle
            icon={Workflow}
            title="4.3 Integridad de flujos de trabajo"
            subtitle="Maquinas de estado y triggers de base de datos"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="p-4"
              style={{ backgroundColor: 'var(--g-sec-100)', borderRadius: 'var(--g-radius-md)' }}
            >
              <p className="font-medium mb-2" style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-body)' }}>
                Flujo de intake (facturas proveedor)
              </p>
              <div className="flex flex-wrap items-center gap-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                {['draft', 'submitted', 'pending_approval', 'approved', 'sent_to_accounting', 'posted', 'ready_to_bill', 'billed'].map((s, i) => (
                  <span key={s}>
                    {i > 0 && <ArrowRight className="h-3 w-3 inline mr-1" />}
                    <span className="font-mono px-1.5 py-0.5 inline-block" style={{ backgroundColor: 'var(--g-bg-primary)', borderRadius: 'var(--g-radius-sm)' }}>{s}</span>
                  </span>
                ))}
              </div>
              <p className="mt-2" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                11 estados posibles. Maquina de estado definida en <code className="font-mono">intake-lifecycle.ts</code>.
                Incluye ramas: needs_info, rejected, archived.
              </p>
            </div>
            <div
              className="p-4"
              style={{ backgroundColor: 'var(--g-sec-100)', borderRadius: 'var(--g-radius-md)' }}
            >
              <p className="font-medium mb-2" style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-body)' }}>
                Flujo de reclamaciones de cobro (4 ojos)
              </p>
              <div className="flex flex-wrap items-center gap-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                {['pending_approval', 'approved', 'sent'].map((s, i) => (
                  <span key={s}>
                    {i > 0 && <ArrowRight className="h-3 w-3 inline mr-1" />}
                    <span className="font-mono px-1.5 py-0.5 inline-block" style={{ backgroundColor: 'var(--g-bg-primary)', borderRadius: 'var(--g-radius-sm)' }}>{s}</span>
                  </span>
                ))}
              </div>
              <p className="mt-2" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                Protegido por trigger <code className="font-mono">ginv_guard_collection_claim_transition</code>.
                BPO crea → Socio aprueba → BPO envia. Imposible saltar pasos.
              </p>
            </div>
          </div>

          <div
            className="p-4"
            style={{ backgroundColor: 'var(--g-sec-100)', borderRadius: 'var(--g-radius-md)' }}
          >
            <p className="font-medium mb-2" style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-body)' }}>
              Flujo de facturas a cliente
            </p>
            <div className="flex flex-wrap items-center gap-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
              {['invoice_draft', 'pending_partner_approval', 'ready_for_sap', 'issued', 'delivered'].map((s, i) => (
                <span key={s}>
                  {i > 0 && <ArrowRight className="h-3 w-3 inline mr-1" />}
                  <span className="font-mono px-1.5 py-0.5 inline-block" style={{ backgroundColor: 'var(--g-bg-primary)', borderRadius: 'var(--g-radius-sm)' }}>{s}</span>
                </span>
              ))}
            </div>
            <p className="mt-2" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
              Con ramas opcionales: platform_required → platform_completed.
              Emision de factura requiere aprobacion de socio si esta configurado.
            </p>
          </div>

          {/* 4d. Auditoria */}
          <SectionTitle
            icon={Eye}
            title="4.4 Trazabilidad y auditoria"
            subtitle="Campos de auditoria integrados + triggers de updated_at"
          />
          <TableWrapper>
            <thead>
              <tr>
                <Th>Tabla / Area</Th>
                <Th>Mecanismo</Th>
                <Th>Datos registrados</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { table: 'ginv_intake_items', mechanism: 'Campos created_by + updated_at trigger', data: 'Creador, timestamps, snapshots compliance/UTTAI', status: 'cumple' as ComplianceLevel },
                { table: 'ginv_sap_postings', mechanism: 'Campos posted_by, posted_at', data: 'Usuario que contabiliza + timestamp', status: 'cumple' as ComplianceLevel },
                { table: 'ginv_collection_claims', mechanism: 'Campos *_by + *_at por estado + trigger guard', data: 'Creador, aprobador, rechazador, enviador + timestamps', status: 'cumple' as ComplianceLevel },
                { table: 'ginv_deliveries', mechanism: 'Campos sent_by, sent_at', data: 'Usuario que envia + timestamp', status: 'cumple' as ComplianceLevel },
                { table: 'Tablas financieras (general)', mechanism: 'Sin trigger audit_log dedicado', data: 'Falta: old_data/new_data en tabla audit_log', status: 'parcial' as ComplianceLevel },
              ].map((row) => (
                <tr key={row.table}>
                  <Td><span className="font-mono font-medium">{row.table}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.mechanism}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.data}</span></Td>
                  <Td><ComplianceBadge level={row.status} /></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </CardContent>
      </Card>

      {/* ── 5. RLS y seguridad de base de datos ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            5. Row Level Security - Cobertura de tablas G-Invoice
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Todas las tablas G-Invoice tienen RLS habilitado con politicas granulares por rol.
            El acceso esta completamente aislado del dominio LIQUIDA360.
          </p>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Tabla</Th>
                <Th>RLS</Th>
                <Th>SELECT</Th>
                <Th>INSERT</Th>
                <Th>UPDATE</Th>
                <Th>DELETE</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { table: 'ginv_jobs', rls: true, select: 'Todos ginv_*', insert: 'ginv_admin', update: 'ginv_admin', delete: 'ginv_admin' },
                { table: 'ginv_vendors', rls: true, select: 'Todos ginv_*', insert: 'ginv_admin', update: 'ginv_admin', delete: 'ginv_admin' },
                { table: 'ginv_vendor_documents', rls: true, select: 'Todos ginv_*', insert: 'compliance + admin', update: 'compliance + admin', delete: 'compliance + admin' },
                { table: 'ginv_intake_items', rls: true, select: 'Propios + BPO + socio + admin', insert: 'operador + admin', update: 'Propios draft + BPO + socio', delete: '-' },
                { table: 'ginv_sap_postings', rls: true, select: 'Todos ginv_*', insert: 'BPO prov + admin', update: 'BPO prov + admin', delete: '-' },
                { table: 'ginv_billing_batches', rls: true, select: 'Todos ginv_*', insert: 'BPO fact + admin', update: 'BPO fact + admin', delete: '-' },
                { table: 'ginv_billing_batch_items', rls: true, select: 'Todos ginv_*', insert: 'BPO fact + admin', update: 'BPO fact + admin', delete: '-' },
                { table: 'ginv_client_invoices', rls: true, select: 'Todos ginv_*', insert: 'BPO fact + socio + admin', update: 'BPO fact + socio + admin', delete: '-' },
                { table: 'ginv_deliveries', rls: true, select: 'Todos ginv_*', insert: 'BPO fact + admin', update: 'BPO fact + admin', delete: '-' },
                { table: 'ginv_platform_tasks', rls: true, select: 'Todos ginv_*', insert: 'BPO fact + admin', update: 'BPO fact + admin', delete: '-' },
                { table: 'ginv_collection_claims', rls: true, select: 'Todos ginv_*', insert: 'BPO fact + admin', update: 'BPO fact / socio (por estado)', delete: '-' },
              ].map((row) => (
                <tr key={row.table}>
                  <Td><span className="font-mono font-medium" style={{ fontSize: 'var(--g-text-small)' }}>{row.table}</span></Td>
                  <Td>{row.rls ? <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--g-status-success)' }} /> : <XCircle className="h-4 w-4" style={{ color: 'var(--g-status-error)' }} />}</Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.select}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.insert}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.update}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.delete}</span></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
          <div
            className="p-4"
            style={{
              backgroundColor: 'var(--g-sec-100)',
              borderRadius: 'var(--g-radius-md)',
            }}
          >
            <p className="font-medium" style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-small)' }}>
              <strong>Almacenamiento:</strong> Bucket <code className="font-mono">ginv-documents</code> (privado).
              Upload restringido a usuarios con ginv_role. Eliminacion solo por ginv_admin.
              Signed URLs con vigencia configurable.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── 6. Controles financieros ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            6. Controles de integridad financiera
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Controles especificos de G-Invoice para proteger la integridad de datos financieros
            y prevenir manipulaciones.
          </p>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Control</Th>
                <Th>Nivel</Th>
                <Th>Detalle</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { control: 'Importe positivo obligatorio', level: 'DB', detail: 'CHECK (amount > 0) en ginv_intake_items', status: 'cumple' as ComplianceLevel },
                { control: 'Tipo de cambio positivo', level: 'DB', detail: 'CHECK (exchange_rate_to_eur > 0) - previene tasas negativas/cero', status: 'cumple' as ComplianceLevel },
                { control: 'Importe EUR no negativo', level: 'DB', detail: 'CHECK (amount_eur >= 0) - validacion post-conversion', status: 'cumple' as ComplianceLevel },
                { control: 'Importe adeudado no negativo', level: 'DB', detail: 'CHECK (amount_due_eur >= 0) en facturas cliente', status: 'cumple' as ComplianceLevel },
                { control: 'Importe cobrado no negativo', level: 'DB', detail: 'CHECK (amount_paid_eur >= 0) en facturas cliente', status: 'cumple' as ComplianceLevel },
                { control: 'Campos obligatorios por estado (claims)', level: 'DB', detail: '3 constraints: approved_fields, rejected_fields, sent_fields', status: 'cumple' as ComplianceLevel },
                { control: 'Trigger guard transiciones (claims)', level: 'DB', detail: 'ginv_guard_collection_claim_transition - valida rol + estado + campos', status: 'cumple' as ComplianceLevel },
                { control: 'FK RESTRICT en intake → jobs/vendors', level: 'DB', detail: 'ON DELETE RESTRICT impide borrado de master data con dependencias', status: 'cumple' as ComplianceLevel },
                { control: 'Snapshot compliance/UTTAI', level: 'App', detail: 'Se captura estado compliance y UTTAI en el momento del intake', status: 'cumple' as ComplianceLevel },
                { control: 'Validacion Zod (frontend)', level: 'App', detail: 'Schemas colocados con formularios para validacion pre-envio', status: 'cumple' as ComplianceLevel },
              ].map((row) => (
                <tr key={row.control}>
                  <Td><span className="font-medium" style={{ fontSize: 'var(--g-text-small)' }}>{row.control}</span></Td>
                  <Td>
                    <span
                      className="font-mono px-2 py-0.5 text-xs"
                      style={{ backgroundColor: 'var(--g-sec-100)', borderRadius: 'var(--g-radius-sm)' }}
                    >
                      {row.level}
                    </span>
                  </Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.detail}</span></Td>
                  <Td><ComplianceBadge level={row.status} /></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </CardContent>
      </Card>

      {/* ── 7. Cumplimiento ISO 27001 Anexo A ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            7. Cumplimiento ISO 27001:2022 - Controles Anexo A
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Evaluacion detallada de controles ISO 27001:2022 relevantes para G-Invoice.
            Nota: la mayor sensibilidad de datos implica criterios mas estrictos que en LIQUIDA360.
          </p>

          {/* Summary counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Cumple', count: isoControls.filter((c) => c.current === 'cumple').length, bg: 'var(--g-status-success-bg)', fg: 'var(--g-status-success)' },
              { label: 'Parcial', count: isoControls.filter((c) => c.current === 'parcial').length, bg: 'var(--g-status-warning-bg)', fg: 'var(--g-status-warning)' },
              { label: 'No cumple', count: isoControls.filter((c) => c.current === 'no_cumple').length, bg: 'var(--g-status-error-bg)', fg: 'var(--g-status-error)' },
              { label: 'N/A', count: isoControls.filter((c) => c.current === 'no_aplica').length, bg: 'var(--g-sec-100)', fg: 'var(--g-text-secondary)' },
            ].map((s) => (
              <div
                key={s.label}
                className="p-3 text-center"
                style={{ backgroundColor: s.bg, borderRadius: 'var(--g-radius-md)' }}
              >
                <p className="text-2xl font-bold" style={{ color: s.fg }}>{s.count}</p>
                <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          <TableWrapper>
            <thead>
              <tr>
                <Th width="80px">Control</Th>
                <Th>Nombre</Th>
                <Th width="100px">Estado</Th>
                <Th>Detalle de implementacion</Th>
                <Th>Accion requerida</Th>
              </tr>
            </thead>
            <tbody>
              {isoControls.map((row) => (
                <tr key={row.id}>
                  <Td><span className="font-mono font-medium" style={{ fontSize: 'var(--g-text-small)' }}>{row.id}</span></Td>
                  <Td><span className="font-medium" style={{ fontSize: 'var(--g-text-small)' }}>{row.control}</span></Td>
                  <Td><ComplianceBadge level={row.current} /></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.detail}</span></Td>
                  <Td>
                    {row.action ? (
                      <span style={{ fontSize: 'var(--g-text-small)', color: row.action.startsWith('CRITICO') || row.action.startsWith('URGENTE') ? 'var(--g-status-error)' : 'var(--g-status-warning)' }}>{row.action}</span>
                    ) : (
                      <span style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>-</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </CardContent>
      </Card>

      {/* ── 8. SOC 2 vs ISO 27001 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            8. Comparativa SOC 2 vs ISO 27001 (implicaciones para G-Invoice)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Supabase dispone de SOC 2 Type II pero no de ISO 27001.
            Para G-Invoice, los GAPs son mas criticos que para LIQUIDA360 por la presencia
            de datos financieros y datos de clientes.
          </p>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Aspecto</Th>
                <Th>SOC 2 Type II (Supabase)</Th>
                <Th>ISO 27001:2022 (Garrigues)</Th>
                <Th>GAP para G-Invoice</Th>
              </tr>
            </thead>
            <tbody>
              {soc2Comparison.map((row) => (
                <tr key={row.aspect}>
                  <Td><span className="font-medium">{row.aspect}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.soc2}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.iso}</span></Td>
                  <Td><RiskBadge risk={row.gap} /></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
          <div
            className="p-4"
            style={{
              backgroundColor: 'var(--g-status-error-bg)',
              borderRadius: 'var(--g-radius-md)',
              border: '1px solid var(--g-status-error)',
            }}
          >
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--g-status-error)' }} />
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-primary)' }}>
                <strong>GAP CRITICO - Secreto profesional:</strong> SOC 2 no contempla especificamente la proteccion
                de secreto profesional. Aunque G-Invoice no almacena el contenido de expedientes, los codigos
                de asunto y nombres de clientes podrian considerarse informacion protegida por el secreto profesional
                del abogado en determinadas interpretaciones. Se recomienda consulta con Asesoria Juridica interna.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 9. Matriz de riesgos ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            9. Matriz de riesgos especificos de G-Invoice
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Riesgos identificados considerando la clasificacion de {DATA_CLASSIFICATION}.
            Perfil de riesgo significativamente superior a LIQUIDA360.
          </p>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Riesgo</Th>
                <Th>Prob.</Th>
                <Th>Impacto</Th>
                <Th>Nivel</Th>
                <Th>Mitigacion</Th>
              </tr>
            </thead>
            <tbody>
              {riskMatrix.map((row) => (
                <tr key={row.risk}>
                  <Td><span className="font-medium" style={{ fontSize: 'var(--g-text-small)' }}>{row.risk}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.probability}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.impact}</span></Td>
                  <Td><RiskBadge risk={row.level} /></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.mitigation}</span></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>

          {/* Risk summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Riesgos altos', count: riskMatrix.filter((r) => r.level === 'alto').length, bg: 'var(--g-status-error-bg)', fg: 'var(--g-status-error)' },
              { label: 'Riesgos medios', count: riskMatrix.filter((r) => r.level === 'medio').length, bg: 'var(--g-status-warning-bg)', fg: 'var(--g-status-warning)' },
              { label: 'Riesgos bajos', count: riskMatrix.filter((r) => r.level === 'bajo').length, bg: 'var(--g-status-success-bg)', fg: 'var(--g-status-success)' },
            ].map((s) => (
              <div
                key={s.label}
                className="p-3 text-center"
                style={{ backgroundColor: s.bg, borderRadius: 'var(--g-radius-md)' }}
              >
                <p className="text-2xl font-bold" style={{ color: s.fg }}>{s.count}</p>
                <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 10. Escenarios de decision ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            10. Escenarios de decision para el comite
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Escenario A */}
            <div
              className="p-4 flex flex-col gap-3"
              style={{
                backgroundColor: 'var(--g-status-warning-bg)',
                borderRadius: 'var(--g-radius-md)',
                border: '1px solid var(--g-status-warning)',
              }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" style={{ color: 'var(--g-status-warning)' }} />
                <span className="font-bold" style={{ color: 'var(--g-text-primary)' }}>Escenario A: Condicionado</span>
              </div>
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                <strong>Uso como demostrador</strong> con medidas compensatorias inmediatas:
                MFA, auditoria extendida, DPA, region EU, TIA.
              </p>
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                Requiere: Fase 1 completa + compromiso firme de migracion Azure.
              </p>
              <span
                className="mt-auto self-start px-2 py-1 text-xs font-bold"
                style={{ backgroundColor: 'var(--g-status-warning)', color: 'white', borderRadius: 'var(--g-radius-sm)' }}
              >
                VIABLE CON CONDICIONES
              </span>
            </div>

            {/* Escenario B */}
            <div
              className="p-4 flex flex-col gap-3"
              style={{
                backgroundColor: 'var(--g-status-success-bg)',
                borderRadius: 'var(--g-radius-md)',
                border: '1px solid var(--g-status-success)',
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--g-status-success)' }} />
                <span className="font-bold" style={{ color: 'var(--g-text-primary)' }}>Escenario B: Recomendado</span>
              </div>
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                <strong>Migracion acelerada a Azure</strong> (Spain Central).
                Resuelve definitivamente todos los GAPs de compliance.
              </p>
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                Requiere: 3-6 meses + equipo 1-2 devs con AI-assisted dev.
              </p>
              <span
                className="mt-auto self-start px-2 py-1 text-xs font-bold"
                style={{ backgroundColor: 'var(--g-status-success)', color: 'white', borderRadius: 'var(--g-radius-sm)' }}
              >
                RECOMENDADO PARA G-INVOICE
              </span>
            </div>

            {/* Escenario C */}
            <div
              className="p-4 flex flex-col gap-3"
              style={{
                backgroundColor: 'var(--g-status-error-bg)',
                borderRadius: 'var(--g-radius-md)',
                border: '1px solid var(--g-status-error)',
              }}
            >
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5" style={{ color: 'var(--g-status-error)' }} />
                <span className="font-bold" style={{ color: 'var(--g-text-primary)' }}>Escenario C: No recomendado</span>
              </div>
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                <strong>Uso en produccion sin migracion</strong> con datos reales de clientes
                en infraestructura US sin ISO 27001.
              </p>
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                Riesgo: no conformidad ISO 27001 + posible incumplimiento RGPD.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 11. Roadmap de migracion ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            11. Roadmap de migracion hacia conformidad plena
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Plan progresivo con timeline acelerado respecto a LIQUIDA360, dado el mayor perfil de riesgo.
            G-Invoice es candidato prioritario para la migracion a Azure.
          </p>
          {migrationRoadmap.map((phase, idx) => (
            <div
              key={idx}
              className="flex gap-4"
            >
              {/* Timeline indicator */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="flex h-10 w-10 items-center justify-center font-bold text-sm"
                  style={{
                    backgroundColor: idx === 0 ? 'var(--g-brand-3308)' : 'var(--g-sec-100)',
                    color: idx === 0 ? 'white' : 'var(--g-text-primary)',
                    borderRadius: '50%',
                  }}
                >
                  {idx}
                </div>
                {idx < migrationRoadmap.length - 1 && (
                  <div className="w-0.5 flex-1 mt-2" style={{ backgroundColor: 'var(--g-border-default)' }} />
                )}
              </div>
              {/* Content */}
              <div
                className="flex-1 p-4 mb-2"
                style={{
                  backgroundColor: 'var(--g-sec-100)',
                  borderRadius: 'var(--g-radius-md)',
                  border: idx === 0 ? '2px solid var(--g-brand-3308)' : '1px solid var(--g-border-default)',
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-bold" style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-body)' }}>
                    {phase.phase}
                  </h4>
                  <RiskBadge risk={phase.risk} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-3.5 w-3.5" style={{ color: 'var(--g-text-secondary)' }} />
                  <span style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                    {phase.timeline}
                  </span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {phase.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2"
                      style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-primary)' }}
                    >
                      {item.startsWith('  -') ? (
                        <span className="ml-6">{item.trim()}</span>
                      ) : (
                        <>
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.startsWith('RIESGO') || item.startsWith('RESULTADO') ? 'var(--g-status-error)' : 'var(--g-brand-3308)' }} />
                          {item.startsWith('RIESGO') ? (
                            <span style={{ color: 'var(--g-status-error)', fontWeight: 600 }}>{item}</span>
                          ) : item.startsWith('RESULTADO') ? (
                            <span style={{ color: 'var(--g-status-success)', fontWeight: 600 }}>{item}</span>
                          ) : (
                            item
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── 12. Azure migration specifics ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            12. Migracion a Azure - Especificaciones G-Invoice
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            G-Invoice comparte la estrategia de migracion de LIQUIDA360 pero con alcance ampliado:
            mas tablas, mas Azure Functions y requisitos de seguridad mas estrictos.
          </p>

          <SectionTitle
            icon={Receipt}
            title="Alcance G-Invoice sobre base LIQUIDA360"
            subtitle="Incremento de complejidad respecto a la migracion base"
          />
          <TableWrapper>
            <thead>
              <tr>
                <Th>Componente</Th>
                <Th>LIQUIDA360 (base)</Th>
                <Th>G-Invoice (incremento)</Th>
                <Th>Esfuerzo adicional</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { component: 'Tablas PostgreSQL', base: '6 tablas + RLS', ginv: '+11 tablas + RLS + trigger guard', effort: 'medio' as const },
                { component: 'Azure Functions', base: '~25-30 endpoints', ginv: '+15-20 endpoints (total ~40-50)', effort: 'alto' as const },
                { component: 'Roles Entra ID', base: '5 grupos de seguridad', ginv: '+6 grupos (total 11)', effort: 'bajo' as const },
                { component: 'Blob Storage', base: '1 bucket (documents)', ginv: '+1 bucket (ginv-documents)', effort: 'bajo' as const },
                { component: 'Workflows / Triggers', base: '2 status triggers', ginv: '+1 guard trigger + intake lifecycle', effort: 'medio' as const },
                { component: 'Exportacion SAP', base: 'N/A', ginv: 'CSV/XLSX export + deep links + DLP logging', effort: 'medio' as const },
              ].map((row) => (
                <tr key={row.component}>
                  <Td><span className="font-medium">{row.component}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.base}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.ginv}</span></Td>
                  <Td><RiskBadge risk={row.effort} /></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>

          {/* Roles mapping */}
          <SectionTitle
            icon={Users}
            title="Mapeo de roles G-Invoice a grupos Entra ID"
            subtitle="Grupos de seguridad propuestos para la migracion"
          />
          <div
            className="p-4 font-mono text-sm"
            style={{
              backgroundColor: 'var(--g-sec-100)',
              borderRadius: 'var(--g-radius-md)',
              color: 'var(--g-text-primary)',
            }}
          >
            <pre className="whitespace-pre-wrap">
{`Grupo Entra ID                         → Rol aplicacion
──────────────────────────────────────   ───────────────────────
SG-GINVOICE-Operadores                 → ginv_operador
SG-GINVOICE-BPO-Proveedores           → ginv_bpo_proveedores
SG-GINVOICE-BPO-Facturacion           → ginv_bpo_facturacion
SG-GINVOICE-Socios-Aprobadores        → ginv_socio_aprobador
SG-GINVOICE-Compliance-UTTAI          → ginv_compliance_uttai
SG-GINVOICE-Admins                    → ginv_admin`}
            </pre>
          </div>

          {/* Timeline */}
          <SectionTitle
            icon={Clock}
            title="Estimacion de esfuerzo incremental"
            subtitle="Sobre la base de la migracion LIQUIDA360"
          />
          <TableWrapper>
            <thead>
              <tr>
                <Th>Fase</Th>
                <Th>Solo LIQUIDA360</Th>
                <Th>LIQUIDA360 + G-Invoice</Th>
                <Th>Incremento</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { phase: 'Infraestructura Azure', l360: '3-5 dias', both: '4-6 dias', delta: '+1 dia (bucket, roles)' },
                { phase: 'Datos y frontend', l360: '1-2 sem', both: '1.5-2.5 sem', delta: '+0.5 sem (mas tablas)' },
                { phase: 'API Backend', l360: '2-3 sem', both: '3-4.5 sem', delta: '+1-1.5 sem (~15 functions)' },
                { phase: 'Validacion', l360: '1-2 sem', both: '1.5-2.5 sem', delta: '+0.5 sem (mas E2E flows)' },
              ].map((row) => (
                <tr key={row.phase}>
                  <Td><span className="font-medium" style={{ fontSize: 'var(--g-text-small)' }}>{row.phase}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.l360}</span></Td>
                  <Td><span className="font-medium" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-status-success)' }}>{row.both}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.delta}</span></Td>
                </tr>
              ))}
              <tr>
                <Td><span className="font-bold">TOTAL (AI-assisted)</span></Td>
                <Td><span className="font-bold" style={{ fontSize: 'var(--g-text-small)' }}>5-8 sem / 1-2 devs</span></Td>
                <Td><span className="font-bold" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-status-success)' }}>7-10 sem / 1-2 devs</span></Td>
                <Td><span className="font-bold" style={{ fontSize: 'var(--g-text-small)' }}>+2 semanas</span></Td>
              </tr>
            </tbody>
          </TableWrapper>

          <div
            className="p-4"
            style={{
              backgroundColor: 'var(--g-sec-100)',
              borderRadius: 'var(--g-radius-md)',
              borderLeft: '4px solid var(--g-brand-3308)',
            }}
          >
            <p className="font-medium" style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-primary)' }}>
              Estrategia recomendada: migracion conjunta
            </p>
            <p className="mt-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
              Migrar LIQUIDA360 y G-Invoice juntos en un unico proyecto. El incremento marginal
              de G-Invoice (+2 semanas) es significativamente menor que una migracion independiente
              (que requeriria 5-8 semanas propias). El 80% de la infraestructura Azure es compartida.
            </p>
          </div>

          {/* Link al documento base */}
          <a
            href="https://github.com/moimene/liquida360/blob/main/docs/azure-migration-roadmap.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 transition-colors"
            style={{
              backgroundColor: 'var(--g-bg-primary)',
              borderRadius: 'var(--g-radius-md)',
              border: '2px solid var(--g-brand-3308)',
              color: 'var(--g-brand-3308)',
              textDecoration: 'none',
            }}
          >
            <ExternalLink className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold" style={{ fontSize: 'var(--g-text-body)' }}>
                Documento base: Plan de Migracion a Microsoft Azure (LIQUIDA360)
              </p>
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                Mapeo componente a componente, codigo de referencia, estimaciones de coste y plan de fases.
                G-Invoice hereda y extiende este plan.
              </p>
            </div>
          </a>
        </CardContent>
      </Card>

      {/* ── 13. Conclusion y firma ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            13. Conclusion y declaracion
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div
            className="p-4"
            style={{
              backgroundColor: 'var(--g-sec-100)',
              borderRadius: 'var(--g-radius-md)',
              borderLeft: '4px solid var(--g-brand-3308)',
            }}
          >
            <p className="font-medium" style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-primary)' }}>
              G-Invoice presenta un <strong>perfil de riesgo superior a LIQUIDA360</strong> debido
              a la presencia de datos de clientes del despacho y datos financieros ampliados:
            </p>
            <ul className="mt-3 flex flex-col gap-2" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-primary)' }}>
              <li className="flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--g-status-error)' }} />
                <span>
                  <strong>Clasificacion media-alta</strong> (vs. baja-media de LIQUIDA360).
                  Datos de clientes + datos financieros elevan requisitos.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--g-status-success)' }} />
                <span>
                  <strong>Controles de aplicacion robustos:</strong> 6 roles, 11 tablas con RLS,
                  trigger guard con 4 ojos, 10 controles de integridad financiera.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--g-status-warning)' }} />
                <span>
                  <strong>GAPs criticos:</strong> Ausencia de MFA, datos en jurisdiccion US sin ISO 27001,
                  falta de auditoria completa en tablas financieras.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Cloud className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--g-brand-3308)' }} />
                <span>
                  <strong>Recomendacion principal:</strong> Migracion conjunta a Azure Spain Central
                  como candidato prioritario. El incremento marginal sobre LIQUIDA360 es de solo +2 semanas.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--g-brand-3308)' }} />
                <span>
                  <strong>Uso como demostrador:</strong> Viable con medidas compensatorias inmediatas (Fase 1)
                  y compromiso firme de migracion. No recomendado para produccion sin Azure.
                </span>
              </li>
            </ul>
          </div>

          <div
            className="p-4"
            style={{
              backgroundColor: 'var(--g-bg-primary)',
              borderRadius: 'var(--g-radius-md)',
              border: '1px solid var(--g-border-default)',
            }}
          >
            <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
              <strong>Manifiesto de Seguridad G-Invoice v{MANIFEST_VERSION}</strong> | Generado: {MANIFEST_DATE} |
              Aplicacion: G-Invoice (dominio LIQUIDA360) | Clasificacion: {APP_CLASSIFICATION} |
              Datos: {DATA_CLASSIFICATION} |
              Proxima revision: Mensual o ante cambios de alcance
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
