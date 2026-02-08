import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Globe,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  Shield,
  FileSignature,
  Hash,
  QrCode,
  Stamp,
  Lock,
  Search,
  Lightbulb,
} from 'lucide-react'
import {
  TIER_INFO,
  VERIFICATION_PROTOCOLS,
  REGION_LABELS,
  getCountriesByRegion,
  getTierCount,
  type VerificationTier,
  type Region,
  type CountryVerification,
  type ProtocolInfo,
} from '../constants/verification-guide-data'

/* ─────────────── Helpers ─────────────── */

const PROTOCOL_ICONS: Record<string, React.ElementType> = {
  Globe,
  FileSignature,
  Hash,
  QrCode,
  Stamp,
  Lock,
}

function TierBadge({ tier }: { tier: VerificationTier }) {
  const info = TIER_INFO[tier]
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 text-xs font-bold"
      style={{ backgroundColor: info.colorBg, color: info.colorFg, borderRadius: 'var(--g-radius-sm)' }}
    >
      {info.shortLabel}
    </span>
  )
}

function SecurityBadge({ level }: { level: 'alta' | 'media' | 'baja' }) {
  const config = {
    alta: { bg: 'var(--g-status-success-bg)', fg: 'var(--g-status-success)' },
    media: { bg: 'var(--g-status-warning-bg)', fg: 'var(--g-status-warning)' },
    baja: { bg: 'var(--g-sec-100)', fg: 'var(--g-text-secondary)' },
  }
  const c = config[level]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase"
      style={{ backgroundColor: c.bg, color: c.fg, borderRadius: 'var(--g-radius-sm)' }}
    >
      {level}
    </span>
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
      scope="col"
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

/* ─────────────── Region Table ─────────────── */

function RegionTable({ region, icon: Icon }: { region: Region; icon: React.ElementType }) {
  const countries = getCountriesByRegion(region)
  if (countries.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
          {REGION_LABELS[region]} ({countries.length} jurisdicciones)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TableWrapper>
          <thead>
            <tr>
              <Th>Pais</Th>
              <Th width="80px">Cat.</Th>
              <Th>Autoridad</Th>
              <Th>Metodo de verificacion</Th>
              <Th>URL</Th>
              <Th>Notas</Th>
            </tr>
          </thead>
          <tbody>
            {countries.map((country) => (
              <CountryRow key={country.countryCode} country={country} />
            ))}
          </tbody>
        </TableWrapper>
      </CardContent>
    </Card>
  )
}

function CountryRow({ country }: { country: CountryVerification }) {
  return (
    <tr>
      <Td>
        <span className="font-medium whitespace-nowrap">
          {country.flag} {country.countryName}
        </span>
      </Td>
      <Td>
        <TierBadge tier={country.tier} />
      </Td>
      <Td>
        <span style={{ fontSize: 'var(--g-text-small)' }}>{country.taxAuthority}</span>
      </Td>
      <Td>
        <span style={{ fontSize: 'var(--g-text-small)' }}>{country.verificationMethod}</span>
        {country.inputRequired && (
          <div className="mt-1">
            <span
              className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono"
              style={{
                backgroundColor: 'var(--g-sec-100)',
                borderRadius: 'var(--g-radius-sm)',
                color: 'var(--g-text-secondary)',
              }}
            >
              {country.inputRequired}
            </span>
          </div>
        )}
      </Td>
      <Td>
        {country.verificationUrl ? (
          <a
            href={country.verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium"
            style={{ color: 'var(--g-brand-3308)', fontSize: 'var(--g-text-small)' }}
            aria-label={`Abrir portal de verificacion de ${country.countryName}`}
          >
            Portal
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>-</span>
        )}
      </Td>
      <Td>
        <span style={{ fontSize: 'var(--g-text-small)' }}>{country.notes}</span>
      </Td>
    </tr>
  )
}

/* ─────────────── Protocol Card ─────────────── */

function ProtocolCard({ protocol }: { protocol: ProtocolInfo }) {
  const Icon = PROTOCOL_ICONS[protocol.icon] || Shield
  return (
    <div
      className="p-4 flex flex-col gap-2"
      style={{ backgroundColor: 'var(--g-sec-100)', borderRadius: 'var(--g-radius-md)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: 'var(--g-brand-3308)' }} />
          <span className="font-medium" style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-primary)' }}>
            {protocol.name}
          </span>
        </div>
        <SecurityBadge level={protocol.securityLevel} />
      </div>
      <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
        {protocol.description}
      </p>
    </div>
  )
}

/* ─────────────── Main Component ─────────────── */

export function VerificationGuidePage() {
  const tierA = getTierCount('A')
  const tierB = getTierCount('B')
  const tierC = getTierCount('C')
  const tierD = getTierCount('D')

  return (
    <div className="flex flex-col gap-8 max-w-5xl pb-8 animate-fade-in">
      {/* Back link */}
      <Link
        to="/certificates"
        className="inline-flex items-center gap-1.5 self-start"
        style={{ color: 'var(--g-brand-3308)', fontSize: 'var(--g-text-small)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Certificados
      </Link>

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
          <Globe className="h-8 w-8 mt-0.5 shrink-0" style={{ color: 'var(--g-brand-3308)' }} />
          <div>
            <h2 className="font-bold" style={{ fontSize: 'var(--g-text-h3)', color: 'var(--g-text-primary)' }}>
              Guia de Verificacion de Certificados de Residencia Fiscal
            </h2>
            <p className="mt-1" style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
              Analisis de los sistemas de verificacion publica de certificados de residencia fiscal en 20
              jurisdicciones, con URLs de portales oficiales, metodos de cotejo y recomendaciones para compliance.
            </p>
            <div
              className="flex flex-wrap gap-4 mt-3"
              style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}
            >
              <span>
                Jurisdicciones: <strong style={{ color: 'var(--g-text-primary)' }}>20</strong>
              </span>
              <span>
                Actualizacion: <strong style={{ color: 'var(--g-text-primary)' }}>Febrero 2026</strong>
              </span>
              <span>
                Fuente: <strong style={{ color: 'var(--g-text-primary)' }}>Auditoria global de portales fiscales</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            { tier: 'A' as VerificationTier, count: tierA },
            { tier: 'B' as VerificationTier, count: tierB },
            { tier: 'C' as VerificationTier, count: tierC },
            { tier: 'D' as VerificationTier, count: tierD },
          ] as const
        ).map((item) => {
          const info = TIER_INFO[item.tier]
          return (
            <div
              key={item.tier}
              className="p-3 text-center"
              style={{ backgroundColor: info.colorBg, borderRadius: 'var(--g-radius-md)' }}
            >
              <p className="text-2xl font-bold" style={{ color: info.colorFg }}>
                {item.count}
              </p>
              <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                {info.shortLabel}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── Key finding callout ── */}
      <div
        className="p-4"
        style={{
          backgroundColor: 'var(--g-status-success-bg)',
          borderRadius: 'var(--g-radius-md)',
          border: '1px solid var(--g-status-success)',
        }}
      >
        <div className="flex items-start gap-2">
          <Lightbulb className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--g-status-success)' }} />
          <div>
            <p className="font-medium" style={{ color: 'var(--g-text-primary)' }}>
              Hallazgo clave: Brecha digital inversa
            </p>
            <p className="mt-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
              Las economias emergentes de Latinoamerica lideran con 7 de 7 paises en Categoria A (verificacion
              publica sin credenciales), mientras que las potencias del G7 mantienen sistemas analogicos o
              restringidos (Categorias B-C). El sistema de facturacion electronica latinoamericano (CFDI Mexico,
              FEA Chile, SRI Ecuador) impulso esta ventaja digital que aun no se extiende completamente a los
              certificados de residencia fiscal.
            </p>
          </div>
        </div>
      </div>

      {/* ── Tier legend ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            Clasificacion por niveles de verificacion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['A', 'B', 'C', 'D'] as VerificationTier[]).map((tier) => {
              const info = TIER_INFO[tier]
              return (
                <div
                  key={tier}
                  className="p-3 flex items-start gap-3"
                  style={{
                    backgroundColor: info.colorBg,
                    borderRadius: 'var(--g-radius-md)',
                  }}
                >
                  <TierBadge tier={tier} />
                  <div>
                    <p className="font-medium" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-primary)' }}>
                      {info.label}
                    </p>
                    <p style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                      {info.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Verification protocols ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            Protocolos de verificacion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4" style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Metodos disponibles para validar la autenticidad de certificados de residencia fiscal segun la
            jurisdiccion de emision.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {VERIFICATION_PROTOCOLS.map((protocol) => (
              <ProtocolCard key={protocol.id} protocol={protocol} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Regional tables ── */}
      <RegionTable region="latin_america" icon={Globe} />
      <RegionTable region="north_america" icon={Globe} />
      <RegionTable region="asia_pacific" icon={Globe} />
      <RegionTable region="europe" icon={Globe} />

      {/* ── Recommendations ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
            Recomendaciones para compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* By tier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="p-4 flex flex-col gap-2"
              style={{
                backgroundColor: 'var(--g-status-success-bg)',
                borderRadius: 'var(--g-radius-md)',
                border: '1px solid var(--g-status-success)',
              }}
            >
              <div className="flex items-center gap-2">
                <TierBadge tier="A" />
                <span className="font-medium" style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-small)' }}>
                  Jurisdicciones Cat. A
                </span>
              </div>
              <ul className="flex flex-col gap-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" style={{ color: 'var(--g-status-success)' }} />
                  Usar portal oficial como metodo primario de validacion
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" style={{ color: 'var(--g-status-success)' }} />
                  Documentar captura de pantalla del resultado con timestamp
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" style={{ color: 'var(--g-status-success)' }} />
                  Tiempo estimado: segundos a minutos
                </li>
              </ul>
            </div>

            <div
              className="p-4 flex flex-col gap-2"
              style={{
                backgroundColor: 'var(--g-status-warning-bg)',
                borderRadius: 'var(--g-radius-md)',
                border: '1px solid var(--g-status-warning)',
              }}
            >
              <div className="flex items-center gap-2">
                <TierBadge tier="B" />
                <span className="font-medium" style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-small)' }}>
                  Jurisdicciones Cat. B
                </span>
              </div>
              <ul className="flex flex-col gap-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                <li className="flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" style={{ color: 'var(--g-status-warning)' }} />
                  Solicitar al beneficiario archivo digital original (PDF/P7M)
                </li>
                <li className="flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" style={{ color: 'var(--g-status-warning)' }} />
                  Usar herramienta de validacion de firma digital si aplica
                </li>
                <li className="flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" style={{ color: 'var(--g-status-warning)' }} />
                  Tiempo estimado: minutos a horas
                </li>
              </ul>
            </div>

            <div
              className="p-4 flex flex-col gap-2"
              style={{
                backgroundColor: 'var(--g-sec-100)',
                borderRadius: 'var(--g-radius-md)',
                border: '1px solid var(--g-border-default)',
              }}
            >
              <div className="flex items-center gap-2">
                <TierBadge tier="C" />
                <span className="font-medium" style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-small)' }}>
                  Jurisdicciones Cat. C
                </span>
              </div>
              <ul className="flex flex-col gap-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                <li className="flex items-start gap-1.5">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" style={{ color: 'var(--g-text-secondary)' }} />
                  Exigir apostilla como requisito no negociable
                </li>
                <li className="flex items-start gap-1.5">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" style={{ color: 'var(--g-text-secondary)' }} />
                  Verificar autenticidad de apostilla en portal digital si existe
                </li>
                <li className="flex items-start gap-1.5">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" style={{ color: 'var(--g-text-secondary)' }} />
                  Tiempo estimado: dias a semanas
                </li>
              </ul>
            </div>

            <div
              className="p-4 flex flex-col gap-2"
              style={{
                backgroundColor: 'var(--g-status-error-bg)',
                borderRadius: 'var(--g-radius-md)',
                border: '1px solid var(--g-status-error)',
              }}
            >
              <div className="flex items-center gap-2">
                <TierBadge tier="D" />
                <span className="font-medium" style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-small)' }}>
                  Jurisdicciones Cat. D
                </span>
              </div>
              <ul className="flex flex-col gap-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                <li className="flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" style={{ color: 'var(--g-status-error)' }} />
                  Revision manual obligatoria por equipo de compliance
                </li>
                <li className="flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" style={{ color: 'var(--g-status-error)' }} />
                  Verificar que el documento correcto fue emitido (ej: Mexico)
                </li>
                <li className="flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" style={{ color: 'var(--g-status-error)' }} />
                  Considerar validacion notarial o consular como alternativa
                </li>
              </ul>
            </div>
          </div>

          {/* Critical alerts */}
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
                  Alertas de falsos positivos
                </p>
                <ul className="mt-2 flex flex-col gap-1.5" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                  <li>
                    <strong>Mexico:</strong> Rechazar la Constancia de Situacion Fiscal (con QR) cuando se requiere
                    la de Residencia para Efectos Fiscales (sin QR).
                  </li>
                  <li>
                    <strong>Singapur:</strong> El portal de verificacion requiere Singpass; un documento que afirme
                    verificacion online publica es invalido.
                  </li>
                  <li>
                    <strong>USA/Japon:</strong> La ausencia de QR o portal NO indica invalidez; la apostilla es el
                    mecanismo estandar.
                  </li>
                  <li>
                    <strong>Panama:</strong> Tiempos de emision de 3-5 meses son normales; no son indicador de fraude.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Back link bottom ── */}
      <Link
        to="/certificates"
        className="inline-flex items-center gap-1.5 self-start"
        style={{ color: 'var(--g-brand-3308)', fontSize: 'var(--g-text-small)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Certificados
      </Link>
    </div>
  )
}
