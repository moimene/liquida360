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
import { useUsers, type InternalUser } from '../hooks/use-users'
import { useAuth } from '@/features/auth'
import { InviteUserForm } from './invite-user-form'
import { ROLE_OPTIONS, type InviteUserFormData } from '../schemas/settings-schemas'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  admin: 'default',
  supervisor: 'warning',
  financiero: 'success',
  pagador: 'secondary',
  corresponsal: 'secondary',
}

export function UsersTab() {
  const currentUser = useAuth((s) => s.user)
  const { users, loading, fetchUsers, inviteUser, updateRole } = useUsers()
  const [sorting, setSorting] = useState<SortingState>([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Filter to show only internal users (exclude corresponsales)
  const internalUsers = useMemo(
    () => users.filter((u) => u.role !== 'corresponsal'),
    [users],
  )

  const columns = useMemo<ColumnDef<InternalUser>[]>(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium" style={{ color: 'var(--g-text-primary)' }}>
              {row.getValue<string>('email')}
            </span>
            {row.original.id === currentUser?.id && (
              <Badge variant="default">Tu</Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: ({ row }) => {
          const role = row.getValue<string | null>('role')
          const isSelf = row.original.id === currentUser?.id

          if (isSelf) {
            return (
              <Badge variant={ROLE_BADGE_VARIANT[role ?? ''] ?? 'secondary'}>
                {ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role ?? 'Sin rol'}
              </Badge>
            )
          }

          return (
            <select
              value={role ?? ''}
              onChange={async (e) => {
                const newRole = e.target.value
                const { error } = await updateRole(row.original.id, newRole)
                if (error) {
                  toast.error('Error al cambiar rol', { description: error })
                } else {
                  toast.success(`Rol actualizado a ${ROLE_OPTIONS.find((r) => r.value === newRole)?.label ?? newRole}`)
                }
              }}
              className="text-sm px-2 py-1"
              style={{
                backgroundColor: 'var(--g-surface-card)',
                border: '1px solid var(--g-border-default)',
                borderRadius: 'var(--g-radius-sm)',
                color: 'var(--g-text-primary)',
              }}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Creado',
        cell: ({ row }) => {
          const date = row.getValue<string>('created_at')
          return (
            <span style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>
              {date
                ? formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
                : '—'}
            </span>
          )
        },
      },
    ],
    [currentUser?.id, updateRole],
  )

  const table = useReactTable({
    data: internalUsers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  async function handleInvite(data: InviteUserFormData) {
    setSubmitting(true)
    const { error } = await inviteUser(data.email, data.role)
    setSubmitting(false)
    if (error) {
      toast.error('Error al invitar usuario', { description: error })
    } else {
      toast.success(`Invitacion enviada a ${data.email}`)
      setInviteOpen(false)
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
            Usuarios internos
          </h3>
          <p className="mt-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
            Gestiona los usuarios del equipo interno. Cambia roles directamente desde la tabla.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invitar usuario
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
                  No hay usuarios internos
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

      <InviteUserForm
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInvite}
        loading={submitting}
      />
    </div>
  )
}
