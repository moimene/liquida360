import { useEffect, useState, useMemo, useCallback } from 'react'
import { useGInvIntake } from '../hooks/use-ginv-intake'
import { useGInvJobs } from '../hooks/use-ginv-jobs'
import { IntakeForm } from './intake-form'
import { INTAKE_STATUS_CONFIG, INTAKE_TYPE_LABELS } from '../constants/ginvoice-utils'
import { useAuth } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Plus, Search, Loader2, Download, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import type { IntakeFormData } from '../schemas/intake-schema'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { GInvIntakeItem } from '@/types'
import { exportTableToXlsx, xlsxFilename } from '@/lib/xlsx-export'

type IntakeSortField =
  | 'created_at'
  | 'amount'
  | 'reference'
  | 'job_code'
  | 'client_name'
  | 'client_country'
  | 'status'
  | 'type'

type SortDirection = 'asc' | 'desc'

const INTAKE_SORT_OPTIONS: Array<{ value: IntakeSortField; label: string }> = [
  { value: 'created_at', label: 'Fecha de creación' },
  { value: 'amount', label: 'Importe' },
  { value: 'reference', label: 'No. Factura / NRC' },
  { value: 'job_code', label: 'Job' },
  { value: 'client_name', label: 'Cliente' },
  { value: 'client_country', label: 'País del cliente' },
  { value: 'status', label: 'Estado' },
  { value: 'type', label: 'Tipo' },
]

function compareValues(a: number | string, b: number | string): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'es', { sensitivity: 'base' })
}

