import { useEffect, useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAlertConfigs } from '../hooks/use-alert-configs'
import { useAuth } from '@/features/auth'
import { AlertConfigForm } from './alert-config-form'
import { ALERT_TYPE_OPTIONS, type AlertConfigFormData } from '../schemas/settings-schemas'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AlertConfig } from '@/types'

export function AlertConfigsTab() {
  const user = useAuth((s) => s.user)
  const { configs, loading, fetchConfigs, createConfig, updateConfig, deleteConfig, toggleEnabled, seedDefaults } =
    useAlertConfigs()
  const [sorting, setSorting] = useState<SortingState>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editConfig, setEditConfig] = useState<AlertConfig | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchConfigs().then(() => {
      if (user?.id) seedDefaults(user.id)
    })
  }, [fetchConfigs, seedDefaults, user?.id])

  const columns = useMemo<ColumnDef<AlertConfig>[]>(
    () => [
      {
        accessorKey: 'alert_type',
        header: 'Tipo',
        cell: ({ row }) => {
          const type = row.getValue<string>('alert_type')
          const label = ALERT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
          return (
            <span className="font-medium" style={{ color: 'var(--g-text-primary)' }}>
              {label}
            </span>
          )
        },
      },
      {
        accessorKey: 'days_before_expiry',
        header: 'Dias antes',
        cell: ({ row }) => (
          <span style={{ color: 'var(--g-text-primary)' }}>
            {row.getValue<number>('days_before_expiry')} dias
          </span>
        ),
      },
      {
        accessorKey: 'enabled',
        header: 'Estado',
        cell: ({ row }) => {
          const enabled = row.getValue<boolean>('enabled')
          return (
            <button
              type="button"
              onClick={() => {
                toggleEnabled(row.original.id, !enabled).then(({ error }) => {
                  if (error) toast.error('Error al cambiar estado', { description: error })
                })
              }}
              className="cursor-pointer"
            >
              <Badge variant={enabled ? 'success' : 'secondary'}>
                {enabled ? 'Activa' : 'Inactiva'}
              </Badge>
            </button>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditConfig(row.original)
                setFormOpen(true)
              }}
              aria-label="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                const { error } = await deleteConfig(row.original.id)
                if (error) {
                  toast.error('Error al eliminar', { description: error })
                } else {
                  toast.success('Alerta eliminada')
                }
              }}
              aria-label="Eliminar"
            >
              <Trash2 className="h-4 w-4" style={{ color: 'var(--status-error)' }} />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [toggleEnabled, deleteConfig],
  )

  const table = useReactTable({
    data: configs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  async function handleSubmit(data: AlertConfigFormData) {
    setSubmitting(true)
    if (editConfig) {
      const { error } = await updateConfig(editConfig.id, data)
      setSubmitting(false)
      if (error) {
        toast.error('Error al actualizar', { description: error })
      } else {
        toast.success('Alerta actualizada')
        setFormOpen(false)
        setEditConfig(null)
      }
    } else {
      if (!user?.id) return
      const { error } = await createConfig(data, user.id)
      setSubmitting(false)
      if (error) {
        toast.error('Error al crear alerta', { description: error })
      } else {
        toast.success('Alerta creada')
        setFormOpen(false)
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h4)', color: 'var(--g-text-primary)' }}
          >
            Alertas de certificados
          </h3>
          <p className="mt-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
            Configura las pre-alertas de vencimiento. Las Edge Functions leen estos umbrales automaticamente.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditConfig(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva alerta
        </Button>
      </div>

      <div
        className="overflow-hidden"
        style={{
          border: '1px solid var(--g-border-default)',
          borderRadius: 'var(--g-radius-md)',
        }}
      >
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                style={{
                  backgroundColor: 'var(--g-surface-secondary)',
                  borderBottom: '1px solid var(--g-border-default)',
                }}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium"
                    style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}
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
                <td colSpan={columns.length} className="px-4 py-8 text-center" style={{ color: 'var(--g-text-secondary)' }}>
                  Cargando...
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center" style={{ color: 'var(--g-text-secondary)' }}>
                  No hay alertas configuradas
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: '1px solid var(--g-border-default)' }}
                  className="transition-colors"
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--g-surface-muted)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.backgroundColor = ''
                  }}
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

      <AlertConfigForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditConfig(null)
        }}
        onSubmit={handleSubmit}
        config={editConfig}
        loading={submitting}
      />
    </div>
  )
}
