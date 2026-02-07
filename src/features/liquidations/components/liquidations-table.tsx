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
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, Eye } from 'lucide-react'
import { getStatusConfig, formatAmount } from '@/lib/liquidation-utils'
import { formatDate } from '@/lib/certificate-utils'
import { useNavigate } from 'react-router-dom'

interface LiquidationsTableProps {
  data: Liquidation[]
  loading: boolean
}

export function LiquidationsTable({ data, loading }: LiquidationsTableProps) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return data
    return data.filter((l) => l.status === statusFilter)
  }, [data, statusFilter])

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

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: 'var(--g-text-secondary)' }}
          />
          <Input
            placeholder="Buscar liquidación..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
            aria-label="Buscar liquidaciones"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
          aria-label="Filtrar por estado"
        >
          <option value="all">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="pending_approval">Pendiente aprobación</option>
          <option value="approved">Aprobada</option>
          <option value="payment_requested">Pago solicitado</option>
          <option value="paid">Pagada</option>
          <option value="rejected">Rechazada</option>
        </Select>
      </div>

      {/* Table */}
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
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center"
                  style={{ color: 'var(--g-text-secondary)' }}
                >
                  No hay liquidaciones
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
                    <td
                      key={cell.id}
                      className="px-4 py-3"
                      style={{ color: 'var(--g-text-primary)' }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
            {filteredData.length} liquidaciones
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function SortButton({
  column,
  children,
}: {
  column: { toggleSorting: (d?: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' }
  children: React.ReactNode
}) {
  return (
    <button
      className="flex items-center gap-1 font-medium"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      type="button"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  )
}
