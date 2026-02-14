import { useEffect, useMemo, useState, useRef, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Plus, FileCheck, X, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { InfoPanel } from '@/components/ui/info-panel'
import { HelpText } from '@/components/ui/help-text'
import { useAuth } from '@/features/auth'
import { PORTAL_HELP } from '../constants/help-texts'
import { usePortalCorrespondent } from '../hooks/use-portal-correspondent'
import { usePortalCertificates } from '../hooks/use-portal-certificates'
import { getCertificateStatus, formatDate, getDefaultExpiryDate } from '@/lib/certificate-utils'
import { COUNTRIES } from '@/lib/countries'
import type { Certificate } from '@/types'

type CertificateType = 'residence' | 'withholding' | 'bank_account'

const CERTIFICATE_TYPE_OPTIONS: { value: CertificateType; label: string }[] = [
  { value: 'residence', label: 'Certificado de residencia' },
  { value: 'withholding', label: 'Certificado de retenciones' },
  { value: 'bank_account', label: 'Certificado cuenta bancaria' },
]

function getCertificateTypeLabel(type: CertificateType) {
  return (
    CERTIFICATE_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
    'Certificado'
  )
}

export function PortalCertificatesPage() {
  const user = useAuth((s) => s.user)
  const { correspondent, fetchCorrespondent } = usePortalCorrespondent()
  const { certificates, loading, fetchCertificates, uploadCertificate } = usePortalCertificates()
  const [formOpen, setFormOpen] = useState(false)
  const [activeType, setActiveType] = useState<CertificateType>('residence')

  useEffect(() => {
    if (user?.id) {
      fetchCorrespondent(user.id)
    }
  }, [user?.id, fetchCorrespondent])

  useEffect(() => {
    if (correspondent?.id) {
      fetchCertificates(correspondent.id)
    }
  }, [correspondent?.id, fetchCertificates])

  const filteredCertificates = useMemo(
    () => certificates.filter((certificate) => certificate.certificate_type === activeType),
    [certificates, activeType],
  )

  const stats = useMemo(() => {
    const valid = filteredCertificates.filter(
      (certificate) => getCertificateStatus(certificate.expiry_date).status === 'valid',
    ).length
    const expiringSoon = filteredCertificates.filter(
      (certificate) => getCertificateStatus(certificate.expiry_date).status === 'expiring_soon',
    ).length
    const expired = filteredCertificates.filter(
      (certificate) => getCertificateStatus(certificate.expiry_date).status === 'expired',
    ).length
    return { valid, expiringSoon, expired }
  }, [filteredCertificates])

  async function handleUpload(
    certificateType: CertificateType,
    issuingCountry: string,
    issueDate: string,
    expiryDate: string,
    file?: File,
  ) {
    if (!correspondent?.id) return

    const { error } = await uploadCertificate(
      correspondent.id,
      certificateType,
      issuingCountry,
      issueDate,
      expiryDate,
      file,
    )

    if (error) {
      toast.error('Error al subir certificado', { description: error })
    } else {
      toast.success('Certificado subido correctamente')
      setFormOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Certificados
          </h1>
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Gestiona certificados de residencia, retenciones y cuenta bancaria
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo certificado
        </Button>
      </div>

      <InfoPanel variant="info" dismissible dismissKey="portal-certificates">
        {PORTAL_HELP.certificatesPageInfo}
      </InfoPanel>

      <div className="flex flex-wrap gap-2">
        {CERTIFICATE_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setActiveType(option.value)}
            className="px-3 py-1.5 text-sm transition-colors"
            style={{
              borderRadius: 'var(--g-radius-md)',
              color:
                activeType === option.value
                  ? 'var(--g-text-inverse)'
                  : 'var(--g-text-secondary)',
              backgroundColor:
                activeType === option.value ? 'var(--g-brand-3308)' : 'var(--g-surface-muted)',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Vigentes" value={stats.valid} variant="success" />
        <StatCard label="Proximos a vencer" value={stats.expiringSoon} variant="warning" />
        <StatCard label="Vencidos" value={stats.expired} variant="destructive" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span style={{ color: 'var(--g-text-secondary)' }}>Cargando certificados...</span>
        </div>
      ) : filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <FileCheck className="h-12 w-12" style={{ color: 'var(--g-text-secondary)' }} />
            <p style={{ color: 'var(--g-text-secondary)' }}>
              No tienes certificados para este tipo.
            </p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Subir certificado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCertificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} />
          ))}
        </div>
      )}

      <CertificateUploadDialog
        key={activeType}
        open={formOpen}
        onOpenChange={setFormOpen}
        onUpload={handleUpload}
        defaultCountry={correspondent?.country ?? ''}
        defaultType={activeType}
      />
    </div>
  )
}

