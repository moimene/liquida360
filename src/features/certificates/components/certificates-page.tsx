import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InfoPanel } from '@/components/ui/info-panel'
import { CERTIFICATES_HELP } from '../constants/help-texts'
import { useCertificates } from '../hooks/use-certificates'
import { useCorrespondents } from '@/features/correspondents'
import { CertificatesTable } from './certificates-table'
import { CertificateForm } from './certificate-form'
import { ExpiryPanel } from './expiry-panel'
import type { CertificateFormData } from '../schemas/certificate-schema'

export function CertificatesPage() {
  const { certificates, loading, fetchCertificates, createCertificate } = useCertificates()
  const { correspondents, fetchCorrespondents } = useCorrespondents()
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | undefined>()

  useEffect(() => {
    fetchCertificates()
    fetchCorrespondents()
  }, [fetchCertificates, fetchCorrespondents])

  async function handleCreate(data: CertificateFormData) {
    setSubmitting(true)
    const { error } = await createCertificate(data, selectedFile)
    setSubmitting(false)
    setSelectedFile(undefined)

    if (error) {
      toast.error('Error al crear certificado', { description: error })
    } else {
      toast.success('Certificado registrado correctamente')
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Certificados de Residencia Fiscal
          </h2>
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Gestiona los certificados y controla su vigencia
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/certificates/verification-guide">
            <Button variant="outline">
              <BookOpen className="h-4 w-4" />
              Guia de verificacion
            </Button>
          </Link>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo certificado
          </Button>
        </div>
      </div>

      <InfoPanel variant="info" dismissible dismissKey="certificates-info">{CERTIFICATES_HELP.pageInfoPanel}</InfoPanel>

      {/* Expiry alerts */}
      <ExpiryPanel certificates={certificates} />

      {/* Table */}
      <CertificatesTable data={certificates} loading={loading} />

      {/* Form */}
      <CertificateForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setSelectedFile(undefined)
        }}
        onSubmit={handleCreate}
        correspondents={correspondents}
        loading={submitting}
        onFileSelect={setSelectedFile}
      />
    </div>
  )
}
