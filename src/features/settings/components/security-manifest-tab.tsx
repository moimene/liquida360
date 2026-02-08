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

const MANIFEST_VERSION = '2.0'
const MANIFEST_DATE = '2026-02-08'
const APP_CLASSIFICATION = 'Demostrador / Prototipo funcional'
const DATA_CLASSIFICATION = 'Baja-Media sensibilidad (datos operativos internos)'

const providerComparison = [
  { provider: 'Garrigues', iso27001: true, soc2: false, ens: true, gdpr: true, jurisdiction: 'Espana / UE' },
  { provider: 'Vercel (Frontend)', iso27001: true, soc2: true, ens: false, gdpr: true, jurisdiction: 'EE.UU. (Edge global)' },
  { provider: 'Supabase (Backend)', iso27001: false, soc2: true, ens: false, gdpr: true, jurisdiction: 'Singapur / EE.UU. (AWS)' },
]

const dataInventory = [
  { category: 'Corresponsales', fields: 'Nombre, pais, NIF, direccion, email, telefono', sensitivity: 'Baja', pii: 'Si (contacto profesional)', location: 'Supabase (PostgreSQL)' },
  { category: 'Certificados fiscales', fields: 'Pais emisor, fechas, estado, documento PDF', sensitivity: 'Media', pii: 'No', location: 'Supabase (DB + Storage)' },
  { category: 'Liquidaciones', fields: 'Importes, moneda, concepto, referencia, estado', sensitivity: 'Media', pii: 'No', location: 'Supabase (PostgreSQL)' },
  { category: 'Solicitudes de pago', fields: 'Estado, notas, justificante', sensitivity: 'Media', pii: 'No', location: 'Supabase (PostgreSQL)' },
  { category: 'Usuarios internos', fields: 'Email, rol, metadatos auth', sensitivity: 'Media', pii: 'Si (email corporativo)', location: 'Supabase Auth' },
  { category: 'Log de auditoria', fields: 'Accion, datos previos/nuevos, usuario, timestamp', sensitivity: 'Baja', pii: 'Si (user_id)', location: 'Supabase (PostgreSQL)' },
  { category: 'Notificaciones', fields: 'Tipo, titulo, mensaje, estado lectura', sensitivity: 'Baja', pii: 'No', location: 'Supabase (PostgreSQL)' },
]

