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
import { resolveFxToEur } from '../lib/fx-audit'

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
  const currency = watch('currency') ?? 'EUR'
  const watchedAmount = watch('amount')
  const amount = typeof watchedAmount === 'number' && Number.isFinite(watchedAmount) ? watchedAmount : 0
  const watchedExchangeRate = watch('exchange_rate_to_eur')
  const exchangeRateToEur = typeof watchedExchangeRate === 'number' && Number.isFinite(watchedExchangeRate)
    ? watchedExchangeRate
    : watchedExchangeRate === null
      ? null
      : undefined
  const fxPreview = resolveFxToEur({
    currency,
    amount,
    exchangeRateToEur,
  })

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
      title="Nueva Subida"
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

        {currency !== 'EUR' && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="intake-exchange-rate">
              Tipo de cambio a EUR <span style={{ color: 'var(--status-error)' }}>*</span>
            </Label>
            <Input
              id="intake-exchange-rate"
              {...register('exchange_rate_to_eur', {
                setValueAs: (value) => {
                  if (value === '' || value === null || typeof value === 'undefined') return null
                  const parsed = Number(value)
                  return Number.isFinite(parsed) ? parsed : value
                },
              })}
              type="number"
              step="0.000001"
              min="0.000001"
              placeholder="1.084500"
            />
            {errors.exchange_rate_to_eur && (
              <span className="text-xs" style={{ color: 'var(--status-error)' }}>
                {errors.exchange_rate_to_eur.message}
              </span>
            )}
          </div>
        )}

        <div
          className="px-3 py-2"
          style={{
            border: '1px solid var(--g-border-default)',
            borderRadius: 'var(--g-radius-md)',
            backgroundColor: 'var(--g-surface-hover)',
          }}
        >
          <p className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>
            Importe EUR (auditoria)
          </p>
          <p className="text-sm font-medium" style={{ color: 'var(--g-text-primary)' }}>
            {fxPreview.value
              ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(fxPreview.value.amountEur)
              : 'Pendiente de tipo de cambio'}
          </p>
        </div>

        {/* Reference number + date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="intake-reference-number">
              {intakeType === 'official_fee' ? 'No. NRC' : 'No. Factura'}
            </Label>
            {intakeType === 'official_fee' ? (
              <Input
                id="intake-reference-number"
                {...register('nrc_number')}
                placeholder="NRC-0001"
              />
            ) : (
              <Input
                id="intake-reference-number"
                {...register('invoice_number')}
                placeholder="FV-001"
              />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="intake-invoice-date">Fecha factura</Label>
            <Input id="intake-invoice-date" {...register('invoice_date')} type="date" />
          </div>
        </div>

        {intakeType === 'official_fee' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="intake-organism">Organismo</Label>
              <Select id="intake-organism" {...register('official_organism')}>
                <option value="">Seleccionar organismo</option>
                <option value="EPO">EPO</option>
                <option value="EUIPO">EUIPO</option>
                <option value="OEPM">OEPM</option>
                <option value="WIPO">WIPO</option>
                <option value="OTRO">Otro</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="intake-tariff-type">Tipo de tarifa</Label>
              <Select id="intake-tariff-type" {...register('tariff_type')}>
                <option value="">Seleccionar tarifa</option>
                <option value="general">General</option>
                <option value="special">Especial</option>
              </Select>
            </div>
          </div>
        )}

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
