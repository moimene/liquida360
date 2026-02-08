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
import { SortButton } from '@/components/ui/sort-button'
import { TableToolbar } from '@/components/ui/table-toolbar'
import { EmptyState } from '@/components/ui/empty-state'
import { exportTableToCsv, csvFilename, type CsvColumn } from '@/lib/csv-export'
import { ChevronLeft, ChevronRight, ExternalLink, FileCheck, Stamp } from 'lucide-react'
import { getCertificateStatus, formatDate } from '@/lib/certificate-utils'
import { COUNTRIES } from '@/lib/countries'

interface CertificatesTableProps {
  data: Certificate[]
  loading: boolean
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'valid', label: 'Vigente' },
  { value: 'expiring_soon', label: 'Por vencer' },
  { value: 'expired', label: 'Vencido' },
]

const csvColumns: CsvColumn<Certificate>[] = [
  {
    header: 'Corresponsal',
    accessor: (row) => (row as Certificate & { correspondents?: { name: string } }).correspondents?.name ?? '',
  },
  {
    header: 'País emisor',
    accessor: (row) => {
      const country = COUNTRIES.find((c) => c.code === row.issuing_country)
      return country?.name ?? row.issuing_country
    },
  },
  { header: 'Emisión', accessor: (row) => formatDate(row.issue_date) },
  { header: 'Vencimiento', accessor: (row) => formatDate(row.expiry_date) },
  { header: 'Estado', accessor: (row) => getCertificateStatus(row.expiry_date).label },
  { header: 'Apostillado', accessor: (row) => row.apostilled ? 'Sí' : 'No' },
]

export function CertificatesTable({ data, loading }: CertificatesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'expiry_date', desc: false }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return data
    return data.filter((c) => getCertificateStatus(c.expiry_date).status === statusFilter)
  }, [data, statusFilter])

  const columns = useMemo<ColumnDef<Certificate>[]>(
    () => [
      {
        accessorKey: 'correspondents',
        header: 'Corresponsal',
        cell: ({ row }) => {
          const corr = row.original as Certificate & { correspondents?: { name: string } }
          return (<span className="font-medium" style={{ color: 'var(--g-text-primary)' }}>{corr.correspondents?.name ?? '—'}</span>)
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
      { accessorKey: 'issue_date', header: 'Emisión', cell: ({ row }) => formatDate(row.getValue('issue_date')) },
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
        accessorKey: 'apostilled',
        header: 'Apostilla',
        cell: ({ row }) => {
          const apostilled = row.original.apostilled
          return apostilled ? (
            <span className="inline-flex items-center gap-1" style={{ color: 'var(--g-status-success)' }}>
              <Stamp className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Si</span>
            </span>
          ) : (
            <span className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>—</span>
          )
        },
        enableSorting: false,
      },
      {
        id: 'document',
        header: '',
        cell: ({ row }) => {
          if (!row.original.document_url) return null
          return (
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); window.open(row.original.document_url!, '_blank') }} aria-label="Ver documento">
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
    exportTableToCsv(filteredData, csvColumns, csvFilename('certificados'))
  }

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        searchPlaceholder="Buscar certificado..."
        statusOptions={STATUS_OPTIONS}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        onExport={handleExport}
        totalRecords={table.getFilteredRowModel().rows.length}
        recordLabel="certificados"
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
                <EmptyState icon={FileCheck} title={globalFilter || statusFilter !== 'all' ? 'No se encontraron certificados' : 'No hay certificados registrados'} description="Los certificados de residencia fiscal aparecerán aquí" />
              </td></tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--g-border-default)' }}>
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