const isoControls: ControlRow[] = [
  { id: 'A.5.1', control: 'Politicas de seguridad', requirement: 'Politica documentada y aprobada', current: 'cumple', detail: 'Cubierto por SGSI Garrigues. La app hereda la politica corporativa.' },
  { id: 'A.5.2', control: 'Roles y responsabilidades', requirement: 'Asignacion clara de funciones', current: 'cumple', detail: '5 roles definidos (pagador, supervisor, financiero, admin, corresponsal) con separacion de funciones.' },
  { id: 'A.5.7', control: 'Inteligencia de amenazas', requirement: 'Monitorizacion proactiva', current: 'parcial', detail: 'Supabase SOC 2 cubre monitorizacion basica. No hay threat intelligence dedicado para la app.', action: 'Incluir en revision trimestral del comite de seguridad.' },
  { id: 'A.5.15', control: 'Control de acceso', requirement: 'Acceso basado en roles y minimo privilegio', current: 'cumple', detail: 'RBAC via JWT app_metadata.role + RLS en todas las tablas. Fallback a rol minimo (pagador).' },
  { id: 'A.5.17', control: 'Informacion de autenticacion', requirement: 'Gestion segura de credenciales', current: 'cumple', detail: 'Supabase Auth (GoTrue) gestiona passwords con bcrypt. JWT con expiracion. Sin almacenamiento local de passwords.' },
  { id: 'A.5.19', control: 'Seguridad con proveedores', requirement: 'Evaluacion de proveedores criticos', current: 'parcial', detail: 'Supabase: SOC 2 Type II (sin ISO 27001). Vercel: ISO 27001 + SOC 2.', action: 'Formalizar DPA con Supabase. Solicitar informe SOC 2 bajo NDA.' },
  { id: 'A.5.22', control: 'Supervision de proveedores', requirement: 'Revision periodica', current: 'parcial', detail: 'No existe procedimiento formal de revision periodica de proveedores cloud.', action: 'Establecer revision anual de certificaciones y terminos.' },
  { id: 'A.5.23', control: 'Seguridad en servicios cloud', requirement: 'Evaluacion de riesgos cloud', current: 'parcial', detail: 'Analisis de GAP realizado. Faltan controles compensatorios completos.', action: 'Implementar medidas compensatorias del roadmap.' },
  { id: 'A.5.24', control: 'Gestion de incidentes', requirement: 'Procedimiento de respuesta', current: 'parcial', detail: 'Supabase tiene respuesta a incidentes SOC 2. No hay procedimiento interno para esta app.', action: 'Crear procedimiento de respuesta a incidentes especifico.' },
  { id: 'A.5.33', control: 'Proteccion de registros', requirement: 'Registros de auditoria protegidos', current: 'cumple', detail: 'Tabla audit_log con RLS admin-only. Triggers automaticos en tablas criticas (liquidations, payment_requests).' },
  { id: 'A.5.34', control: 'Privacidad y PII', requirement: 'Cumplimiento RGPD', current: 'cumple', detail: 'Datos PII minimos (emails corporativos, NIF profesional). Sin datos especiales Art. 9 RGPD. Sin secreto profesional.' },
  { id: 'A.8.1', control: 'Dispositivos de usuario', requirement: 'Proteccion endpoints', current: 'no_aplica', detail: 'App web SPA. No instala software en dispositivos. Proteccion de endpoints es responsabilidad corporativa Garrigues.' },
  { id: 'A.8.3', control: 'Restriccion de acceso', requirement: 'Control de acceso a informacion', current: 'cumple', detail: 'RLS en 7 tablas. Politicas granulares por rol. Status transition triggers impiden escalado de privilegios.' },
  { id: 'A.8.5', control: 'Autenticacion segura', requirement: 'Autenticacion robusta', current: 'cumple', detail: 'Email/password + JWT via Supabase Auth. Sesiones con expiracion. onAuthStateChange para invalidacion.' },
  { id: 'A.8.9', control: 'Gestion de configuracion', requirement: 'Configuraciones controladas', current: 'cumple', detail: 'Env vars en .env (gitignored). Service Role Key solo en Edge Functions. Anon Key publico protegido por RLS.' },
  { id: 'A.8.10', control: 'Eliminacion de informacion', requirement: 'Borrado seguro', current: 'parcial', detail: 'CASCADE/RESTRICT en FK. No existe procedimiento formal de purgado de datos en Supabase.', action: 'Definir politica de retencion y eliminacion.' },
  { id: 'A.8.12', control: 'Prevencion de fuga de datos', requirement: 'DLP basico', current: 'parcial', detail: 'RLS previene acceso no autorizado. No hay DLP dedicado para detectar exfiltracion.', action: 'Evaluar necesidad de DLP segun evolucion del alcance.' },
  { id: 'A.8.24', control: 'Uso de criptografia', requirement: 'Cifrado de datos', current: 'parcial', detail: 'TLS en transito (Supabase + Vercel). Cifrado en reposo (AWS). Sin E2EE aplicativo.', action: 'Considerar E2EE si se elevan los datos a sensibilidad alta.' },
  { id: 'A.8.25', control: 'Ciclo de vida de desarrollo', requirement: 'Desarrollo seguro', current: 'cumple', detail: 'TypeScript strict, Zod validation, ESLint, no eval/dangerouslySetInnerHTML. Doble validacion client+server.' },
  { id: 'A.8.28', control: 'Codificacion segura', requirement: 'Practicas de secure coding', current: 'cumple', detail: 'Sin inyeccion SQL (Supabase client). XSS prevenido por React JSX. CSRF mitigado por JWT Bearer token.' },
  { id: 'A.8.29', control: 'Testing de seguridad', requirement: 'Pruebas de seguridad', current: 'parcial', detail: '146 tests E2E + 120 unit tests. No hay pentesting formal ni SAST/DAST.', action: 'Realizar pentesting antes de pasar a produccion.' },
]

const riskMatrix = [
  { risk: 'Acceso por autoridades US (Cloud Act)', probability: 'Baja', impact: 'Medio', level: 'medio' as const, mitigation: 'Datos de baja sensibilidad. Sin secreto profesional. E2EE si escala.' },
  { risk: 'Brecha de seguridad en Supabase', probability: 'Muy baja', impact: 'Medio', level: 'bajo' as const, mitigation: 'SOC 2 Type II vigente. Monitoreo continuo. DPA con notificacion 24h.' },
  { risk: 'No conformidad en auditoria ISO 27001 Garrigues', probability: 'Media', impact: 'Medio', level: 'medio' as const, mitigation: 'Este manifiesto documenta GAPs y medidas compensatorias.' },
  { risk: 'Rechazo por cliente que exige ISO 27001 en backend', probability: 'Baja', impact: 'Bajo', level: 'bajo' as const, mitigation: 'Aplicacion interna, no expuesta a clientes finales del despacho.' },
  { risk: 'Perdida de datos por fallo de Supabase', probability: 'Muy baja', impact: 'Medio', level: 'bajo' as const, mitigation: 'Backups automaticos de Supabase. Implementar backup independiente.' },
  { risk: 'Transferencia internacional no conforme RGPD', probability: 'Media', impact: 'Medio', level: 'medio' as const, mitigation: 'Data Privacy Framework UE-EE.UU. vigente. SCC si necesario.' },
]