function CertificateCard({ certificate }: { certificate: Certificate }) {
  const statusInfo = getCertificateStatus(certificate.expiry_date)
  const countryName =
    COUNTRIES.find((country) => country.code === certificate.issuing_country)?.name ??
    certificate.issuing_country

  const badgeVariant =
    statusInfo.status === 'valid'
      ? 'success'
      : statusInfo.status === 'expiring_soon'
        ? 'warning'
        : 'destructive'

  const statusLabel =
    statusInfo.status === 'valid'
      ? 'Vigente'
      : statusInfo.status === 'expiring_soon'
        ? 'Proximo a vencer'
        : 'Vencido'

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" style={{ color: 'var(--g-brand-3308)' }} />
            <span className="font-medium text-sm" style={{ color: 'var(--g-text-primary)' }}>
              {countryName}
            </span>
          </div>
          <Badge variant={badgeVariant}>{statusLabel}</Badge>
        </div>

        <div className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>
          {getCertificateTypeLabel(certificate.certificate_type)}
        </div>

        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--g-text-secondary)' }}>Emision</span>
          <span style={{ color: 'var(--g-text-primary)' }}>
            {formatDate(certificate.issue_date)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--g-text-secondary)' }}>Vencimiento</span>
          <span style={{ color: 'var(--g-text-primary)' }}>
            {formatDate(certificate.expiry_date)}
          </span>
        </div>

        {certificate.document_url && (
          <a
            href={certificate.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium mt-1"
            style={{ color: 'var(--g-brand-3308)' }}
          >
            <Download className="h-3.5 w-3.5" />
            Descargar documento
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  )
}

function CertificateUploadDialog({
  open,
  onOpenChange,
  onUpload,
  defaultCountry,
  defaultType,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (
    certificateType: CertificateType,
    country: string,
    issueDate: string,
    expiryDate: string,
    file?: File,
  ) => Promise<void>
  defaultCountry: string
  defaultType: CertificateType
}) {
  const [certificateType, setCertificateType] = useState<CertificateType>(defaultType)
  const [country, setCountry] = useState(defaultCountry)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [expiryDate, setExpiryDate] = useState(
    getDefaultExpiryDate(new Date().toISOString().split('T')[0]),
  )
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (defaultCountry && !country) {
      queueMicrotask(() => setCountry(defaultCountry))
    }
  }, [defaultCountry, country])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!country || !issueDate || !expiryDate) return

    setSubmitting(true)
    await onUpload(certificateType, country, issueDate, expiryDate, file ?? undefined)
    setSubmitting(false)
    setFile(null)
  }

  function handleClose() {
    setFile(null)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Nuevo certificado"
      description="Sube un certificado con su documento adjunto."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cert-type">Tipo de certificado</Label>
          <Select
            id="cert-type"
            value={certificateType}
            onChange={(event) => setCertificateType(event.target.value as CertificateType)}
            required
          >
            {CERTIFICATE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="cert-country">Pais emisor</Label>
          <Select
            id="cert-country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            required
          >
            <option value="">Selecciona un pais</option>
            {COUNTRIES.map((countryOption) => (
              <option key={countryOption.code} value={countryOption.code}>
                {countryOption.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cert-issue-date">Fecha emision</Label>
            <Input
              id="cert-issue-date"
              type="date"
              value={issueDate}
              onChange={(event) => {
                setIssueDate(event.target.value)
                if (event.target.value) {
                  setExpiryDate(getDefaultExpiryDate(event.target.value))
                }
              }}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cert-expiry-date">Fecha vencimiento</Label>
            <Input
              id="cert-expiry-date"
              type="date"
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Documento</Label>
          {file ? (
            <div
              className="flex items-center justify-between gap-2 p-3"
              style={{
                border: '1px solid var(--g-border-default)',
                borderRadius: 'var(--g-radius-sm)',
                backgroundColor: 'var(--g-surface-muted)',
              }}
            >
              <span className="text-sm truncate" style={{ color: 'var(--g-text-primary)' }}>
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                className="p-1"
                style={{ color: 'var(--g-text-secondary)' }}
                aria-label="Quitar archivo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 transition-colors"
              style={{
                border: '1px dashed var(--g-border-default)',
                borderRadius: 'var(--g-radius-sm)',
                color: 'var(--g-text-secondary)',
              }}
              onClick={() => fileRef.current?.click()}
            >
              <Plus className="h-4 w-4" />
              Seleccionar archivo (PDF/JPG/PNG)
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <HelpText>{PORTAL_HELP.certificateFormFile}</HelpText>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Guardar
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string
  value: number
  variant: 'success' | 'warning' | 'destructive'
}) {
  const color =
    variant === 'success'
      ? 'var(--status-success)'
      : variant === 'warning'
        ? 'var(--status-warning)'
        : 'var(--status-error)'

  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-2xl font-bold" style={{ color }}>
          {value}
        </p>
        <p className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
          {label}
        </p>
      </CardContent>
    </Card>
  )
}
