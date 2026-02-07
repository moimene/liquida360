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
import type { Certificate } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, ExternalLink } from 'lucide-react'
import { getCertificateStatus, formatDate } from '@/lib/certificate-utils'
import { COUNTRIES } from '@/lib/countries'

interface CertificatesTableProps {
  data: Certificate[]
  loading: boolean
}

export function CertificatesTable({ data, loading }: CertificatesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'expiry_date', desc: false }])
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<Certificate>[]>(
    () => [
      {
        accessorKey: 'correspondents',
        header: 'Corresponsal',
        cell: ({ row }) => {
          const corr = row.original as Certificate & { correspondents?: { name: string } }
          return (
            <span className="font-medium" style={{ color: 'var(--g-text-primary)' }}>
              {corr.correspondents?.name ?? '—'}
            </span>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'issuing_country',
        header: ({ column }) => <SortButton column={column}>País emisor</SortButton>,
        cell: ({ row }) => {
          const code = row.getValue('issuing_country') as string
          const country = COUNTRIES.find((c) => c.code === code)
          return country?.name ?? code
        },
      },
      {
        accessorKey: 'issue_date',
        header: 'Emisión',
        cell: ({ row }) => formatDate(row.getValue('issue_date')),
      },
      {
        accessorKey: 'expiry_date',
        header: ({ column }) => <SortButton column={column}>Vencimiento</SortButton>,
        cell: ({ row }) => formatDate(row.getValue('expiry_date')),
      },
      {
        id: 'status_calc',
        header: 'Estado',
        cell: ({ row }) => {
          const info = getCertificateStatus(row.original.expiry_date)
          return <Badge variant={info.badgeVariant}>{info.label}</Badge>
        },
      },
      {
        id: 'document',
        header: '',
        cell: ({ row }) => {
          if (!row.original.document_url) return null
          return (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                window.open(row.original.document_url!, '_blank')
              }}
              aria-label="Ver documento"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )
        },
        enableSorting: false,
      },
    ],
    [],
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
    initialState: { pagination: { pageSize: 15 } },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: 'var(--g-text-secondary)' }}
        />
        <Input
          placeholder="Buscar certificado..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-9"
          aria-label="Buscar certificados"
        />
      </div>

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
                    ? 'No se encontraron certificados'
                    : 'No hay certificados registrados'}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
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

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
            {table.getFilteredRowModel().rows.length} certificados
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
