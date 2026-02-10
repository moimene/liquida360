import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGInvVendors } from '../hooks/use-ginv-vendors'
import { COMPLIANCE_STATUS_CONFIG, VENDOR_DOC_TYPE_LABELS } from '../constants/ginvoice-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Loader2, Plus, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, differenceInDays, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import type { GInvVendor, GInvVendorDocument } from '@/types'

type DocType = 'tax_residency_certificate' | 'partners_letter' | 'other'

export function VendorCompliancePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { vendorDocuments, fetchVendorDocuments, addVendorDocument } = useGInvVendors()
  const [vendor, setVendor] = useState<GInvVendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  // Form state for new document
  const [docType, setDocType] = useState<DocType>('tax_residency_certificate')
  const [issuedAt, setIssuedAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('ginv_vendors')
        .select('*')
        .eq('id', id!)
        .single()

      if (cancelled) return

      if (error || !data) {
        toast.error('Proveedor no encontrado')
        navigate('/g-invoice/vendors')
        return
      }
      setVendor(data)
      await fetchVendorDocuments(id!)
      if (!cancelled) setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [id, fetchVendorDocuments, navigate])

  async function handleAddDocument() {
    if (!id) return
    setSubmitting(true)

    let filePath: string | null = null

    if (file) {
      const ext = file.name.split('.').pop()
      const uid = crypto.randomUUID()
      const path = `vendors/${id}/${uid}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('ginv-documents')
        .upload(path, file)

      if (uploadError) {
        toast.error(`Error subiendo archivo: ${uploadError.message}`)
        setSubmitting(false)
        return
      }
      filePath = path
    }

    const { error } = await addVendorDocument({
      vendor_id: id,
      doc_type: docType,
      issued_at: issuedAt || null,
      expires_at: expiresAt || null,
      file_path: filePath,
    })

    setSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('Documento registrado')
    setDialogOpen(false)
    resetForm()
    // Recalculate compliance status based on documents
    await recalcCompliance(id)
  }

  async function recalcCompliance(vendorId: string) {
    // Refetch docs, then determine status
    await fetchVendorDocuments(vendorId)
    const docs = useGInvVendors.getState().vendorDocuments
    const taxCert = docs.find((d) => d.doc_type === 'tax_residency_certificate')

    type ComplianceStatus = 'compliant' | 'expiring_soon' | 'non_compliant'
    let newStatus: ComplianceStatus = 'non_compliant'
    if (taxCert?.expires_at) {
      const daysLeft = differenceInDays(new Date(taxCert.expires_at), new Date())
      if (daysLeft > 30) {
        newStatus = 'compliant'
      } else if (daysLeft > 0) {
        newStatus = 'expiring_soon'
      } else {
        newStatus = 'non_compliant'
      }
    }

    const { error } = await supabase
      .from('ginv_vendors')
      .update({ compliance_status: newStatus })
      .eq('id', vendorId)

    if (!error && vendor) {
      setVendor({ ...vendor, compliance_status: newStatus })
    }
  }

  function resetForm() {
    setDocType('tax_residency_certificate')
    setIssuedAt('')
    setExpiresAt('')
    setFile(null)
  }

  function getDocStatusIndicator(doc: GInvVendorDocument) {
    if (!doc.expires_at) return null
    const expiryDate = new Date(doc.expires_at)
    if (isPast(expiryDate)) {
      return (
        <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--status-error)' }}>
          <AlertTriangle className="h-3 w-3" />
          Vencido
        </span>
      )
    }
    const daysLeft = differenceInDays(expiryDate, new Date())
    if (daysLeft <= 30) {
      return (
        <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--status-warning)' }}>
          <AlertTriangle className="h-3 w-3" />
          {daysLeft}d restantes
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--status-success)' }}>
        <CheckCircle2 className="h-3 w-3" />
        Vigente
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--g-brand-3308)' }} />
      </div>
    )
  }

  if (!vendor) return null

  const compliance = COMPLIANCE_STATUS_CONFIG[vendor.compliance_status] ?? COMPLIANCE_STATUS_CONFIG.non_compliant

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/g-invoice/vendors')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            {vendor.name}
          </h1>
          <p className="flex items-center gap-3 mt-1" style={{ color: 'var(--g-text-secondary)' }}>
            <span>NIF: {vendor.tax_id}</span>
            <span>·</span>
            <span>{vendor.country}</span>
          </p>
        </div>
        <span
          className="inline-flex px-3 py-1 text-sm font-medium"
          style={{
            color: compliance.color,
            backgroundColor: compliance.bg,
            borderRadius: 'var(--g-radius-full)',
          }}
        >
          {compliance.label}
        </span>
      </div>

      {/* Documents section */}
      <div className="flex items-center justify-between">
        <h2
          className="font-semibold"
          style={{ fontSize: 'var(--g-text-h3)', color: 'var(--g-text-primary)' }}
        >
          Documentos de compliance
        </h2>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Añadir documento
        </Button>
      </div>

      <div
        style={{
          backgroundColor: 'var(--g-surface-card)',
          borderRadius: 'var(--g-radius-lg)',
          border: '1px solid var(--g-border-default)',
          overflow: 'hidden',
        }}
      >
        {vendorDocuments.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <FileText className="h-8 w-8" style={{ color: 'var(--g-text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--g-text-tertiary)' }}>
              No hay documentos registrados
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Tipo</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Emitido</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Vencimiento</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Estado</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Archivo</th>
              </tr>
            </thead>
            <tbody>
              {vendorDocuments.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--g-text-primary)' }}>
                    {VENDOR_DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>
                    {doc.issued_at ? format(new Date(doc.issued_at), 'dd MMM yyyy', { locale: es }) : '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>
                    {doc.expires_at ? format(new Date(doc.expires_at), 'dd MMM yyyy', { locale: es }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {getDocStatusIndicator(doc) ?? <span style={{ color: 'var(--g-text-tertiary)' }}>—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {doc.file_path ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const { data } = await supabase.storage
                            .from('ginv-documents')
                            .createSignedUrl(doc.file_path!, 300)
                          if (data?.signedUrl) window.open(data.signedUrl, '_blank')
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--g-text-tertiary)' }}>Sin archivo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add document dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Añadir documento">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--g-text-primary)' }}>Tipo de documento</label>
            <Select value={docType} onChange={(e) => setDocType(e.target.value as DocType)}>
              {Object.entries(VENDOR_DOC_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--g-text-primary)' }}>Fecha emisión</label>
              <Input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--g-text-primary)' }}>Fecha vencimiento</label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--g-text-primary)' }}>Archivo (PDF)</label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAddDocument} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
