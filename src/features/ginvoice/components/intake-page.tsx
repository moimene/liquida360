import { useEffect, useState, useMemo } from 'react'
import { useGInvIntake } from '../hooks/use-ginv-intake'
import { IntakeForm } from './intake-form'
import { INTAKE_STATUS_CONFIG, INTAKE_TYPE_LABELS } from '../constants/ginvoice-utils'
import { useAuth } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Plus, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { IntakeFormData } from '../schemas/intake-schema'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function IntakePage() {
  const { items, loading, fetchItems, createItem } = useGInvIntake()
  const { user } = useAuth()
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [pendingFile, setPendingFile] = useState<File | undefined>()

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const filtered = useMemo(() => {
    let result = items
    if (statusFilter !== 'all') {
      result = result.filter((i) => i.status === statusFilter)
    }
    if (typeFilter !== 'all') {
      result = result.filter((i) => i.type === typeFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (i) =>
          (i.invoice_number ?? '').toLowerCase().includes(q) ||
          (i.concept_text ?? '').toLowerCase().includes(q),
      )
    }
    return result
  }, [items, statusFilter, typeFilter, search])

  async function handleCreate(data: IntakeFormData) {
    if (!user) return
    setSubmitting(true)
    const { error } = await createItem(data, user.id, pendingFile)
    setSubmitting(false)
    setPendingFile(undefined)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Item registrado correctamente')
    setFormOpen(false)
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    items.forEach((i) => {
      counts[i.status] = (counts[i.status] ?? 0) + 1
    })
    return counts
  }, [items])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Ingesta Digital
          </h1>
          <p style={{ color: 'var(--g-text-secondary)' }}>
            Facturas de proveedor y tasas oficiales
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Ingesta
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['draft', 'submitted', 'pending_approval', 'posted'] as const).map((status) => {
          const config = INTAKE_STATUS_CONFIG[status]
          return (
            <div
              key={status}
              className="p-4"
              style={{
                backgroundColor: 'var(--g-surface-card)',
                borderRadius: 'var(--g-radius-lg)',
                border: '1px solid var(--g-border-default)',
              }}
            >
              <div className="text-2xl font-bold" style={{ color: config.color }}>
                {statusCounts[status] ?? 0}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--g-text-secondary)' }}>
                {config.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--g-text-tertiary)' }} />
          <Input
            placeholder="Buscar por nº factura o concepto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[180px]"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(INTAKE_STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </Select>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-[180px]"
        >
          <option value="all">Todos los tipos</option>
          <option value="vendor_invoice">Factura proveedor</option>
          <option value="official_fee">Tasa oficial</option>
        </Select>
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
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Tipo</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Nº Factura</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Importe</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Concepto</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Estado</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Creado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8" style={{ color: 'var(--g-text-tertiary)' }}>
                    {search || statusFilter !== 'all' || typeFilter !== 'all'
                      ? 'Sin resultados para estos filtros'
                      : 'No hay items de ingesta'}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const statusConfig = INTAKE_STATUS_CONFIG[item.status] ?? INTAKE_STATUS_CONFIG.draft
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium" style={{ color: 'var(--g-text-primary)' }}>
                          {INTAKE_TYPE_LABELS[item.type] ?? item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {item.invoice_number || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: item.currency }).format(item.amount)}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: 'var(--g-text-secondary)' }}>
                        {item.concept_text || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-0.5 text-xs font-medium"
                          style={{
                            color: statusConfig.color,
                            backgroundColor: statusConfig.bg,
                            borderRadius: 'var(--g-radius-full)',
                          }}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-tertiary)' }}>
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <IntakeForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setPendingFile(undefined)
        }}
        onSubmit={handleCreate}
        onFileChange={setPendingFile}
        submitting={submitting}
      />
    </div>
  )
}
