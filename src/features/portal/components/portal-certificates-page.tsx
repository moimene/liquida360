import { useEffect, useMemo, useState, useRef } from 'react'
import { toast } from 'sonner'
import { Plus, FileCheck, Upload, X, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/features/auth'
import { usePortalCorrespondent } from '../hooks/use-portal-correspondent'
import { usePortalCertificates } from '../hooks/use-portal-certificates'
import { getCertificateStatus, formatDate, getDefaultExpiryDate } from '@/lib/certificate-utils'
import { COUNTRIES } from '@/lib/countries'
import type { Certificate } from '@/types'

export function PortalCertificatesPage() {
  const user = useAuth((s) => s.user)
  const { correspondent, fetchCorrespondent } = usePortalCorrespondent()
  const { certificates, loading, fetchCertificates, uploadCertificate } = usePortalCertificates()
  const [formOpen, setFormOpen] = useState(false)

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

  const stats = useMemo(() => {
    const valid = certificates.filter(
      (c) => getCertificateStatus(c.expiry_date).status === 'valid',
    ).length
    const expiringSoon = certificates.filter(
      (c) => getCertificateStatus(c.expiry_date).status === 'expiring_soon',
    ).length
    const expired = certificates.filter(
      (c) => getCertificateStatus(c.expiry_date).status === 'expired',
    ).length
    return { valid, expiringSoon, expired }
  }, [certificates])

  async function handleUpload(
    issuingCountry: string,
    issueDate: string,
    expiryDate: string,
    file?: File,
  ) {
    if (!correspondent?.id) return

    const { error } = await uploadCertificate(
      correspondent.id,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Certificados de residencia fiscal
          </h1>
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Gestiona tus certificados de residencia fiscal
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo certificado
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Vigentes" value={stats.valid} variant="success" />
        <StatCard label="Proximos a vencer" value={stats.expiringSoon} variant="warning" />
        <StatCard label="Vencidos" value={stats.expired} variant="destructive" />
      </div>

      {/* Certificates list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <span style={{ color: 'var(--g-text-secondary)' }}>Cargando certificados...</span>
        </div>
      ) : certificates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <FileCheck className="h-12 w-12" style={{ color: 'var(--g-text-secondary)' }} />
            <p style={{ color: 'var(--g-text-secondary)' }}>
              No tienes certificados. Sube tu primer certificado de residencia fiscal.
            </p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Subir certificado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} />
          ))}
        </div>
      )}

      <CertificateUploadDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onUpload={handleUpload}
        defaultCountry={correspondent?.country ?? ''}
      />
    </div>
  )
}

/* -- Certificate Card -- */

function CertificateCard({ certificate }: { certificate: Certificate }) {
  const statusInfo = getCertificateStatus(certificate.expiry_date)
  const countryName =
    COUNTRIES.find((c) => c.code === certificate.issuing_country)?.name ??
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

/* -- Upload Dialog -- */

function CertificateUploadDialog({
  open,
  onOpenChange,
  onUpload,
  defaultCountry,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (country: string, issueDate: string, expiryDate: string, file?: File) => Promise<void>
  defaultCountry: string
}) {
  const [country, setCountry] = useState(defaultCountry)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [expiryDate, setExpiryDate] = useState(getDefaultExpiryDate(new Date().toISOString().split('T')[0]))
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (defaultCountry && !country) {
      setCountry(defaultCountry)
    }
  }, [defaultCountry, country])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!country || !issueDate || !expiryDate) return

    setSubmitting(true)
    await onUpload(country, issueDate, expiryDate, file ?? undefined)
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
      title="Nuevo certificado de residencia fiscal"
      description="Sube un nuevo certificado de residencia fiscal con su documento adjunto."
    >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cert-country">Pais emisor</Label>
            <Select
              id="cert-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            >
              <option value="">Selecciona un pais</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
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
                onChange={(e) => {
                  setIssueDate(e.target.value)
                  setExpiryDate(getDefaultExpiryDate(e.target.value))
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
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Documento (PDF, JPG, PNG)</Label>
            {file ? (
              <div
                className="flex items-center justify-between p-3 text-sm"
                style={{
                  backgroundColor: 'var(--g-surface-muted)',
                  borderRadius: 'var(--g-radius-sm)',
                }}
              >
                <span className="truncate" style={{ color: 'var(--g-text-primary)' }}>
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                  className="shrink-0 ml-2"
                  style={{ color: 'var(--g-text-secondary)' }}
                  aria-label="Eliminar archivo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed text-sm"
                style={{
                  borderColor: 'var(--g-border-default)',
                  borderRadius: 'var(--g-radius-md)',
                  color: 'var(--g-text-secondary)',
                }}
              >
                <Upload className="h-4 w-4" />
                Seleccionar archivo
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setFile(f)
              }}
              className="hidden"
              aria-hidden="true"
            />
          </div>

          <DialogFooter className="mt-2 -mx-6 -mb-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {submitting ? 'Subiendo...' : 'Subir certificado'}
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
  const colors = {
    success: 'var(--g-brand-3308)',
    warning: 'hsl(45, 93%, 47%)',
    destructive: 'hsl(0, 84%, 60%)',
  }
  const color = colors[variant]

  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <span className="text-2xl font-bold" style={{ color }}>
          {value}
        </span>
        <span className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
          {label}
        </span>
      </CardContent>
    </Card>
  )
}
