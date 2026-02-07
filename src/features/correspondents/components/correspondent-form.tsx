import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import {
  correspondentSchema,
  correspondentDefaultValues,
  type CorrespondentFormData,
  type CorrespondentFormInput,
} from '../schemas/correspondent-schema'
import type { Correspondent } from '@/types'
import { COUNTRIES } from '@/lib/countries'

interface CorrespondentFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CorrespondentFormData) => Promise<void>
  correspondent?: Correspondent | null
  loading?: boolean
}

export function CorrespondentForm({
  open,
  onClose,
  onSubmit,
  correspondent,
  loading,
}: CorrespondentFormProps) {
  const isEdit = !!correspondent
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CorrespondentFormInput, unknown, CorrespondentFormData>({
    resolver: zodResolver(correspondentSchema),
    defaultValues: correspondent
      ? {
          name: correspondent.name,
          country: correspondent.country,
          tax_id: correspondent.tax_id,
          address: correspondent.address,
          email: correspondent.email ?? '',
          phone: correspondent.phone ?? '',
          status: correspondent.status === 'pending_approval' ? 'active' : correspondent.status,
        }
      : correspondentDefaultValues,
  })

  async function handleFormSubmit(data: CorrespondentFormData) {
    await onSubmit(data)
    reset()
    onClose()
  }

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Editar corresponsal' : 'Nuevo corresponsal'}
      description={
        isEdit ? 'Modifica los datos del corresponsal' : 'Completa los datos del nuevo corresponsal'
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <div className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">
              Nombre <span style={{ color: 'var(--status-error)' }}>*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Nombre del corresponsal o firma"
              error={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <span id="name-error" className="text-xs" style={{ color: 'var(--status-error)' }}>
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Country + Tax ID row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">
                País <span style={{ color: 'var(--status-error)' }}>*</span>
              </Label>
              <Select
                id="country"
                {...register('country')}
                error={!!errors.country}
                aria-describedby={errors.country ? 'country-error' : undefined}
              >
                <option value="">Seleccionar país</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {errors.country && (
                <span
                  id="country-error"
                  className="text-xs"
                  style={{ color: 'var(--status-error)' }}
                >
                  {errors.country.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tax_id">
                NIF / Tax ID <span style={{ color: 'var(--status-error)' }}>*</span>
              </Label>
              <Input
                id="tax_id"
                {...register('tax_id')}
                placeholder="Ej: GB123456789"
                error={!!errors.tax_id}
                aria-describedby={errors.tax_id ? 'tax-error' : undefined}
              />
              {errors.tax_id && (
                <span id="tax-error" className="text-xs" style={{ color: 'var(--status-error)' }}>
                  {errors.tax_id.message}
                </span>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">
              Dirección fiscal <span style={{ color: 'var(--status-error)' }}>*</span>
            </Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Dirección completa"
              error={!!errors.address}
              aria-describedby={errors.address ? 'address-error' : undefined}
            />
            {errors.address && (
              <span id="address-error" className="text-xs" style={{ color: 'var(--status-error)' }}>
                {errors.address.message}
              </span>
            )}
          </div>

          {/* Email + Phone row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="email@example.com"
                error={!!errors.email}
              />
              {errors.email && (
                <span className="text-xs" style={{ color: 'var(--status-error)' }}>
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" type="tel" {...register('phone')} placeholder="+44 20 1234 5678" />
            </div>
          </div>

          {/* Status (only on edit) */}
          {isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Estado</Label>
              <Select id="status" {...register('status')}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 -mx-6 -mb-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Guardar cambios' : 'Crear corresponsal'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
