import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import {
  portalInvoiceSchema,
  portalInvoiceDefaultValues,
  type PortalInvoiceFormInput,
} from '../schemas/portal-invoice-schema'
import { CURRENCIES } from '@/features/liquidations/schemas/liquidation-schema'

interface PortalInvoiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PortalInvoiceFormInput, file?: File) => Promise<void>
}

export function PortalInvoiceForm({ open, onOpenChange, onSubmit }: PortalInvoiceFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PortalInvoiceFormInput>({
    resolver: zodResolver(portalInvoiceSchema),
    defaultValues: portalInvoiceDefaultValues,
  })

  async function onFormSubmit(data: PortalInvoiceFormInput) {
    setSubmitting(true)
    await onSubmit(data, file ?? undefined)
    setSubmitting(false)
    reset()
    setFile(null)
    onOpenChange(false)
  }

  function handleClose() {
    reset()
    setFile(null)
    onOpenChange(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
    }
  }

  function removeFile() {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Nueva factura"
      description="Crea una nueva factura como borrador. Podras enviarla a aprobacion despues."
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="invoice-amount">Importe</Label>
          <Input
            id="invoice-amount"
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            error={!!errors.amount}
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-xs" style={{ color: 'var(--status-error)' }}>
              {errors.amount.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="invoice-currency">Divisa</Label>
          <Select id="invoice-currency" {...register('currency')}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="invoice-concept">Concepto</Label>
          <Textarea
            id="invoice-concept"
            {...register('concept')}
            placeholder="Descripcion del servicio o concepto de pago"
            rows={3}
          />
          {errors.concept && (
            <p className="text-xs" style={{ color: 'var(--status-error)' }}>
              {errors.concept.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="invoice-reference">Referencia (opcional)</Label>
          <Input
            id="invoice-reference"
            type="text"
            {...register('reference')}
            placeholder="Numero de factura, expediente, etc."
          />
        </div>

        {/* File upload */}
        <div className="flex flex-col gap-2">
          <Label>Factura PDF (opcional)</Label>
          {file ? (
            <div
              className="flex items-center justify-between p-3 text-sm"
              style={{
                backgroundColor: 'var(--g-surface-muted)',
                borderRadius: 'var(--g-radius-sm)',
              }}
            >
              <span className="truncate" style={{ color: 'var(--g-text-primary)' }}>
                {file.name}
              </span>
              <button
                type="button"
                onClick={removeFile}
                className="shrink-0 ml-2"
                style={{ color: 'var(--g-text-secondary)' }}
                aria-label="Eliminar archivo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 p-4 border-2 border-dashed transition-colors text-sm"
              style={{
                borderColor: 'var(--g-border-default)',
                borderRadius: 'var(--g-radius-md)',
                color: 'var(--g-text-secondary)',
              }}
            >
              <Upload className="h-4 w-4" />
              Seleccionar archivo (PDF, JPG, PNG)
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        <DialogFooter className="mt-2 -mx-6 -mb-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Creando...' : 'Crear borrador'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