export function IntakePage() {
  const { items, loading, fetchItems, createItem, submitItem, approveItem, rejectItem } = useGInvIntake()
  const { jobs, fetchJobs } = useGInvJobs()
  const { user, ginvRole } = useAuth()
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [primarySort, setPrimarySort] = useState<IntakeSortField>('created_at')
  const [primaryDirection, setPrimaryDirection] = useState<SortDirection>('desc')
  const [secondarySort, setSecondarySort] = useState<IntakeSortField>('amount')
  const [secondaryDirection, setSecondaryDirection] = useState<SortDirection>('desc')
  const [pendingFile, setPendingFile] = useState<File | undefined>()

  useEffect(() => {
    fetchItems()
    fetchJobs()
  }, [fetchItems, fetchJobs])

  const jobsById = useMemo(() => new Map(jobs.map((job) => [job.id, job])), [jobs])

  const getSortValue = useCallback((item: GInvIntakeItem, field: IntakeSortField): number | string => {
    const job = item.job_id ? jobsById.get(item.job_id) : undefined
    switch (field) {
      case 'created_at':
        return new Date(item.created_at).getTime()
      case 'amount':
        return item.amount
      case 'reference':
        return (item.type === 'official_fee'
          ? item.nrc_number || item.invoice_number || ''
          : item.invoice_number || '').toLowerCase()
      case 'job_code':
        return (job?.job_code ?? '').toLowerCase()
      case 'client_name':
        return (job?.client_name ?? '').toLowerCase()
      case 'client_country':
        return (job?.client_country ?? '').toLowerCase()
      case 'status':
        return item.status
      case 'type':
        return INTAKE_TYPE_LABELS[item.type] ?? item.type
    }
  }, [jobsById])

  const compareByField = useCallback((
    left: GInvIntakeItem,
    right: GInvIntakeItem,
    field: IntakeSortField,
    direction: SortDirection,
  ): number => {
    const base = compareValues(getSortValue(left, field), getSortValue(right, field))
    return direction === 'asc' ? base : base * -1
  }, [getSortValue])

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
          (i.nrc_number ?? '').toLowerCase().includes(q) ||
          (i.official_organism ?? '').toLowerCase().includes(q) ||
          (i.concept_text ?? '').toLowerCase().includes(q) ||
          (i.job_id ? (jobsById.get(i.job_id)?.job_code ?? '').toLowerCase().includes(q) : false) ||
          (i.job_id ? (jobsById.get(i.job_id)?.client_name ?? '').toLowerCase().includes(q) : false) ||
          (i.job_id ? (jobsById.get(i.job_id)?.client_country ?? '').toLowerCase().includes(q) : false),
      )
    }
    return [...result].sort((left, right) => {
      const primary = compareByField(left, right, primarySort, primaryDirection)
      if (primary !== 0) return primary
      const secondary = compareByField(left, right, secondarySort, secondaryDirection)
      if (secondary !== 0) return secondary
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    })
  }, [
    items,
    statusFilter,
    typeFilter,
    search,
    jobsById,
    primarySort,
    primaryDirection,
    secondarySort,
    secondaryDirection,
    compareByField,
  ])

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

  async function handleExportXlsx() {
    if (filtered.length === 0) {
      toast.error('No hay subidas para exportar')
      return
    }

    try {
      await exportTableToXlsx(
        filtered,
        [
          { header: 'Tipo', accessor: (item) => INTAKE_TYPE_LABELS[item.type] ?? item.type },
          { header: 'No. Factura / NRC', accessor: (item) => item.type === 'official_fee' ? item.nrc_number || item.invoice_number || '' : item.invoice_number || '' },
          { header: 'Job', accessor: (item) => (item.job_id ? jobsById.get(item.job_id)?.job_code ?? '' : '') },
          { header: 'Cliente', accessor: (item) => (item.job_id ? jobsById.get(item.job_id)?.client_name ?? '' : '') },
          { header: 'País cliente', accessor: (item) => (item.job_id ? jobsById.get(item.job_id)?.client_country ?? '' : '') },
          { header: 'Importe', accessor: (item) => item.amount },
          { header: 'Tipo cambio EUR', accessor: (item) => item.exchange_rate_to_eur ?? '' },
          { header: 'Importe EUR', accessor: (item) => item.amount_eur ?? '' },
          { header: 'Moneda', accessor: 'currency' },
          { header: 'Concepto', accessor: 'concept_text' },
          { header: 'Organismo', accessor: 'official_organism' },
          {
            header: 'Tarifa',
            accessor: (item) => item.tariff_type === 'special' ? 'Especial' : item.tariff_type === 'general' ? 'General' : '',
          },
          { header: 'Estado', accessor: (item) => INTAKE_STATUS_CONFIG[item.status]?.label ?? item.status },
          { header: 'Creado', accessor: (item) => new Date(item.created_at).toLocaleString('es-ES') },
        ],
        xlsxFilename('subidas'),
        'Subidas',
      )
      toast.success('Excel exportado')
    } catch {
      toast.error('No se pudo exportar el Excel')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Subidas
          </h1>
          <p style={{ color: 'var(--g-text-secondary)' }}>
            Facturas de proveedor y tasas oficiales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportXlsx} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Subida
          </Button>
        </div>
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
            placeholder="Buscar por factura, NRC, concepto o cliente..."
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
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4" style={{ color: 'var(--g-text-tertiary)' }} />
          <span className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>Orden</span>
        </div>
        <Select
          value={primarySort}
          onChange={(e) => setPrimarySort(e.target.value as IntakeSortField)}
          className="w-[220px]"
        >
          {INTAKE_SORT_OPTIONS.map((option) => (
            <option key={`primary-${option.value}`} value={option.value}>
              1o criterio: {option.label}
            </option>
          ))}
        </Select>
        <Select
          value={primaryDirection}
          onChange={(e) => setPrimaryDirection(e.target.value as SortDirection)}
          className="w-[180px]"
        >
          <option value="asc">1o ascendente</option>
          <option value="desc">1o descendente</option>
        </Select>
        <Select
          value={secondarySort}
          onChange={(e) => setSecondarySort(e.target.value as IntakeSortField)}
          className="w-[220px]"
        >
          {INTAKE_SORT_OPTIONS.map((option) => (
            <option key={`secondary-${option.value}`} value={option.value}>
              2o criterio: {option.label}
            </option>
          ))}
        </Select>
        <Select
          value={secondaryDirection}
          onChange={(e) => setSecondaryDirection(e.target.value as SortDirection)}
          className="w-[180px]"
        >
          <option value="asc">2o ascendente</option>
          <option value="desc">2o descendente</option>
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
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>No. Factura / NRC</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Job</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Cliente</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>País</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Importe</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>TC EUR</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Importe EUR</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Concepto</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Organismo / Tarifa</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Estado</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Creado</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-8" style={{ color: 'var(--g-text-tertiary)' }}>
                    {search || statusFilter !== 'all' || typeFilter !== 'all'
                      ? 'Sin resultados para estos filtros'
                      : 'No hay subidas registradas'}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const statusConfig = INTAKE_STATUS_CONFIG[item.status] ?? INTAKE_STATUS_CONFIG.draft
                  const job = item.job_id ? jobsById.get(item.job_id) : undefined
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium" style={{ color: 'var(--g-text-primary)' }}>
                          {INTAKE_TYPE_LABELS[item.type] ?? item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {item.type === 'official_fee'
                          ? item.nrc_number || item.invoice_number || '—'
                          : item.invoice_number || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {job?.job_code ?? '—'}
                      </td>
                      <td className="px-4 py-3 max-w-[220px] truncate" style={{ color: 'var(--g-text-secondary)' }}>
                        {job?.client_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                        {job?.client_country ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: item.currency }).format(item.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                        {item.exchange_rate_to_eur
                          ? new Intl.NumberFormat('es-ES', { minimumFractionDigits: 4, maximumFractionDigits: 6 }).format(item.exchange_rate_to_eur)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {typeof item.amount_eur === 'number'
                          ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.amount_eur)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: 'var(--g-text-secondary)' }}>
                        {item.concept_text || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                        {item.type === 'official_fee'
                          ? `${item.official_organism ?? '—'} / ${item.tariff_type === 'special' ? 'Especial' : item.tariff_type === 'general' ? 'General' : '—'}`
                          : '—'}
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
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {ginvRole === 'ginv_operador' && item.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const { error } = await submitItem(item.id)
                                if (error) toast.error(error)
                                else toast.success('Enviado a revisión')
                              }}
                            >
                              Enviar
                            </Button>
                          )}
                          {ginvRole === 'ginv_socio_aprobador' && item.status === 'submitted' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const { error } = await rejectItem(item.id)
                                  if (error) toast.error(error)
                                  else toast.success('Rechazado')
                                }}
                              >
                                Rechazar
                              </Button>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  const { error } = await approveItem(item.id)
                                  if (error) toast.error(error)
                                  else toast.success('Aprobado')
                                }}
                              >
                                Aprobar
                              </Button>
                            </>
                          )}
                        </div>
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
