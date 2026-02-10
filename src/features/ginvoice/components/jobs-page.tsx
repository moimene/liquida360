import { useEffect, useState, useMemo, useRef } from 'react'
import { useGInvJobs } from '../hooks/use-ginv-jobs'
import { JobForm } from './job-form'
import { UTTAI_STATUS_CONFIG } from '../constants/ginvoice-utils'
import { jobSchema, type JobFormData } from '../schemas/job-schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Upload, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function JobsPage() {
  const { jobs, loading, fetchJobs, createJob, importJobsCsv } = useGInvJobs()
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const filtered = useMemo(() => {
    if (!search) return jobs
    const q = search.toLowerCase()
    return jobs.filter(
      (j) =>
        j.job_code.toLowerCase().includes(q) ||
        j.client_code.toLowerCase().includes(q) ||
        j.client_name.toLowerCase().includes(q),
    )
  }, [jobs, search])

  async function handleCreate(data: JobFormData) {
    setSubmitting(true)
    const { error } = await createJob(data)
    setSubmitting(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Job creado correctamente')
    setFormOpen(false)
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const lines = text.split('\n').filter((l) => l.trim())
    if (lines.length < 2) {
      toast.error('El CSV debe tener al menos una fila de datos')
      return
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const jobCodeIdx = headers.indexOf('job_code')
    const clientCodeIdx = headers.indexOf('client_code')
    const clientNameIdx = headers.indexOf('client_name')

    if (jobCodeIdx === -1 || clientCodeIdx === -1 || clientNameIdx === -1) {
      toast.error('El CSV debe tener columnas: job_code, client_code, client_name')
      return
    }

    const rows: JobFormData[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim())
      const parsed = jobSchema.safeParse({
        job_code: cols[jobCodeIdx] ?? '',
        client_code: cols[clientCodeIdx] ?? '',
        client_name: cols[clientNameIdx] ?? '',
      })
      if (parsed.success) {
        rows.push(parsed.data)
      }
    }

    if (rows.length === 0) {
      toast.error('No se encontraron filas válidas en el CSV')
      return
    }

    const { imported, errors } = await importJobsCsv(rows)
    if (imported > 0) toast.success(`${imported} jobs importados`)
    if (errors.length > 0) toast.error(`${errors.length} errores: ${errors[0]}`)

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Jobs / Clientes
          </h1>
          <p style={{ color: 'var(--g-text-secondary)' }}>
            Catálogo maestro de jobs y clientes
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCsvImport}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Job
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--g-text-tertiary)' }} />
        <Input
          placeholder="Buscar por código o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: 'var(--g-surface-card)',
          borderRadius: 'var(--g-radius-lg)',
          border: '1px solid var(--g-border-default)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--g-brand-3308)' }} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Job Code</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Cliente</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Código cliente</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>UTTAI</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8" style={{ color: 'var(--g-text-tertiary)' }}>
                    {search ? 'Sin resultados para esta búsqueda' : 'No hay jobs registrados'}
                  </td>
                </tr>
              ) : (
                filtered.map((job) => {
                  const uttai = UTTAI_STATUS_CONFIG[job.uttai_status] ?? UTTAI_STATUS_CONFIG.clear
                  return (
                    <tr
                      key={job.id}
                      style={{ borderBottom: '1px solid var(--g-border-default)' }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {job.job_code}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--g-text-primary)' }}>
                        {job.client_name}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>
                        {job.client_code}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium"
                          style={{
                            color: uttai.color,
                            backgroundColor: uttai.bg,
                            borderRadius: 'var(--g-radius-full)',
                          }}
                        >
                          {uttai.icon} {uttai.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-medium capitalize"
                          style={{ color: job.status === 'active' ? 'var(--status-success)' : 'var(--g-text-tertiary)' }}
                        >
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <JobForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        submitting={submitting}
      />
    </div>
  )
}