const migrationRoadmap: MigrationPhase[] = [
  {
    phase: 'Fase 0: Situacion actual (Demostrador)',
    timeline: 'Presente',
    risk: 'bajo',
    items: [
      'Arquitectura Supabase (BaaS) + Vercel (Frontend) operativa',
      'Security review interna completada y aprobada',
      'RLS, RBAC, audit log, status triggers implementados',
      'Manifiesto de seguridad publicado (este documento)',
      'Clasificacion de datos: baja-media sensibilidad',
    ],
  },
  {
    phase: 'Fase 1: Consolidacion del prototipo',
    timeline: '0-3 meses',
    risk: 'bajo',
    items: [
      'Obtener informe SOC 2 Type II de Supabase bajo NDA',
      'Realizar mapeo formal SOC 2 ↔ Anexo A ISO 27001',
      'Formalizar DPA (Data Processing Agreement) con Supabase',
      'Configurar region EU (eu-central-1) para proyecto Supabase',
      'Implementar backup independiente en infraestructura europea',
      'Documentar analisis de riesgos especifico en el SGSI',
      'Activar rate limiting y CORS estricto en Supabase',
    ],
  },
  {
    phase: 'Fase 2: Hardening para piloto interno',
    timeline: '3-6 meses',
    risk: 'medio',
    items: [
      'Implementar CSP (Content Security Policy) headers estrictos',
      'Añadir MFA (autenticacion multifactor) para roles admin y financiero',
      'Pentesting formal por tercero independiente',
      'Configurar SAST/DAST en pipeline CI/CD',
      'Establecer procedimiento de gestion de incidentes',
      'Formalizar procedimiento de revision anual de proveedores cloud',
      'Definir politica de retencion y eliminacion de datos',
      'Formar a equipo de desarrollo en Privacy by Design',
    ],
  },
  {
    phase: 'Fase 3: Migracion a Microsoft Azure corporativo',
    timeline: '6-12 meses (si se confirma utilidad)',
    risk: 'alto',
    items: [
      'Migrar a entorno Azure de Garrigues (Spain Central):',
      '  - Azure Database for PostgreSQL Flexible Server (esquema + RLS intactos)',
      '  - Azure Static Web Apps (frontend React sin cambios)',
      '  - Azure Functions (API REST reemplazando PostgREST)',
      '  - Azure Blob Storage (certificados PDF)',
      'Integrar Microsoft Entra ID (SSO + MFA corporativo Garrigues)',
      'Adaptar RLS a contexto de sesion Entra ID (variables de sesion)',
      'Implementar Azure Key Vault para gestion de secretos',
      'Implementar E2EE si el alcance incluye datos sensibles',
      'Pentesting + auditoria por equipo de seguridad Garrigues',
      'Nota: iManage no interviene (app de gestion interna, no documental)',
    ],
  },
]

/* ─────────────── Component ─────────────── */

