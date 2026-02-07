import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import type { Liquidation } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SortButton } from '@/components/ui/sort-button'
import { TableToolbar } from '@/components/ui/table-toolbar'
import { EmptyState } from '@/components/ui/empty-state'
import { type DateRange, filterByDateRange } from '@/components/ui/date-range-filter'
import { exportTableToCsv, csvFilename, type CsvColumn } from '@/lib/csv-export'
import { ChevronLeft, ChevronRight, Eye, Receipt } from 'lucide-react'
import { getStatusConfig, formatAmount } from '@/lib/liquidation-utils'
import { formatDate } from '@/lib/certificate-utils'
import { useNavigate } from 'react-router-dom'

interface LiquidationsTableProps {
  data: Liquidation[]
  loading: boolean
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'pending_approval', label: 'Pendiente aprobación' },
  { value: 'approved', label: 'Aprobada' },
  { value: 'payment_requested', label: 'Pago solicitado' },
  { value: 'paid', label: 'Pagada' },
  { value: 'rejected', label: 'Rechazada' },
]

const csvColumns: CsvColumn<Liquidation>[] = [
  {
    header: 'Corresponsal',
    accessor: (row) =>
      (row as Liquidation & { correspondents?: { name: string } }).correspondents?.name ?? '',
  },
  { header: 'Importe', accessor: 'amount' },
  { header: 'Divisa', accessor: 'currency' },
  { header: 'Concepto', accessor: (row) => row.concept ?? '' },
  { header: 'Referencia', accessor: (row) => row.reference ?? '' },
  { header: 'Estado', accessor: (row) => getStatusConfig(row.status).label },
  { header: 'Fecha', accessor: (row) => formatDate(row.created_at) },
]

export function LiquidationsTable({ data, loading }: LiquidationsTableProps) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })

  const filteredData = useMemo(() => {
    let result = data
    if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter)
    }
    result = filterByDateRange(result, dateRange, (l) => l.created_at)
    return result
  }, [data, statusFilter, dateRange])

  const columns = useMemo<ColumnDef<Liquidation>[]>(
    () => [
      {
        accessorKey: 'correspondents',
        header: 'Corresponsal',
        cell: ({ row }) => {
          const l = row.original as Liquidation & { correspondents?: { name: string } }
          return (
            <span className="font-medium" style={{ color: 'var(--g-text-primary)' }}>
              {l.correspondents?.name ?? '—'}
            </span>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => <SortButton column={column}>Importe</SortButton>,
        cell: ({ row }) => (
          <span className="font-bold" style={{ color: 'var(--g-brand-3308)' }}>
            {formatAmount(row.original.amount, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: 'concept',
        header: 'Concepto',
        cell: ({ row }) => (
          <span className="truncate max-w-[200px] block" title={row.getValue('concept')}>
            {row.getValue('concept')}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => {
          const config = getStatusConfig(row.getValue('status'))
          return <Badge variant={config.badgeVariant}>{config.label}</Badge>
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <SortButton column={column}>Fecha</SortButton>,
        cell: ({ row }) => formatDate(row.getValue('created_at')),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/liquidations/${row.original.id}`)}
            aria-label="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [navigate],
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  })

  function handleExport() {
    exportTableToCsv(filteredData, csvColumns, csvFilename('liquidaciones'))
  }

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        searchPlaceholder="Buscar liquidación..."
        statusOptions={STATUS_OPTIONS}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExport={handleExport}
        totalRecords={filteredData.length}
        recordLabel="liquidaciones"
      />

      <div
        className="overflow-auto"
        style={{
          border: '1px solid var(--g-border-default)',
          borderRadius: 'var(--g-radius-lg)',
          backgroundColor: 'var(--g-surface-card)',
        }}
      >
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-4 py-3 text-left font-medium"
                    style={{
                      color: 'var(--g-text-secondary)',
                      fontSize: 'var(--g-text-small)',
                      backgroundColor: 'var(--g-surface-muted)',
                    }}
                  >
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="skeleton h-4 w-3/4 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={Receipt}
                    title="No hay liquidaciones"
                    description={
                      globalFilter || statusFilter !== 'all' || dateRange.from || dateRange.to
                        ? 'No se encontraron liquidaciones con los filtros aplicados'
                        : 'Las liquidaciones creadas aparecerán aquí'
                    }
                  />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: '1px solid var(--g-border-default)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--g-surface-muted)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  onClick={() => navigate(`/liquidations/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3" style={{ color: 'var(--g-text-primary)' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
