import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { vendorSchema, vendorDefaults, type VendorFormInput, type VendorFormData } from '../schemas/vendor-schema'
import { COUNTRIES } from '@/lib/countries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

interface VendorFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: VendorFormData) => Promise<void>
  submitting?: boolean
}

export function VendorForm({ open, onClose, onSubmit, submitting }: VendorFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorFormInput, unknown, VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: vendorDefaults,
  })

  function handleClose() {
    reset(vendorDefaults)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Nuevo Proveedor"
      description="Registra un nuevo proveedor en el catálogo"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="vendor-name">
            Nombre <span style={{ color: 'var(--status-error)' }}>*</span>
          </Label>
          <Input
            id="vendor-name"
            {...register('name')}
            placeholder="Nombre del proveedor"
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <span id="name-error" className="text-xs" style={{ color: 'var(--status-error)' }}>
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="vendor-tax-id">
            NIF/CIF <span style={{ color: 'var(--status-error)' }}>*</span>
          </Label>
          <Input
            id="vendor-tax-id"
            {...register('tax_id')}
            placeholder="Identificador fiscal"
            aria-describedby={errors.tax_id ? 'tax_id-error' : undefined}
          />
          {errors.tax_id && (
            <span id="tax_id-error" className="text-xs" style={{ color: 'var(--status-error)' }}>
              {errors.tax_id.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="vendor-country">
            País <span style={{ color: 'var(--status-error)' }}>*</span>
          </Label>
          <Select
            id="vendor-country"
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
            <span id="country-error" className="text-xs" style={{ color: 'var(--status-error)' }}>
              {errors.country.message}
            </span>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Proveedor
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
