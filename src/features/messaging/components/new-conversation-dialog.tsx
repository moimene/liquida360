import { useState, useMemo } from 'react'
import { Search, Users, Check } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { UserProfile } from '@/types'

interface NewConversationDialogProps {
  open: boolean
  onClose: () => void
  users: UserProfile[]
  currentUserId: string
  onCreateConversation: (
    participantIds: string[],
    title?: string,
    isGroup?: boolean,
  ) => void
}

export function NewConversationDialog({
  open,
  onClose,
  users,
  currentUserId,
  onCreateConversation,
}: NewConversationDialogProps) {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')

  const isGroup = selectedIds.length > 1

  // Filter out current user and apply search
  const availableUsers = useMemo(() => {
    const filtered = users.filter((u) => u.id !== currentUserId)
    if (!search) return filtered
    const lower = search.toLowerCase()
    return filtered.filter(
      (u) =>
        u.full_name.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        u.role.toLowerCase().includes(lower),
    )
  }, [users, currentUserId, search])

  function toggleUser(userId: string) {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  function handleCreate() {
    if (selectedIds.length === 0) return
    onCreateConversation(
      selectedIds,
      isGroup ? groupName || undefined : undefined,
      isGroup,
    )
    // Reset
    setSearch('')
    setSelectedIds([])
    setGroupName('')
    onClose()
  }

  function handleClose() {
    setSearch('')
    setSelectedIds([])
    setGroupName('')
    onClose()
  }

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    supervisor: 'Supervisor',
    pagador: 'Pagador',
    financiero: 'Financiero',
    corresponsal: 'Corresponsal',
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Nueva conversación"
      description="Selecciona uno o más usuarios para iniciar una conversación."
    >
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{
            backgroundColor: 'var(--g-surface-muted)',
            borderRadius: 'var(--g-radius-md)',
            border: '1px solid var(--g-border-default)',
          }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--g-text-secondary)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o rol..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: 'var(--g-text-primary)', fontFamily: 'var(--g-font-family)' }}
          />
        </div>

        {/* Selected chips */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedIds.map((id) => {
              const u = users.find((u) => u.id === id)
              if (!u) return null
              return (
                <Badge
                  key={id}
                  variant="outline"
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => toggleUser(id)}
                >
                  {u.full_name || u.email}
                  <span className="text-xs ml-1">&times;</span>
                </Badge>
              )
            })}
          </div>
        )}

        {/* Group name (if >1 selected) */}
        {isGroup && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" style={{ color: 'var(--g-text-secondary)' }} />
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Nombre del grupo (opcional)"
              className="flex-1 text-sm px-3 py-2 outline-none"
              style={{
                backgroundColor: 'var(--g-surface-muted)',
                borderRadius: 'var(--g-radius-md)',
                border: '1px solid var(--g-border-default)',
                color: 'var(--g-text-primary)',
                fontFamily: 'var(--g-font-family)',
              }}
            />
          </div>
        )}

        {/* User list */}
        <div
          className="max-h-64 overflow-y-auto flex flex-col gap-1"
          style={{ borderRadius: 'var(--g-radius-md)' }}
        >
          {availableUsers.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--g-text-secondary)' }}>
              No se encontraron usuarios
            </p>
          ) : (
            availableUsers.map((u) => {
              const isSelected = selectedIds.includes(u.id)
              return (
                <button
                  key={u.id}
                  type="button"
                  className="flex items-center gap-3 px-3 py-2.5 w-full text-left transition-colors"
                  style={{
                    backgroundColor: isSelected
                      ? 'color-mix(in srgb, var(--g-brand-3308) 8%, var(--g-surface-card))'
                      : 'transparent',
                    borderRadius: 'var(--g-radius-md)',
                  }}
                  onClick={() => toggleUser(u.id)}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center font-medium text-xs shrink-0"
                    style={{
                      backgroundColor: isSelected ? 'var(--g-brand-3308)' : 'var(--g-sec-100)',
                      color: isSelected ? 'var(--g-text-inverse)' : 'var(--g-brand-3308)',
                      borderRadius: 'var(--g-radius-full)',
                    }}
                  >
                    {isSelected ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      (u.full_name || u.email).charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--g-text-primary)' }}
                    >
                      {u.full_name || u.email}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                      {roleLabels[u.role] ?? u.role}
                      {u.email !== u.full_name ? ` · ${u.email}` : ''}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={selectedIds.length === 0}
            style={{
              backgroundColor: 'var(--g-brand-3308)',
              color: 'var(--g-text-inverse)',
            }}
          >
            {isGroup ? 'Crear grupo' : 'Iniciar conversación'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
