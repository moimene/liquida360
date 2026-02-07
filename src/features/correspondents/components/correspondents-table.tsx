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
import { SortButton } from '@/components/ui/sort-button'
import { TableToolbar } from '@/components/ui/table-toolbar'
import { EmptyState } from '@/components/ui/empty-state'
import { exportTableToCsv, csvFilename, type CsvColumn } from '@/lib/csv-export'
import { ChevronLeft, ChevronRight, Eye, Users, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { UserRole } from '@/types'

interface CorrespondentsTableProps {
  data: Correspondent[]
  loading: boolean
  role?: UserRole | null
  onApprove?: (id: string) => void
  approvingId?: string | null
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'pending_approval', label: 'Pendiente' },
  { value: 'inactive', label: 'Inactivo' },
]

const csvColumns: CsvColumn<Correspondent>[] = [
  { header: 'Nombre', accessor: 'name' },
  { header: 'País', accessor: 'country' },
  { header: 'NIF/Tax ID', accessor: 'tax_id' },
  { header: 'Email', accessor: (row) => row.email ?? '' },
  { header: 'Estado', accessor: (row) => row.status === 'active' ? 'Activo' : row.status === 'pending_approval' ? 'Pendiente' : 'Inactivo' },
]

export function CorrespondentsTable({ data, loading, role, onApprove, approvingId }: CorrespondentsTableProps) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return data
    return data.filter((c) => c.status === statusFilter)
  }, [data, statusFilter])

  const columns = useMemo<ColumnDef<Correspondent>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortButton column={column}>Nombre</SortButton>,
        cell: ({ row }) => (<span className="font-medium" style={{ color: 'var(--g-text-primary)' }}>{row.getValue('name')}</span>),
      },
      {
        accessorKey: 'country',
        header: ({ column }) => <SortButton column={column}>País</SortButton>,
      },
      {
        accessorKey: 'tax_id',
        header: 'NIF / Tax ID',
        cell: ({ row }) => (
          <code className="px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--g-surface-muted)', borderRadius: 'var(--g-radius-sm)', color: 'var(--g-text-primary)' }}>
            {row.getValue('tax_id')}
          </code>
        ),
      },
      { accessorKey: 'email', header: 'Email', cell: ({ row }) => row.getValue('email') || '—' },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => {
          const status = row.getValue('status') as string
          return (
            <Badge variant={status === 'active' ? 'success' : status === 'pending_approval' ? 'warning' : 'secondary'}>
              {status === 'active' ? 'Activo' : status === 'pending_approval' ? 'Pendiente' : 'Inactivo'}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {row.original.status === 'pending_approval' && role === 'admin' && onApprove && (
              <Button
                size="sm"
                onClick={() => onApprove(row.original.id)}
                loading={approvingId === row.original.id}
                aria-label={`Aprobar a ${row.original.name}`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                Aprobar
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate(`/correspondents/${row.original.id}`)} aria-label={`Ver detalle de ${row.original.name}`}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [navigate, role, onApprove, approvingId],
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
    exportTableToCsv(filteredData, csvColumns, csvFilename('corresponsales'))
  }

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        searchPlaceholder="Buscar corresponsal..."
        statusOptions={STATUS_OPTIONS}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        onExport={handleExport}
        totalRecords={table.getFilteredRowModel().rows.length}
        recordLabel="corresponsales"
      />

      <div className="overflow-auto" style={{ border: '1px solid var(--g-border-default)', borderRadius: 'var(--g-radius-lg)', backgroundColor: 'var(--g-surface-card)' }}>
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)', backgroundColor: 'var(--g-surface-muted)' }}>
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
                  {columns.map((_, j) => (<td key={j} className="px-4 py-3"><div className="skeleton h-4 w-3/4 rounded" /></td>))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length}>
                <EmptyState icon={Users} title={globalFilter || statusFilter !== 'all' ? 'No se encontraron corresponsales con ese criterio' : 'No hay corresponsales registrados'} description="Los corresponsales aparecerán aquí cuando se registren" />
              </td></tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition-colors cursor-pointer" style={{ borderBottom: '1px solid var(--g-border-default)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--g-surface-muted)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  onClick={() => navigate(`/correspondents/${row.original.id}`)}>
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
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}</span>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  )
}
