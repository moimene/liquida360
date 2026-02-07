import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  inviteUserSchema,
  inviteUserDefaultValues,
  ROLE_OPTIONS,
  type InviteUserFormData,
} from '../schemas/settings-schemas'

interface InviteUserFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: InviteUserFormData) => Promise<void>
  loading?: boolean
}

export function InviteUserForm({ open, onClose, onSubmit, loading }: InviteUserFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: inviteUserDefaultValues,
  })

  useEffect(() => {
    if (open) reset(inviteUserDefaultValues)
  }, [open, reset])

  async function handleFormSubmit(data: InviteUserFormData) {
    await onSubmit(data)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Invitar usuario"
      description="El usuario recibira un enlace para configurar su contrasena."
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-email">
            Email <span style={{ color: 'var(--status-error)' }}>*</span>
          </Label>
          <Input
            id="invite-email"
            type="email"
            {...register('email')}
            placeholder="usuario@empresa.com"
            error={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <span id="email-error" className="text-sm" style={{ color: 'var(--status-error)' }}>
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-role">
            Rol <span style={{ color: 'var(--status-error)' }}>*</span>
          </Label>
          <select
            id="invite-role"
            {...register('role')}
            className="flex h-10 w-full items-center px-3 text-sm"
            style={{
              backgroundColor: 'var(--g-surface-card)',
              border: '1px solid var(--g-border-default)',
              borderRadius: 'var(--g-radius-sm)',
              color: 'var(--g-text-primary)',
            }}
            aria-describedby={errors.role ? 'role-error' : undefined}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <span id="role-error" className="text-sm" style={{ color: 'var(--status-error)' }}>
              {errors.role.message}
            </span>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {loading ? 'Invitando...' : 'Invitar usuario'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
