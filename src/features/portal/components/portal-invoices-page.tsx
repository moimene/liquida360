import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus, Search, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/features/auth'
import { usePortalCorrespondent } from '../hooks/use-portal-correspondent'
import { usePortalLiquidations } from '../hooks/use-portal-liquidations'
import { getStatusConfig, formatAmount } from '@/lib/liquidation-utils'
import { formatDate } from '@/lib/certificate-utils'
import { PortalInvoiceForm } from './portal-invoice-form'
import type { Liquidation } from '@/types'
import type { PortalInvoiceFormInput } from '../schemas/portal-invoice-schema'

export function PortalInvoicesPage() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const { correspondent, fetchCorrespondent } = usePortalCorrespondent()
  const { liquidations, loading, fetchLiquidations, createInvoice } = usePortalLiquidations()
  const [formOpen, setFormOpen] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  useEffect(() => {
    if (user?.id) {
      fetchCorrespondent(user.id)
    }
  }, [user?.id, fetchCorrespondent])

  useEffect(() => {
    if (correspondent?.id) {
      fetchLiquidations(correspondent.id)
    }
  }, [correspondent?.id, fetchLiquidations])

  async function handleCreate(data: PortalInvoiceFormInput, file?: File) {
    if (!correspondent?.id || !user?.id) return

    const { error } = await createInvoice(
      { ...data, amount: Number(data.amount), currency: data.currency ?? 'EUR' },
      correspondent.id,
      user.id,
      file,
    )

    if (error) {
      toast.error('Error al crear factura', { description: error })
    } else {
      toast.success('Factura creada como borrador')
    }
  }

  const columns = useMemo<ColumnDef<Liquidation>[]>(
    () => [
      {
        accessorKey: 'concept',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Concepto <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium" style={{ color: 'var(--g-text-primary)' }}>
            {row.original.concept}
          </span>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Importe',
        cell: ({ row }) => (
          <span className="font-bold" style={{ color: 'var(--g-brand-3308)' }}>
            {formatAmount(row.original.amount, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => {
          const config = getStatusConfig(row.original.status)
          return <Badge variant={config.badgeVariant}>{config.label}</Badge>
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Fecha <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span style={{ color: 'var(--g-text-secondary)' }}>
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/portal/invoices/${row.original.id}`)}
          >
            Ver
          </Button>
        ),
      },
    ],
    [navigate],
  )

  const table = useReactTable({
    data: liquidations,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Mis facturas
          </h1>
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Gestiona tus facturas y solicitudes de pago
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva factura
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: 'var(--g-text-secondary)' }}
        />
        <Input
          placeholder="Buscar por concepto, referencia..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div
        className="overflow-x-auto"
        style={{
          backgroundColor: 'var(--g-surface-card)',
          borderRadius: 'var(--g-radius-lg)',
          border: '1px solid var(--g-border-default)',
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
                    className="text-left px-4 py-3 font-medium"
                    style={{ color: 'var(--g-text-secondary)' }}
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
              <tr>
                <td colSpan={columns.length} className="text-center py-8">
                  <span style={{ color: 'var(--g-text-secondary)' }}>Cargando...</span>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8">
                  <span style={{ color: 'var(--g-text-secondary)' }}>
                    No hay facturas. Crea tu primera factura.
                  </span>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: '1px solid var(--g-border-default)' }}
                  onClick={() => navigate(`/portal/invoices/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
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
          <p className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
            Pagina {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <PortalInvoiceForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />
    </div>
  )
}