export function SecurityManifestTab() {
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
              Manifiesto de Seguridad - LIQUIDA360
            </h2>
            <p className="mt-1" style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
              Declaracion de cumplimiento, analisis de GAPs y roadmap de migracion para los comites de seguridad de Garrigues.
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
            <strong>LIQUIDA360</strong> es un demostrador funcional para la gestion de pagos a corresponsales,
            certificados de residencia fiscal y solicitudes al departamento financiero. Opera como herramienta
            de gestion interna con datos de <strong>baja-media sensibilidad</strong>.
          </p>
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
              <div>
                <p className="font-medium" style={{ color: 'var(--g-text-primary)' }}>
                  Clasificacion: Demostrador / Prototipo funcional
                </p>
                <p className="mt-1" style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>
                  Esta aplicacion NO procesa secreto profesional, datos especiales (Art. 9 RGPD) ni informacion
                  de clientes del despacho. Gestiona exclusivamente datos operativos internos de baja-media sensibilidad
                  (corresponsales, importes de liquidaciones, certificados fiscales publicos).
                </p>
              </div>
            </div>
          </div>
          <p style={{ color: 'var(--g-text-primary)' }}>
            El objetivo de este manifiesto es proporcionar al Comite de Seguridad de Garrigues
            la informacion necesaria para evaluar la viabilidad de esta arquitectura en modo prototipo
            y facilitar la toma de decisiones sobre su evolucion.
          </p>
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
            Comparativa de certificaciones entre Garrigues y los proveedores cloud de LIQUIDA360.
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
              backgroundColor: 'var(--g-sec-100)',
              borderRadius: 'var(--g-radius-md)',
            }}
          >
            <p className="font-medium" style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-small)' }}>
              <strong>GAP principal identificado:</strong> Supabase (backend) carece de certificacion ISO 27001
              y opera sobre infraestructura AWS (jurisdiccion EE.UU.). Vercel (frontend) esta alineado con
              los requisitos de Garrigues al disponer de ISO 27001 y SOC 2.
            </p>
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
            Clasificacion de todos los datos gestionados por la aplicacion segun sensibilidad y tipo.
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
                  <Td><RiskBadge risk={d.sensitivity === 'Baja' ? 'bajo' : 'medio'} /></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{d.pii}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{d.location}</span></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
          <div
            className="p-4"
            style={{
              backgroundColor: 'var(--g-status-success-bg)',
              borderRadius: 'var(--g-radius-md)',
              border: '1px solid var(--g-status-success)',
            }}
          >
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--g-status-success)' }} />
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-primary)' }}>
                <strong>Sin datos criticos:</strong> La aplicacion NO almacena secreto profesional,
                datos de salud, datos penales, ni informacion de clientes del despacho.
                Todos los datos PII son de ambito profesional (emails corporativos, NIF de empresas).
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
            subtitle="Basado en Supabase Auth (GoTrue)"
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
                { control: 'Tokens JWT con expiracion', status: 'cumple' as ComplianceLevel, detail: 'JWT firmado con app_metadata.role (inmutable por usuario)' },
                { control: 'Gestion de sesiones', status: 'cumple' as ComplianceLevel, detail: 'getSession() + onAuthStateChange para invalidacion en tiempo real' },
                { control: 'Rutas protegidas', status: 'cumple' as ComplianceLevel, detail: 'ProtectedRoute y PortalRoute con verificacion de rol' },
                { control: 'Fallback a minimo privilegio', status: 'cumple' as ComplianceLevel, detail: 'Si el rol no existe, se asigna "pagador" (menor privilegio)' },
                { control: 'MFA (multifactor)', status: 'no_cumple' as ComplianceLevel, detail: 'No implementado. Recomendado para Fase 2 (roles admin/financiero)' },
              ].map((row) => (
                <tr key={row.control}>
                  <Td><span className="font-medium">{row.control}</span></Td>
                  <Td><ComplianceBadge level={row.status} /></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.detail}</span></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>

          {/* 4b. Autorizacion */}
          <SectionTitle
            icon={Users}
            title="4.2 Control de acceso basado en roles (RBAC)"
            subtitle="5 roles con separacion de funciones + RLS en base de datos"
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
                { role: 'pagador', scope: 'Crear liquidaciones, ver corresponsales/certificados', restriction: 'Solo ve sus propias liquidaciones. Solo edita borradores propios.' },
                { role: 'supervisor', scope: 'Todo lo de pagador + aprobar/rechazar liquidaciones', restriction: 'Ve todas las liquidaciones. No accede a pagos.' },
                { role: 'financiero', scope: 'Gestionar solicitudes de pago', restriction: 'Solo ve liquidaciones aprobadas+. No crea liquidaciones.' },
                { role: 'admin', scope: 'Acceso completo', restriction: 'Unico rol que puede eliminar registros y gestionar usuarios.' },
                { role: 'corresponsal', scope: 'Portal de autoservicio', restriction: 'Aislado del sistema interno. Solo ve sus propios datos.' },
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

          {/* 4c. Integridad */}
          <SectionTitle
            icon={Workflow}
            title="4.3 Integridad de flujos de trabajo"
            subtitle="Triggers de base de datos para transiciones de estado"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="p-4"
              style={{ backgroundColor: 'var(--g-sec-100)', borderRadius: 'var(--g-radius-md)' }}
            >
              <p className="font-medium mb-2" style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-body)' }}>
                Flujo de liquidaciones
              </p>
              <div className="flex flex-wrap items-center gap-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                <span className="font-mono px-1.5 py-0.5" style={{ backgroundColor: 'var(--g-bg-primary)', borderRadius: 'var(--g-radius-sm)' }}>draft</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-mono px-1.5 py-0.5" style={{ backgroundColor: 'var(--g-bg-primary)', borderRadius: 'var(--g-radius-sm)' }}>pending_approval</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-mono px-1.5 py-0.5" style={{ backgroundColor: 'var(--g-bg-primary)', borderRadius: 'var(--g-radius-sm)' }}>approved</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-mono px-1.5 py-0.5" style={{ backgroundColor: 'var(--g-bg-primary)', borderRadius: 'var(--g-radius-sm)' }}>payment_requested</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-mono px-1.5 py-0.5" style={{ backgroundColor: 'var(--g-status-success-bg)', borderRadius: 'var(--g-radius-sm)' }}>paid</span>
              </div>
              <p className="mt-2" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                Validado por trigger <code className="font-mono">validate_liquidation_status_transition</code>. Imposible saltar pasos.
              </p>
            </div>
            <div
              className="p-4"
              style={{ backgroundColor: 'var(--g-sec-100)', borderRadius: 'var(--g-radius-md)' }}
            >
              <p className="font-medium mb-2" style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-body)' }}>
                Flujo de solicitudes de pago
              </p>
              <div className="flex flex-wrap items-center gap-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                <span className="font-mono px-1.5 py-0.5" style={{ backgroundColor: 'var(--g-bg-primary)', borderRadius: 'var(--g-radius-sm)' }}>pending</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-mono px-1.5 py-0.5" style={{ backgroundColor: 'var(--g-bg-primary)', borderRadius: 'var(--g-radius-sm)' }}>in_progress</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-mono px-1.5 py-0.5" style={{ backgroundColor: 'var(--g-status-success-bg)', borderRadius: 'var(--g-radius-sm)' }}>paid</span>
              </div>
              <p className="mt-2" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                Validado por trigger <code className="font-mono">validate_payment_status_transition</code>. Auto-registra processed_at/by.
              </p>
            </div>
          </div>

          {/* 4d. Auditoria */}
          <SectionTitle
            icon={Eye}
            title="4.4 Trazabilidad y auditoria"
            subtitle="Registro automatico de cambios en tablas criticas"
          />
          <TableWrapper>
            <thead>
              <tr>
                <Th>Tabla auditada</Th>
                <Th>Operaciones</Th>
                <Th>Datos registrados</Th>
                <Th>Acceso</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td><span className="font-mono font-medium">liquidations</span></Td>
                <Td>INSERT, UPDATE, DELETE</Td>
                <Td>Datos previos + nuevos + usuario + timestamp</Td>
                <Td>Solo admin (RLS)</Td>
              </tr>
              <tr>
                <Td><span className="font-mono font-medium">payment_requests</span></Td>
                <Td>INSERT, UPDATE, DELETE</Td>
                <Td>Datos previos + nuevos + usuario + timestamp</Td>
                <Td>Solo admin (RLS)</Td>
              </tr>
            </tbody>
          </TableWrapper>
        </CardContent>
      </Card>

      {/* ── 5. Cumplimiento ISO 27001 Anexo A ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            5. Cumplimiento ISO 27001:2022 - Controles Anexo A
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Evaluacion detallada de controles ISO 27001:2022 relevantes para la aplicacion.
            Los controles no listados son de responsabilidad corporativa de Garrigues (SGSI existente).
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
                      <span style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-status-warning)' }}>{row.action}</span>
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

      {/* ── 6. SOC 2 vs ISO 27001 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            6. Comparativa SOC 2 vs ISO 27001 (referencia para comite)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Supabase dispone de SOC 2 Type II pero no de ISO 27001. Esta tabla explica las diferencias
            clave para facilitar la evaluacion del comite de seguridad.
          </p>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Aspecto</Th>
                <Th>SOC 2 Type II (Supabase)</Th>
                <Th>ISO 27001:2022 (Garrigues)</Th>
                <Th>GAP</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { aspect: 'Enfoque', soc2: 'Controles de servicio (5 Trust Criteria)', iso: 'Sistema de Gestion completo (ISMS)', gap: 'medio' as const },
                { aspect: 'Alcance', soc2: 'Definido por el proveedor', iso: 'Toda la organizacion', gap: 'medio' as const },
                { aspect: 'Gobierno', soc2: 'Implicito en controles', iso: 'Explicito: contexto, liderazgo, planificacion', gap: 'alto' as const },
                { aspect: 'Gestion de riesgo', soc2: 'Evaluacion de riesgos del servicio', iso: 'Proceso formal PDCA de analisis y tratamiento', gap: 'alto' as const },
                { aspect: 'Controles', soc2: '5 categorias (Trust Criteria)', iso: '93 controles (Anexo A 2022)', gap: 'medio' as const },
                { aspect: 'Mejora continua', soc2: 'Evaluacion de efectividad', iso: 'Ciclo PDCA + auditorias internas + revision direccion', gap: 'medio' as const },
                { aspect: 'Reconocimiento', soc2: 'Principalmente EE.UU.', iso: 'Global (especialmente Europa)', gap: 'alto' as const },
                { aspect: 'Frecuencia auditoria', soc2: 'Anual', iso: 'Anual (externa) + internas periodicas', gap: 'bajo' as const },
              ].map((row) => (
                <tr key={row.aspect}>
                  <Td><span className="font-medium">{row.aspect}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.soc2}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.iso}</span></Td>
                  <Td><RiskBadge risk={row.gap} /></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </CardContent>
      </Card>

      {/* ── 7. Matriz de riesgos ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            7. Matriz de riesgos especificos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Riesgos identificados considerando la clasificacion de {DATA_CLASSIFICATION} y el uso como demostrador.
          </p>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Riesgo</Th>
                <Th>Probabilidad</Th>
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
        </CardContent>
      </Card>

      {/* ── 8. Escenarios de decision ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            8. Escenarios de decision para el comite
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Escenario A */}
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
                <span className="font-bold" style={{ color: 'var(--g-text-primary)' }}>Escenario A: Viable</span>
              </div>
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                <strong>Uso como demostrador/prototipo</strong> con datos de baja-media sensibilidad,
                sin secreto profesional ni datos de clientes del despacho.
              </p>
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                Requiere: medidas compensatorias del roadmap Fases 0-1.
              </p>
              <span
                className="mt-auto self-start px-2 py-1 text-xs font-bold"
                style={{ backgroundColor: 'var(--g-status-success)', color: 'white', borderRadius: 'var(--g-radius-sm)' }}
              >
                RECOMENDADO PARA SITUACION ACTUAL
              </span>
            </div>

            {/* Escenario B */}
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
                <span className="font-bold" style={{ color: 'var(--g-text-primary)' }}>Escenario B: Condicionado</span>
              </div>
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                <strong>Uso en piloto interno</strong> con datos confidenciales no criticos.
                Requiere implementar E2EE, MFA, pentesting y Fases 1-2 completas.
              </p>
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                Requiere: aprobacion formal del comite + DPA con Supabase Enterprise.
              </p>
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
                <strong>Uso con secreto profesional</strong> o datos de clientes.
                Requiere migracion a infraestructura europea ISO 27001 (Fase 3).
              </p>
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                Alternativas: Supabase Self-Hosted EU, PostgreSQL gestionado EU, datacenter Garrigues.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 9. Roadmap de migracion ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            9. Roadmap de migracion hacia conformidad plena
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Plan progresivo de evolucion desde el demostrador actual hasta una arquitectura
            plenamente conforme con las politicas de seguridad de Garrigues.
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
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--g-brand-3308)' }} />
                          {item}
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

      {/* ── 10. Migracion a Azure Garrigues ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            10. Plan de migracion a Microsoft Azure (entorno Garrigues)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Garrigues opera su infraestructura corporativa sobre <strong>Microsoft Azure</strong> (Spain Central),
            con certificaciones ISO 27001 y ENS de nivel Alto. La migracion de LIQUIDA360 a este entorno
            resolveria de forma definitiva todos los GAPs de cumplimiento identificados.
          </p>
          <div
            className="p-4"
            style={{
              backgroundColor: 'var(--g-sec-100)',
              borderRadius: 'var(--g-radius-md)',
              border: '1px solid var(--g-border-default)',
            }}
          >
            <p className="font-medium mb-1" style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-small)' }}>
              Nota: <strong>iManage (DMS corporativo) no interviene</strong> en esta aplicacion.
              LIQUIDA360 gestiona datos operativos internos, no documentos del repositorio documental del despacho.
            </p>
          </div>

          {/* Mapeo de componentes */}
          <SectionTitle
            icon={Server}
            title="Mapeo de componentes"
            subtitle="Cada componente actual tiene un equivalente directo en Azure"
          />
          <TableWrapper>
            <thead>
              <tr>
                <Th>Componente</Th>
                <Th>Actual</Th>
                <Th>Destino Azure</Th>
                <Th>Esfuerzo</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { component: 'Frontend', current: 'Vercel', azure: 'Azure Static Web Apps', effort: 'bajo' as const },
                { component: 'Base de datos', current: 'Supabase PostgreSQL', azure: 'Azure DB for PostgreSQL', effort: 'bajo' as const },
                { component: 'Autenticacion', current: 'Supabase Auth (GoTrue)', azure: 'Microsoft Entra ID (SSO)', effort: 'medio' as const },
                { component: 'API Backend', current: 'PostgREST (autogenerada)', azure: 'Azure Functions (TypeScript)', effort: 'alto' as const },
                { component: 'Almacenamiento', current: 'Supabase Storage (S3)', azure: 'Azure Blob Storage', effort: 'medio' as const },
                { component: 'Realtime', current: 'Supabase Realtime (WS)', azure: 'Azure SignalR Service', effort: 'medio' as const },
                { component: 'Logica SQL', current: 'Triggers + RLS', azure: 'Sin cambios (PostgreSQL estandar)', effort: 'bajo' as const },
                { component: 'Secretos', current: '.env + Dashboard', azure: 'Azure Key Vault', effort: 'bajo' as const },
              ].map((row) => (
                <tr key={row.component}>
                  <Td><span className="font-medium">{row.component}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.current}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.azure}</span></Td>
                  <Td><RiskBadge risk={row.effort} /></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>

          {/* Beneficios */}
          <SectionTitle
            icon={ShieldCheck}
            title="Beneficios de la migracion"
            subtitle="Resolucion definitiva de GAPs y alineacion con SGSI"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: 'Cumplimiento ISO 27001', desc: 'Azure certificado ISO 27001 + ENS Alto. Eliminacion total del GAP de Supabase.' },
              { title: 'Soberania del dato', desc: 'Todos los datos en Spain Central (UE). Sin Cloud Act ni transferencias internacionales.' },
              { title: 'SSO + MFA corporativo', desc: 'Entra ID con credenciales Garrigues. MFA ya existente en la infraestructura.' },
              { title: 'Seguridad integrada', desc: 'Azure Key Vault, Defender for Cloud, Azure Policy, Azure Monitor.' },
            ].map((b) => (
              <div
                key={b.title}
                className="p-3 flex items-start gap-2"
                style={{ backgroundColor: 'var(--g-status-success-bg)', borderRadius: 'var(--g-radius-md)' }}
              >
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--g-status-success)' }} />
                <div>
                  <p className="font-medium" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-primary)' }}>{b.title}</p>
                  <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline comparativa */}
          <SectionTitle
            icon={Clock}
            title="Estimacion de esfuerzo: escenarios comparados"
            subtitle="Desarrollo tradicional vs. desarrollo asistido por IA"
          />
          <TableWrapper>
            <thead>
              <tr>
                <Th>Fase</Th>
                <Th>Tradicional</Th>
                <Th>Con AI-assisted dev</Th>
                <Th>Alcance</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { phase: 'F1: Infraestructura Azure', traditional: '1-2 sem', ai: '3-5 dias', scope: 'IaC generado por AI, Entra ID, Key Vault, networking' },
                { phase: 'F2: Datos y frontend', traditional: '2-3 sem', ai: '1-2 sem', scope: 'pg_dump/restore, MSAL auth, CI/CD (plantillas reutilizables)' },
                { phase: 'F3: API Backend', traditional: '6-8 sem', ai: '2-3 sem', scope: '~30 Azure Functions generadas con skill + patrones' },
                { phase: 'F4: Validacion', traditional: '2-4 sem', ai: '1-2 sem', scope: 'Suite E2E existente (146 tests) + pentesting' },
              ].map((row) => (
                <tr key={row.phase}>
                  <Td><span className="font-medium" style={{ fontSize: 'var(--g-text-small)' }}>{row.phase}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.traditional}</span></Td>
                  <Td><span className="font-medium" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-status-success)' }}>{row.ai}</span></Td>
                  <Td><span style={{ fontSize: 'var(--g-text-small)' }}>{row.scope}</span></Td>
                </tr>
              ))}
              <tr>
                <Td><span className="font-bold">TOTAL</span></Td>
                <Td><span className="font-bold" style={{ fontSize: 'var(--g-text-small)' }}>3-4 meses / 2-3 devs</span></Td>
                <Td><span className="font-bold" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-status-success)' }}>5-8 semanas / 1-2 devs</span></Td>
                <Td><span /></Td>
              </tr>
            </tbody>
          </TableWrapper>

          {/* AI acceleration callout */}
          <div
            className="p-4"
            style={{
              backgroundColor: 'var(--g-status-success-bg)',
              borderRadius: 'var(--g-radius-md)',
              border: '1px solid var(--g-status-success)',
            }}
          >
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--g-status-success)' }} />
              <div>
                <p className="font-medium" style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-body)' }}>
                  Aceleracion con herramientas de desarrollo asistido por IA
                </p>
                <p className="mt-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                  Las estimaciones <strong>tradicionales</strong> asumen desarrollo manual sin herramientas de asistencia.
                  Con marcos de desarrollo AI-assisted (<strong>Claude Code, Codex, Antigravity</strong>) y skills
                  reutilizables como <code style={{ fontFamily: 'monospace' }}>garrigues-security-compliance</code>,
                  el esfuerzo se reduce significativamente: la generacion de Azure Functions CRUD,
                  adaptacion de RLS y scaffolding de infraestructura son tareas altamente automatizables.
                </p>
                <p className="mt-2" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                  <strong>iobuilders</strong> (empresa participada por Garrigues) dispone de marcos de referencia
                  para desarrollo AI-assisted que podrian aplicarse directamente, reduciendo el equipo necesario
                  a 1-2 desarrolladores y el timeline a 5-8 semanas.
                </p>
              </div>
            </div>
          </div>

          {/* Industrialization callout */}
          <div
            className="p-4"
            style={{
              backgroundColor: 'var(--g-sec-100)',
              borderRadius: 'var(--g-radius-md)',
              borderLeft: '4px solid var(--g-brand-3308)',
            }}
          >
            <p className="font-bold mb-2" style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-brand-3308)' }}>
              Industrializacion: del prototipo al flujo corporativo
            </p>
            <p className="mb-2" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
              La migracion de LIQUIDA360 no es un esfuerzo aislado: establece un <strong>marco de referencia
              reutilizable</strong> para futuras soluciones internas de Garrigues:
            </p>
            <ul className="flex flex-col gap-1.5" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-primary)' }}>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-3 w-3 mt-1 shrink-0" style={{ color: 'var(--g-brand-3308)' }} />
                <span><strong>Skill de compliance</strong> incorporada al proceso de desarrollo: todo prototipo nace con manifiesto de seguridad, clasificacion de datos y roadmap de migracion Azure</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-3 w-3 mt-1 shrink-0" style={{ color: 'var(--g-brand-3308)' }} />
                <span><strong>Patrones de codigo portables</strong>: abstracciones de auth, servicios y RLS disenadas para migrar de BaaS agil a Azure con cambios minimos</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-3 w-3 mt-1 shrink-0" style={{ color: 'var(--g-brand-3308)' }} />
                <span><strong>Arquitectura de referencia Azure</strong> documentada: Static Web Apps + Functions + PostgreSQL + Entra ID, replicable para cualquier app de gestion interna</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-3 w-3 mt-1 shrink-0" style={{ color: 'var(--g-brand-3308)' }} />
                <span><strong>Flujo estandarizado</strong>: Prototipo agil (2-4 sem) → Validacion con usuarios → Decision del comite → Migracion Azure (5-8 sem con AI) → Produccion</span>
              </li>
            </ul>
          </div>

          {/* Lo que se conserva */}
          <div
            className="p-4"
            style={{
              backgroundColor: 'var(--g-sec-100)',
              borderRadius: 'var(--g-radius-md)',
              borderLeft: '4px solid var(--g-brand-3308)',
            }}
          >
            <p className="font-medium mb-2" style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-primary)' }}>
              El 70% del codigo se conserva intacto en la migracion:
            </p>
            <ul className="flex flex-col gap-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: 'var(--g-status-success)' }} />
                Todo el frontend React + Design System Garrigues
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: 'var(--g-status-success)' }} />
                Esquema SQL, triggers, funciones, RLS (PostgreSQL estandar)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: 'var(--g-status-success)' }} />
                Suite de tests (266 tests E2E + unitarios)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: 'var(--g-status-success)' }} />
                Validaciones Zod, logica de negocio, utilidades
              </li>
            </ul>
          </div>

          {/* Link al documento completo */}
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
                Documento completo: Plan de Migracion a Microsoft Azure
              </p>
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                Analisis detallado con mapeo componente a componente, codigo de referencia,
                estimaciones de coste y plan de fases. Ver en docs/azure-migration-roadmap.md
              </p>
            </div>
          </a>
        </CardContent>
      </Card>

      {/* ── 11. Conclusion y firma ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            11. Conclusion y declaracion
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
              LIQUIDA360 presenta un <strong>GAP significativo pero gestionable</strong> con el SGSI
              de Garrigues en su estado actual de demostrador:
            </p>
            <ul className="mt-3 flex flex-col gap-2" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-primary)' }}>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--g-status-success)' }} />
                <strong>Vercel</strong> esta alineado con Garrigues (ISO 27001 + SOC 2).
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--g-status-warning)' }} />
                <strong>Supabase</strong> requiere medidas compensatorias (SOC 2 sin ISO 27001, jurisdiccion US).
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--g-status-success)' }} />
                Los <strong>controles de aplicacion</strong> (RBAC, RLS, auditoria, validacion, workflows) son robustos para el nivel de datos.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--g-brand-3308)' }} />
                La <strong>clasificacion baja-media</strong> de los datos hace viable el uso como demostrador con las medidas compensatorias descritas.
              </li>
              <li className="flex items-start gap-2">
                <Cloud className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--g-brand-3308)' }} />
                La <strong>migracion a Azure corporativo</strong> (Spain Central) esta planificada como Fase 3 y resuelve definitivamente
                todos los GAPs. El 70% del codigo se conserva intacto.
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
              <strong>Manifiesto de Seguridad v{MANIFEST_VERSION}</strong> | Generado: {MANIFEST_DATE} |
              Aplicacion: LIQUIDA360 | Clasificacion: {APP_CLASSIFICATION} |
              Proximo revision: Trimestral o ante cambios de alcance
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
