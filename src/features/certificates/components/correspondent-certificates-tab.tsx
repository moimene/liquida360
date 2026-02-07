import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, FileCheck, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useCertificates } from '../hooks/use-certificates'
import { CertificateForm } from './certificate-form'
import { getCertificateStatus, formatDate } from '@/lib/certificate-utils'
import { COUNTRIES } from '@/lib/countries'
import type { Correspondent } from '@/types'
import type { CertificateFormData } from '../schemas/certificate-schema'

interface CorrespondentCertificatesTabProps {
  correspondent: Correspondent
  allCorrespondents: Correspondent[]
}

export function CorrespondentCertificatesTab({
  correspondent,
  allCorrespondents,
}: CorrespondentCertificatesTabProps) {
  const { certificates, loading, fetchByCorrespondent, createCertificate, deleteCertificate } =
    useCertificates()
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | undefined>()

  useEffect(() => {
    fetchByCorrespondent(correspondent.id)
  }, [correspondent.id, fetchByCorrespondent])

  async function handleCreate(data: CertificateFormData) {
    setSubmitting(true)
    const { error } = await createCertificate(data, selectedFile)
    setSubmitting(false)
    setSelectedFile(undefined)

    if (error) {
      toast.error('Error al crear certificado', { description: error })
    } else {
      toast.success('Certificado registrado')
      fetchByCorrespondent(correspondent.id)
    }
  }

  async function handleDelete(id: string) {
    const { error } = await deleteCertificate(id)
    if (error) {
      toast.error('Error al eliminar', { description: error })
    } else {
      toast.success('Certificado eliminado')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="skeleton h-24 w-full rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
          {certificates.length} certificado{certificates.length !== 1 ? 's' : ''} registrado
          {certificates.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Añadir certificado
        </Button>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileCheck
              className="mx-auto h-10 w-10 mb-3"
              style={{ color: 'var(--g-text-secondary)' }}
            />
            <p style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-body)' }}>
              No hay certificados registrados para este corresponsal
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {certificates.map((cert) => {
            const info = getCertificateStatus(cert.expiry_date)
            const country = COUNTRIES.find((c) => c.code === cert.issuing_country)

            return (
              <Card key={cert.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-10 w-10 items-center justify-center shrink-0"
                        style={{
                          backgroundColor: 'var(--g-sec-100)',
                          borderRadius: 'var(--g-radius-md)',
                        }}
                      >
                        <FileCheck className="h-5 w-5" style={{ color: 'var(--g-brand-3308)' }} />
                      </div>
                      <div>
                        <p
                          className="font-medium text-sm"
                          style={{ color: 'var(--g-text-primary)' }}
                        >
                          {country?.name ?? cert.issuing_country}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                          Emitido: {formatDate(cert.issue_date)} · Vence:{' '}
                          {formatDate(cert.expiry_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={info.badgeVariant}>{info.label}</Badge>
                      {cert.document_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(cert.document_url!, '_blank')}
                          aria-label="Ver documento"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cert.id)}
                        aria-label="Eliminar certificado"
                      >
                        <Trash2 className="h-4 w-4" style={{ color: 'var(--status-error)' }} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CertificateForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setSelectedFile(undefined)
        }}
        onSubmit={handleCreate}
        correspondents={allCorrespondents}
        loading={submitting}
        preselectedCorrespondentId={correspondent.id}
        onFileSelect={setSelectedFile}
      />
    </div>
  )
}
