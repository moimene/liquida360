import { useMemo, useState } from 'react'
import { Loader2, RotateCcw, Save, FileSearch } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/features/auth'
import { isGInvoiceEnabled } from '@/lib/feature-flags'
import { supabase } from '@/lib/supabase'
import { useSignedUrl } from '../hooks/use-signed-url'

type UTTAIGateMode = 'block' | 'warn'
type ComplianceGateMode = 'block_sent_to_accounting' | 'needs_info'
type AttachmentMode = 'pdf' | 'zip' | 'both'
type SapExportFormat = 'csv' | 'xlsx'

interface GInvSettingsState {
  uttaiGateMode: UTTAIGateMode
  complianceGateMode: ComplianceGateMode
  requirePartnerApproval: boolean
  invoicePdfRequired: boolean
  allowInlinePdfPreview: boolean
  deliveryAttachmentMode: AttachmentMode
  sapExportFormat: SapExportFormat
  sapDeepLinkTemplate: string
  signedUrlMinutes: number
  certificateAlertsDays: number[]
  platformSlaHours: number
  autoNotifyOnPosted: boolean
}

const STORAGE_KEY = 'liquida360:ginvoice:settings:v1'
const SAVED_AT_STORAGE_KEY = 'liquida360:ginvoice:settings:v1:saved_at'
const MIN_SIGNED_URL_MINUTES = 5
const MAX_SIGNED_URL_MINUTES = 1440
const MIN_PLATFORM_SLA_HOURS = 1
const MAX_PLATFORM_SLA_HOURS = 720

const DEFAULT_SETTINGS: GInvSettingsState = {
  uttaiGateMode: 'block',
  complianceGateMode: 'block_sent_to_accounting',
  requirePartnerApproval: true,
  invoicePdfRequired: true,
  allowInlinePdfPreview: true,
  deliveryAttachmentMode: 'both',
  sapExportFormat: 'xlsx',
  sapDeepLinkTemplate: '',
  signedUrlMinutes: 15,
  certificateAlertsDays: [60, 30, 7],
  platformSlaHours: 48,
  autoNotifyOnPosted: true,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof value === 'string' && allowed.includes(value as T)) {
    return value as T
  }
  return fallback
}

function normalizeNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  const rounded = Math.round(parsed)
  return Math.max(min, Math.min(max, rounded))
}

function normalizeDays(value: unknown, fallback: number[]): number[] {
  if (!Array.isArray(value)) return fallback
  const parsed = value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0 && item <= 365)
  if (parsed.length === 0) return fallback
  return Array.from(new Set(parsed)).sort((a, b) => b - a)
}

function normalizeSettings(value: unknown): GInvSettingsState {
  if (!isRecord(value)) return DEFAULT_SETTINGS

  return {
    uttaiGateMode: normalizeEnum(value.uttaiGateMode, ['block', 'warn'], DEFAULT_SETTINGS.uttaiGateMode),
    complianceGateMode: normalizeEnum(
      value.complianceGateMode,
      ['block_sent_to_accounting', 'needs_info'],
      DEFAULT_SETTINGS.complianceGateMode,
    ),
    requirePartnerApproval:
      typeof value.requirePartnerApproval === 'boolean'
        ? value.requirePartnerApproval
        : DEFAULT_SETTINGS.requirePartnerApproval,
    invoicePdfRequired:
      typeof value.invoicePdfRequired === 'boolean'
        ? value.invoicePdfRequired
        : DEFAULT_SETTINGS.invoicePdfRequired,
    allowInlinePdfPreview:
      typeof value.allowInlinePdfPreview === 'boolean'
        ? value.allowInlinePdfPreview
        : DEFAULT_SETTINGS.allowInlinePdfPreview,
    deliveryAttachmentMode: normalizeEnum(
      value.deliveryAttachmentMode,
      ['pdf', 'zip', 'both'],
      DEFAULT_SETTINGS.deliveryAttachmentMode,
    ),
    sapExportFormat: normalizeEnum(value.sapExportFormat, ['csv', 'xlsx'], DEFAULT_SETTINGS.sapExportFormat),
    sapDeepLinkTemplate:
      typeof value.sapDeepLinkTemplate === 'string'
        ? value.sapDeepLinkTemplate.trim()
        : DEFAULT_SETTINGS.sapDeepLinkTemplate,
    signedUrlMinutes: normalizeNumber(
      value.signedUrlMinutes,
      DEFAULT_SETTINGS.signedUrlMinutes,
      MIN_SIGNED_URL_MINUTES,
      MAX_SIGNED_URL_MINUTES,
    ),
    certificateAlertsDays: normalizeDays(
      value.certificateAlertsDays,
      DEFAULT_SETTINGS.certificateAlertsDays,
    ),
    platformSlaHours: normalizeNumber(
      value.platformSlaHours,
      DEFAULT_SETTINGS.platformSlaHours,
      MIN_PLATFORM_SLA_HOURS,
      MAX_PLATFORM_SLA_HOURS,
    ),
    autoNotifyOnPosted:
      typeof value.autoNotifyOnPosted === 'boolean'
        ? value.autoNotifyOnPosted
        : DEFAULT_SETTINGS.autoNotifyOnPosted,
  }
}

