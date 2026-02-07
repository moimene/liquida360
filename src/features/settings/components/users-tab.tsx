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
import { InfoPanel } from '@/components/ui/info-panel'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { useUsers, type InternalUser } from '../hooks/use-users'
import { useAuth } from '@/features/auth'
import { useCorrespondents } from '@/features/correspondents/hooks/use-correspondents'
import { supabase } from '@/lib/supabase'
import { InviteUserForm } from './invite-user-form'
import { ROLE_OPTIONS, type InviteUserFormData } from '../schemas/settings-schemas'
import { Plus, UserCheck, Clock, Copy, Check, Users, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { SETTINGS_HELP } from '../constants/help-texts'
import { COUNTRIES } from '@/lib/countries'

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  admin: 'default',
  supervisor: 'warning',
  financiero: 'success',
  pagador: 'secondary',
  corresponsal: 'secondary',
}

export function UsersTab() {
  const currentUser = useAuth((s) => s.user)
  const session = useAuth((s) => s.session)
  const { users, loading, fetchUsers, inviteUser, updateRole, approveUser } = useUsers()
  const { correspondents, loading: corrsLoading, fetchCorrespondents } = useCorrespondents()
  const [sorting, setSorting] = useState<SortingState>([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [approvingInternalId, setApprovingInternalId] = useState<string | null>(null)
  const [approveRoles, setApproveRoles] = useState<Record<string, string>>({})
  // Magic link dialog state
  const [magicLinkDialogOpen, setMagicLinkDialogOpen] = useState(false)
  const [magicLinkValue, setMagicLinkValue] = useState<string | null>(null)
  const [magicLinkEmail, setMagicLinkEmail] = useState('')
  const [copied, setCopied] = useState(false)

  const pendingCorrespondents = useMemo(
    () => correspondents.filter((c) => c.status === 'pending_approval'),
    [correspondents],
  )

  // Pending internal users: no role AND no correspondent_id
  const pendingInternalUsers = useMemo(
    () => users.filter((u) => !u.role && !u.correspondent_id),
    [users],
  )

  useEffect(() => {
    fetchUsers()
    fetchCorrespondents()
  }, [fetchUsers, fetchCorrespondents])

  async function handleApproveCorrespondent(correspondentId: string) {
    if (!session?.access_token) return
    setApprovingId(correspondentId)

    const { data, error } = await supabase.functions.invoke('approve-correspondent', {
      body: { correspondentId },
    })

    setApprovingId(null)

    if (error || data?.error) {
      toast.error('Error al aprobar corresponsal', { description: data?.error ?? error?.message })
    } else {
      toast.success('Corresponsal aprobado correctamente')
      fetchCorrespondents()
      fetchUsers()
    }
  }

  async function handleApproveInternalUser(userId: string) {
    const role = approveRoles[userId] || 'pagador'
    setApprovingInternalId(userId)

    const { error } = await approveUser(userId, role)

    setApprovingInternalId(null)

    if (error) {
      toast.error('Error al aprobar usuario', { description: error })
    } else {
      toast.success(`Usuario aprobado con rol ${ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role}`)
    }
  }

  // Filter to show only internal users with a role (exclude corresponsales and pending)
  const internalUsers = useMemo(
    () => users.filter((u) => u.role && u.role !== 'corresponsal'),
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
    const result = await inviteUser(data.email, data.role)
    setSubmitting(false)
    if (result.error) {
      toast.error('Error al invitar usuario', { description: result.error })
    } else {
      setInviteOpen(false)
      if (result.emailSent) {
        toast.success(`Invitacion enviada por email a ${data.email}`)
      } else if (result.magicLink) {
        // Show magic link dialog for manual sharing
        setMagicLinkValue(result.magicLink)
        setMagicLinkEmail(data.email)
        setMagicLinkDialogOpen(true)
        setCopied(false)
      } else {
        toast.success(`Usuario ${data.email} creado correctamente`)
      }
    }
  }

  async function handleCopyLink() {
    if (!magicLinkValue) return
    try {
      await navigator.clipboard.writeText(magicLinkValue)
      setCopied(true)
      toast.success('Enlace copiado al portapapeles')
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <InfoPanel variant="info" dismissible dismissKey="settings-users">{SETTINGS_HELP.usersInfoPanel}</InfoPanel>
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

      {/* Pending Internal Users Section */}
      {pendingInternalUsers.length > 0 && (
        <div
          className="mt-6 pt-6"
          style={{ borderTop: '1px solid var(--g-border-default)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="font-bold flex items-center gap-2"
                style={{ fontSize: 'var(--g-text-h4)', color: 'var(--g-text-primary)' }}
              >
                <Users className="h-4 w-4" />
                Usuarios internos pendientes de aprobacion
                <Badge variant="warning">{pendingInternalUsers.length}</Badge>
              </h3>
              <p className="mt-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
                Usuarios que se han registrado como equipo interno y esperan ser aprobados.
              </p>
            </div>
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
                <tr
                  style={{
                    backgroundColor: 'var(--g-surface-secondary)',
                    borderBottom: '1px solid var(--g-border-default)',
                  }}
                >
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>Email</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>Nombre</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>Rol solicitado</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>Registrado</th>
                  <th className="px-4 py-3 text-right font-medium" style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>Asignar rol y aprobar</th>
                </tr>
              </thead>
              <tbody>
                {pendingInternalUsers.map((user) => (
                  <tr
                    key={user.id}
                    style={{ borderBottom: '1px solid var(--g-border-default)' }}
                    className="transition-colors"
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--g-surface-muted)'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = ''
                    }}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {user.email}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--g-text-primary)' }}>
                      {user.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {user.requested_role ? (
                        <Badge variant={ROLE_BADGE_VARIANT[user.requested_role] ?? 'secondary'}>
                          {ROLE_OPTIONS.find((r) => r.value === user.requested_role)?.label ?? user.requested_role}
                        </Badge>
                      ) : (
                        <span style={{ color: 'var(--g-text-secondary)' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={approveRoles[user.id] ?? user.requested_role ?? 'pagador'}
                          onChange={(e) =>
                            setApproveRoles((prev) => ({ ...prev, [user.id]: e.target.value }))
                          }
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
                        <Button
                          size="sm"
                          onClick={() => handleApproveInternalUser(user.id)}
                          loading={approvingInternalId === user.id}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Aprobar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Correspondents Section */}
      <div
        className="mt-8 pt-8"
        style={{ borderTop: '1px solid var(--g-border-default)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3
              className="font-bold flex items-center gap-2"
              style={{ fontSize: 'var(--g-text-h4)', color: 'var(--g-text-primary)' }}
            >
              <Clock className="h-4 w-4" />
              Corresponsales pendientes de aprobacion
              {pendingCorrespondents.length > 0 && (
                <Badge variant="warning">{pendingCorrespondents.length}</Badge>
              )}
            </h3>
            <p className="mt-1" style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}>
              Corresponsales que se han registrado en el portal y esperan ser aprobados para acceder.
            </p>
          </div>
        </div>

        {corrsLoading ? (
          <div className="px-4 py-8 text-center" style={{ color: 'var(--g-text-secondary)' }}>
            Cargando...
          </div>
        ) : pendingCorrespondents.length === 0 ? (
          <InfoPanel variant="info">
            No hay corresponsales pendientes de aprobacion.
          </InfoPanel>
        ) : (
          <div
            className="overflow-hidden"
            style={{
              border: '1px solid var(--g-border-default)',
              borderRadius: 'var(--g-radius-md)',
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--g-surface-secondary)',
                    borderBottom: '1px solid var(--g-border-default)',
                  }}
                >
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>Nombre / Bufete</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>Pais</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>NIF / Tax ID</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>Email</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>Registrado</th>
                  <th className="px-4 py-3 text-right font-medium" style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendingCorrespondents.map((corr) => (
                  <tr
                    key={corr.id}
                    style={{ borderBottom: '1px solid var(--g-border-default)' }}
                    className="transition-colors"
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--g-surface-muted)'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = ''
                    }}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {corr.name}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--g-text-primary)' }}>
                      {COUNTRIES.find((c) => c.code === corr.country)?.name ?? corr.country}
                    </td>
                    <td className="px-4 py-3">
                      <code className="px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--g-surface-muted)', borderRadius: 'var(--g-radius-sm)', color: 'var(--g-text-primary)' }}>
                        {corr.tax_id}
                      </code>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--g-text-primary)' }}>
                      {corr.email ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-small)' }}>
                        {formatDistanceToNow(new Date(corr.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        onClick={() => handleApproveCorrespondent(corr.id)}
                        loading={approvingId === corr.id}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Aprobar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InviteUserForm
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInvite}
        loading={submitting}
      />

      {/* Magic Link Dialog */}
      <Dialog
        open={magicLinkDialogOpen}
        onClose={() => setMagicLinkDialogOpen(false)}
        title="Enlace de acceso"
        description={`El email de invitacion no se pudo enviar automaticamente a ${magicLinkEmail}. Comparte este enlace con el usuario para que pueda acceder.`}
      >
        <div className="flex flex-col gap-4 px-6 pb-2">
          <div
            className="flex items-center gap-2 p-3"
            style={{
              backgroundColor: 'var(--g-surface-muted)',
              borderRadius: 'var(--g-radius-md)',
              border: '1px solid var(--g-border-default)',
            }}
          >
            <Link2 className="h-4 w-4 shrink-0" style={{ color: 'var(--g-text-secondary)' }} />
            <code
              className="text-xs flex-1 break-all"
              style={{ color: 'var(--g-text-primary)' }}
            >
              {magicLinkValue}
            </code>
          </div>
          <p className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>
            Este enlace permite al usuario iniciar sesion sin contrasena. Compartelo de forma segura.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setMagicLinkDialogOpen(false)}>
            Cerrar
          </Button>
          <Button onClick={handleCopyLink}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado' : 'Copiar enlace'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
