import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { intakeSchema, intakeDefaults, type IntakeFormInput, type IntakeFormData } from '../schemas/intake-schema'
import { useGInvJobs } from '../hooks/use-ginv-jobs'
import { useGInvVendors } from '../hooks/use-ginv-vendors'
import { CURRENCIES } from '../constants/ginvoice-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { Loader2, FileUp } from 'lucide-react'

interface IntakeFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: IntakeFormData) => Promise<void>
  onFileChange: (file: File | undefined) => void
  submitting?: boolean
}

export function IntakeForm({ open, onClose, onSubmit, onFileChange, submitting }: IntakeFormProps) {
  const { jobs, fetchJobs } = useGInvJobs()
  const { vendors, fetchVendors } = useGInvVendors()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<IntakeFormInput, unknown, IntakeFormData>({
    resolver: zodResolver(intakeSchema),
    defaultValues: intakeDefaults,
  })

  const intakeType = watch('type')

  useEffect(() => {
    if (open) {
      fetchJobs()
      fetchVendors()
    }
  }, [open, fetchJobs, fetchVendors])

  function handleClose() {
    reset(intakeDefaults)
    onFileChange(undefined)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Nueva Ingesta"
      description="Registra una factura de proveedor o tasa oficial"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {/* Type */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="intake-type">
            Tipo <span style={{ color: 'var(--status-error)' }}>*</span>
          </Label>
          <Select id="intake-type" {...register('type')}>
            <option value="vendor_invoice">Factura proveedor</option>
            <option value="official_fee">Tasa oficial</option>
          </Select>
        </div>

        {/* Job */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="intake-job">
            Job <span style={{ color: 'var(--status-error)' }}>*</span>
          </Label>
          <Select
            id="intake-job"
            {...register('job_id')}
            error={!!errors.job_id}
            aria-describedby={errors.job_id ? 'job_id-error' : undefined}
          >
            <option value="">Seleccionar Job</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.job_code} — {j.client_name}
              </option>
            ))}
          </Select>
          {errors.job_id && (
            <span id="job_id-error" className="text-xs" style={{ color: 'var(--status-error)' }}>
              {errors.job_id.message}
            </span>
          )}
        </div>

        {/* Vendor (only for vendor_invoice) */}
        {intakeType === 'vendor_invoice' && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="intake-vendor">
              Proveedor <span style={{ color: 'var(--status-error)' }}>*</span>
            </Label>
            <Select id="intake-vendor" {...register('vendor_id')}>
              <option value="">Seleccionar proveedor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.tax_id})
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Amount + Currency */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="intake-amount">
              Importe <span style={{ color: 'var(--status-error)' }}>*</span>
            </Label>
            <Input
              id="intake-amount"
              {...register('amount', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
            />
            {errors.amount && (
              <span className="text-xs" style={{ color: 'var(--status-error)' }}>{errors.amount.message}</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="intake-currency">Moneda</Label>
            <Select id="intake-currency" {...register('currency')}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Invoice number + date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="intake-invoice-number">Nº Factura</Label>
            <Input id="intake-invoice-number" {...register('invoice_number')} placeholder="FV-001" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="intake-invoice-date">Fecha factura</Label>
            <Input id="intake-invoice-date" {...register('invoice_date')} type="date" />
          </div>
        </div>

        {/* Concept */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="intake-concept">Concepto</Label>
          <Textarea
            id="intake-concept"
            {...register('concept_text')}
            placeholder="Descripción del gasto o tasa..."
            rows={2}
          />
        </div>

        {/* File upload */}
        <div className="flex flex-col gap-1.5">
          <Label>Documento PDF</Label>
          <label
            className="flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors"
            style={{
              border: '1px dashed var(--g-border-default)',
              borderRadius: 'var(--g-radius-md)',
              color: 'var(--g-text-secondary)',
            }}
          >
            <FileUp className="h-4 w-4" />
            <span className="text-sm">Seleccionar PDF...</span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => onFileChange(e.target.files?.[0])}
            />
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registrar
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