function parseThresholdInput(rawValue: string): { value: number[] | null; error: string | null } {
  const tokens = rawValue
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)

  if (tokens.length === 0) {
    return { value: null, error: 'Indica al menos un umbral de aviso (ej. 60,30,7).' }
  }

  const parsed = tokens.map((token) => Number(token))
  if (parsed.some((value) => !Number.isInteger(value) || value <= 0 || value > 365)) {
    return { value: null, error: 'Los umbrales deben ser enteros entre 1 y 365.' }
  }

  const unique = Array.from(new Set(parsed)).sort((a, b) => b - a)
  return { value: unique, error: null }
}

function readStoredSettings(): GInvSettingsState {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return DEFAULT_SETTINGS
  }
}

function readStoredSavedAt(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(SAVED_AT_STORAGE_KEY)
}

export function GInvoiceSettingsPage() {
  const { user, ginvRole } = useAuth()
  const { getUrl: getSignedUrl, loading: openingSignedUrl } = useSignedUrl()

  const initial = useMemo(() => readStoredSettings(), [])
  const [settings, setSettings] = useState<GInvSettingsState>(initial)
  const [savedSettings, setSavedSettings] = useState<GInvSettingsState>(initial)
  const [thresholdInput, setThresholdInput] = useState(initial.certificateAlertsDays.join(','))
  const [saving, setSaving] = useState(false)
  const [openingInvoicePdf, setOpeningInvoicePdf] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(readStoredSavedAt)

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [settings, savedSettings],
  )

  const domainEnabled = isGInvoiceEnabled(user)

  function updateSetting<K extends keyof GInvSettingsState>(key: K, value: GInvSettingsState[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function updateNumberSetting<K extends keyof GInvSettingsState>(key: K, value: string, min: number, max: number) {
    const normalized = normalizeNumber(value, settings[key] as number, min, max)
    updateSetting(key, normalized as GInvSettingsState[K])
  }

  async function handleSave() {
    const thresholds = parseThresholdInput(thresholdInput)
    if (!thresholds.value || thresholds.error) {
      toast.error(thresholds.error ?? 'Revisa los umbrales antes de guardar.')
      return
    }

    const normalizedToSave: GInvSettingsState = {
      ...settings,
      signedUrlMinutes: normalizeNumber(
        settings.signedUrlMinutes,
        DEFAULT_SETTINGS.signedUrlMinutes,
        MIN_SIGNED_URL_MINUTES,
        MAX_SIGNED_URL_MINUTES,
      ),
      platformSlaHours: normalizeNumber(
        settings.platformSlaHours,
        DEFAULT_SETTINGS.platformSlaHours,
        MIN_PLATFORM_SLA_HOURS,
        MAX_PLATFORM_SLA_HOURS,
      ),
      certificateAlertsDays: thresholds.value,
    }

    setSaving(true)
    try {
      const nowIso = new Date().toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedToSave))
      localStorage.setItem(SAVED_AT_STORAGE_KEY, nowIso)
      setSettings(normalizedToSave)
      setSavedSettings(normalizedToSave)
      setThresholdInput(normalizedToSave.certificateAlertsDays.join(','))
      setSavedAt(nowIso)
      toast.success('Configuración guardada')
    } catch {
      toast.error('No se pudo guardar la configuración local')
    } finally {
      setSaving(false)
    }
  }

  function handleResetDefaults() {
    setSettings(DEFAULT_SETTINGS)
    setThresholdInput(DEFAULT_SETTINGS.certificateAlertsDays.join(','))
    toast.message('Valores por defecto aplicados. Pulsa "Guardar cambios" para confirmarlos.')
  }

  async function openLatestInvoicePdf() {
    setOpeningInvoicePdf(true)
    const { data, error } = await supabase
      .from('ginv_client_invoices')
      .select('id,pdf_file_path,sap_invoice_number')
      .not('pdf_file_path', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) {
      toast.error(`No se pudo consultar facturas: ${error.message}`)
      setOpeningInvoicePdf(false)
      return
    }

    const latest = data?.[0]
    if (!latest?.pdf_file_path) {
      toast.error('No hay facturas emitidas con PDF para visualizar')
      setOpeningInvoicePdf(false)
      return
    }

    const { url, error: signedUrlError } = await getSignedUrl({
      bucketId: 'ginv-documents',
      path: latest.pdf_file_path,
      expiresIn: settings.signedUrlMinutes * 60,
    })

    setOpeningInvoicePdf(false)

    if (signedUrlError || !url) {
      toast.error(signedUrlError ?? 'No se pudo generar la URL firmada')
      return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
    toast.success(
      `PDF abierto: ${latest.sap_invoice_number ? `factura ${latest.sap_invoice_number}` : `ID ${latest.id.slice(0, 8)}`}`,
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Consola de configuración G-Invoice
          </h1>
          <p style={{ color: 'var(--g-text-secondary)' }}>
            Gobierno del flujo, eje central PDF y parámetros operativos del dominio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleResetDefaults} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar cambios
          </Button>
        </div>
      </div>

      <div
        className="p-4 flex flex-wrap items-center justify-between gap-3"
        style={{
          backgroundColor: 'var(--g-surface-card)',
          borderRadius: 'var(--g-radius-lg)',
          border: '1px solid var(--g-border-default)',
        }}
      >
        <div className="flex items-center gap-2">
          <Badge variant={domainEnabled ? 'success' : 'destructive'}>
            {domainEnabled ? 'Dominio habilitado' : 'Dominio deshabilitado'}
          </Badge>
          <Badge variant="outline">Rol: {ginvRole ?? 'sin rol'}</Badge>
          {hasUnsavedChanges && <Badge variant="warning">Cambios sin guardar</Badge>}
        </div>
        <div className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
          Último guardado:{' '}
          <span style={{ color: 'var(--g-text-primary)', fontWeight: 500 }}>
            {savedAt ? new Date(savedAt).toLocaleString('es-ES') : 'aún no guardado'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section
          className="p-5 space-y-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <h2 className="font-semibold" style={{ color: 'var(--g-text-primary)' }}>
            Gobernanza del flujo
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="uttai-gate-mode">Política UTTAI</Label>
            <Select
              id="uttai-gate-mode"
              value={settings.uttaiGateMode}
              onChange={(event) => updateSetting('uttaiGateMode', event.target.value as UTTAIGateMode)}
            >
              <option value="block">Bloquear avance si está en rojo</option>
              <option value="warn">Permitir con advertencia</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compliance-gate-mode">Política compliance proveedor</Label>
            <Select
              id="compliance-gate-mode"
              value={settings.complianceGateMode}
              onChange={(event) => updateSetting('complianceGateMode', event.target.value as ComplianceGateMode)}
            >
              <option value="block_sent_to_accounting">Bloquear envío a contabilización</option>
              <option value="needs_info">Mover a needs_info</option>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--g-text-primary)' }}>
            <input
              type="checkbox"
              checked={settings.requirePartnerApproval}
              onChange={(event) => updateSetting('requirePartnerApproval', event.target.checked)}
            />
            Requerir aprobación de socio antes de emitir factura cliente
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--g-text-primary)' }}>
            <input
              type="checkbox"
              checked={settings.autoNotifyOnPosted}
              onChange={(event) => updateSetting('autoNotifyOnPosted', event.target.checked)}
            />
            Notificar automáticamente cuando un gasto/tasa pase a posted
          </label>
        </section>

        <section
          className="p-5 space-y-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <h2 className="font-semibold" style={{ color: 'var(--g-text-primary)' }}>
            Eje central: PDF de factura
          </h2>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--g-text-primary)' }}>
            <input
              type="checkbox"
              checked={settings.invoicePdfRequired}
              onChange={(event) => updateSetting('invoicePdfRequired', event.target.checked)}
            />
            El PDF de factura es obligatorio para continuar flujo
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--g-text-primary)' }}>
            <input
              type="checkbox"
              checked={settings.allowInlinePdfPreview}
              onChange={(event) => updateSetting('allowInlinePdfPreview', event.target.checked)}
            />
            Permitir visualización embebida o en nueva pestaña con signed URL
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="delivery-attachment-mode">Formato de adjuntos en entrega a cliente</Label>
            <Select
              id="delivery-attachment-mode"
              value={settings.deliveryAttachmentMode}
              onChange={(event) => updateSetting('deliveryAttachmentMode', event.target.value as AttachmentMode)}
            >
              <option value="pdf">Solo PDF</option>
              <option value="zip">Solo ZIP</option>
              <option value="both">Permitir PDF o ZIP</option>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={openLatestInvoicePdf}
            disabled={openingInvoicePdf || openingSignedUrl}
          >
            {openingInvoicePdf || openingSignedUrl ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSearch className="h-4 w-4 mr-2" />
            )}
            Abrir última factura con PDF
          </Button>
        </section>

        <section
          className="p-5 space-y-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <h2 className="font-semibold" style={{ color: 'var(--g-text-primary)' }}>
            Integración SAP simple
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="sap-export-format">Formato de exportación contable</Label>
            <Select
              id="sap-export-format"
              value={settings.sapExportFormat}
              onChange={(event) => updateSetting('sapExportFormat', event.target.value as SapExportFormat)}
            >
              <option value="csv">CSV</option>
              <option value="xlsx">XLSX</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sap-link-template">Plantilla deep-link SAP</Label>
            <Input
              id="sap-link-template"
              value={settings.sapDeepLinkTemplate}
              onChange={(event) => updateSetting('sapDeepLinkTemplate', event.target.value)}
              placeholder="https://sap.miempresa.com/doc?ref={ref}"
            />
            <p className="text-xs" style={{ color: 'var(--g-text-tertiary)' }}>
              Usa <code>{'{ref}'}</code> para inyectar la referencia SAP. Si no se indica, se usará <code>?ref=...</code>.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signed-url-minutes">Vigencia signed URL (minutos)</Label>
            <Input
              id="signed-url-minutes"
              type="number"
              min={MIN_SIGNED_URL_MINUTES}
              max={MAX_SIGNED_URL_MINUTES}
              value={settings.signedUrlMinutes}
              onChange={(event) =>
                updateNumberSetting(
                  'signedUrlMinutes',
                  event.target.value,
                  MIN_SIGNED_URL_MINUTES,
                  MAX_SIGNED_URL_MINUTES,
                )
              }
            />
          </div>
        </section>

        <section
          className="p-5 space-y-4"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderRadius: 'var(--g-radius-lg)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <h2 className="font-semibold" style={{ color: 'var(--g-text-primary)' }}>
            Alertas y SLA
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="certificate-alert-days">
              Preavisos certificados (días, separados por coma)
            </Label>
            <Input
              id="certificate-alert-days"
              value={thresholdInput}
              onChange={(event) => setThresholdInput(event.target.value)}
              placeholder="60,30,7"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="platform-sla-hours">SLA cola plataformas (horas)</Label>
            <Input
              id="platform-sla-hours"
              type="number"
              min={MIN_PLATFORM_SLA_HOURS}
              max={MAX_PLATFORM_SLA_HOURS}
              value={settings.platformSlaHours}
              onChange={(event) =>
                updateNumberSetting(
                  'platformSlaHours',
                  event.target.value,
                  MIN_PLATFORM_SLA_HOURS,
                  MAX_PLATFORM_SLA_HOURS,
                )
              }
            />
          </div>
        </section>
      </div>
    </div>
  )
}
