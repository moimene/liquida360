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
import type { Correspondent } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface CorrespondentsTableProps {
  data: Correspondent[]
  loading: boolean
}

export function CorrespondentsTable({ data, loading }: CorrespondentsTableProps) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<Correspondent>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortButton column={column}>Nombre</SortButton>,
        cell: ({ row }) => (
          <span className="font-medium" style={{ color: 'var(--g-text-primary)' }}>
            {row.getValue('name')}
          </span>
        ),
      },
      {
        accessorKey: 'country',
        header: ({ column }) => <SortButton column={column}>País</SortButton>,
      },
      {
        accessorKey: 'tax_id',
        header: 'NIF / Tax ID',
        cell: ({ row }) => (
          <code
            className="px-2 py-0.5 text-xs"
            style={{
              backgroundColor: 'var(--g-surface-muted)',
              borderRadius: 'var(--g-radius-sm)',
              color: 'var(--g-text-primary)',
            }}
          >
            {row.getValue('tax_id')}
          </code>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => row.getValue('email') || '—',
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => {
          const status = row.getValue('status') as string
          return (
            <Badge
              variant={
                status === 'active'
                  ? 'success'
                  : status === 'pending_approval'
                    ? 'warning'
                    : 'secondary'
              }
            >
              {status === 'active'
                ? 'Activo'
                : status === 'pending_approval'
                  ? 'Pendiente'
                  : 'Inactivo'}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/correspondents/${row.original.id}`)}
            aria-label={`Ver detalle de ${row.original.name}`}
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
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 15 },
    },
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: 'var(--g-text-secondary)' }}
        />
        <Input
          placeholder="Buscar corresponsal..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-9"
          aria-label="Buscar corresponsales"
        />
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
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                style={{ borderBottom: '1px solid var(--g-border-default)' }}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium"
                    style={{
                      color: 'var(--g-text-secondary)',
                      fontSize: 'var(--g-text-small)',
                      backgroundColor: 'var(--g-surface-muted)',
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                  {globalFilter
                    ? 'No se encontraron corresponsales con ese criterio'
                    : 'No hay corresponsales registrados'}
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
                  onClick={() => navigate(`/correspondents/${row.original.id}`)}
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
            {table.getFilteredRowModel().rows.length} corresponsales
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Página siguiente"
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
  column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' }
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
