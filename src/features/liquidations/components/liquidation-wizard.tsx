import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import {
  liquidationSchema,
  liquidationDefaultValues,
  CURRENCIES,
  type LiquidationFormData,
  type LiquidationFormInput,
} from '../schemas/liquidation-schema'
import { formatAmount } from '@/lib/liquidation-utils'
import { getCertificateStatus } from '@/lib/certificate-utils'
import { COUNTRIES } from '@/lib/countries'
import type { Correspondent, Certificate } from '@/types'
import { supabase } from '@/lib/supabase'

interface LiquidationWizardProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: LiquidationFormData, certificateId?: string) => Promise<void>
  correspondents: Correspondent[]
  loading?: boolean
}

const STEPS = ['Corresponsal', 'Datos', 'Confirmar'] as const

export function LiquidationWizard({
  open,
  onClose,
  onSubmit,
  correspondents,
  loading,
}: LiquidationWizardProps) {
  const [step, setStep] = useState(0)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loadingCerts, setLoadingCerts] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    trigger,
    formState: { errors },
  } = useForm<LiquidationFormInput, unknown, LiquidationFormData>({
    resolver: zodResolver(liquidationSchema),
    defaultValues: liquidationDefaultValues,
  })

  const selectedCorrespondentId = watch('correspondent_id')
  const amount = watch('amount')
  const currency = watch('currency')
  const concept = watch('concept')
  const reference = watch('reference')

  const selectedCorrespondent = useMemo(
    () => correspondents.find((c) => c.id === selectedCorrespondentId),
    [correspondents, selectedCorrespondentId],
  )

  const validCertificate = useMemo(() => {
    return certificates.find((c) => {
      const info = getCertificateStatus(c.expiry_date)
      return info.status === 'valid' || info.status === 'expiring_soon'
    })
  }, [certificates])

  const hasExpiredOnly = useMemo(() => {
    if (certificates.length === 0) return false
    return certificates.every((c) => getCertificateStatus(c.expiry_date).status === 'expired')
  }, [certificates])

  // Fetch certificates when correspondent changes
  useEffect(() => {
    if (!selectedCorrespondentId) {
      setCertificates([])
      return
    }
    setLoadingCerts(true)
    supabase
      .from('certificates')
      .select('*')
      .eq('correspondent_id', selectedCorrespondentId)
      .order('expiry_date', { ascending: false })
      .then(({ data }) => {
        setCertificates(data ?? [])
        setLoadingCerts(false)
      })
  }, [selectedCorrespondentId])

  async function handleNext() {
    if (step === 0) {
      const valid = await trigger('correspondent_id')
      if (valid) setStep(1)
    } else if (step === 1) {
      const valid = await trigger(['amount', 'currency', 'concept'])
      if (valid) setStep(2)
    }
  }

  async function handleFormSubmit(data: LiquidationFormData) {
    await onSubmit(data, validCertificate?.id)
    reset()
    setStep(0)
    onClose()
  }

  function handleClose() {
    reset()
    setStep(0)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Nueva liquidación"
      description={`Paso ${step + 1} de 3: ${STEPS[step]}`}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className="flex h-7 w-7 items-center justify-center text-xs font-bold shrink-0"
              style={{
                backgroundColor: i <= step ? 'var(--g-brand-3308)' : 'var(--g-surface-muted)',
                color: i <= step ? 'var(--g-text-inverse)' : 'var(--g-text-secondary)',
                borderRadius: 'var(--g-radius-full)',
                transition: 'all var(--g-transition-normal)',
              }}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className="text-xs font-medium hidden sm:block"
              style={{ color: i <= step ? 'var(--g-text-primary)' : 'var(--g-text-secondary)' }}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-px"
                style={{
                  backgroundColor: i < step ? 'var(--g-brand-3308)' : 'var(--g-border-default)',
                }}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        {/* Step 1: Correspondent */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="correspondent_id">
                Corresponsal <span style={{ color: 'var(--status-error)' }}>*</span>
              </Label>
              <Select
                id="correspondent_id"
                {...register('correspondent_id')}
                error={!!errors.correspondent_id}
              >
                <option value="">Seleccionar corresponsal</option>
                {correspondents
                  .filter((c) => c.status === 'active')
                  .map((c) => {
                    const country = COUNTRIES.find((ct) => ct.code === c.country)
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({country?.name ?? c.country})
                      </option>
                    )
                  })}
              </Select>
              {errors.correspondent_id && (
                <span className="text-xs" style={{ color: 'var(--status-error)' }}>
                  {errors.correspondent_id.message}
                </span>
              )}
            </div>

            {/* Certificate status */}
            {selectedCorrespondentId && !loadingCerts && (
              <Card>
                <CardContent className="py-3">
                  {certificates.length === 0 ? (
                    <div
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--status-error)' }}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Sin certificado de residencia fiscal. No se podrá solicitar el pago.
                    </div>
                  ) : hasExpiredOnly ? (
                    <div
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--status-error)' }}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Certificado vencido. Renueva antes de solicitar el pago.
                    </div>
                  ) : validCertificate ? (
                    <div
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--status-success)' }}
                    >
                      <Check className="h-4 w-4" />
                      Certificado vigente (
                      {getCertificateStatus(validCertificate.expiry_date).label})
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}
            {loadingCerts && <div className="skeleton h-12 w-full rounded" />}
          </div>
        )}

        {/* Step 2: Data */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="amount">
                  Importe <span style={{ color: 'var(--status-error)' }}>*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  placeholder="0.00"
                  error={!!errors.amount}
                />
                {errors.amount && (
                  <span className="text-xs" style={{ color: 'var(--status-error)' }}>
                    {errors.amount.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="currency">Divisa</Label>
                <Select id="currency" {...register('currency')}>
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="concept">
                Concepto <span style={{ color: 'var(--status-error)' }}>*</span>
              </Label>
              <Textarea
                id="concept"
                {...register('concept')}
                placeholder="Descripción del servicio o asunto"
                error={!!errors.concept}
              />
              {errors.concept && (
                <span className="text-xs" style={{ color: 'var(--status-error)' }}>
                  {errors.concept.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reference">Referencia (opcional)</Label>
              <Input
                id="reference"
                {...register('reference')}
                placeholder="Nº factura, expediente..."
              />
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <Card>
              <CardContent className="py-4">
                <dl className="flex flex-col gap-3">
                  <div className="flex justify-between">
                    <dt className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                      Corresponsal
                    </dt>
                    <dd className="text-sm font-medium" style={{ color: 'var(--g-text-primary)' }}>
                      {selectedCorrespondent?.name ?? '—'}
                    </dd>
                  </div>
                  <div className="border-t" style={{ borderColor: 'var(--g-border-default)' }} />
                  <div className="flex justify-between">
                    <dt className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                      Importe
                    </dt>
                    <dd className="text-lg font-bold" style={{ color: 'var(--g-brand-3308)' }}>
                      {formatAmount(amount || 0, currency || 'EUR')}
                    </dd>
                  </div>
                  <div className="border-t" style={{ borderColor: 'var(--g-border-default)' }} />
                  <div className="flex justify-between">
                    <dt className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                      Concepto
                    </dt>
                    <dd className="text-sm" style={{ color: 'var(--g-text-primary)' }}>
                      {concept || '—'}
                    </dd>
                  </div>
                  {reference && (
                    <>
                      <div
                        className="border-t"
                        style={{ borderColor: 'var(--g-border-default)' }}
                      />
                      <div className="flex justify-between">
                        <dt className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                          Referencia
                        </dt>
                        <dd className="text-sm" style={{ color: 'var(--g-text-primary)' }}>
                          {reference}
                        </dd>
                      </div>
                    </>
                  )}
                  <div className="border-t" style={{ borderColor: 'var(--g-border-default)' }} />
                  <div className="flex justify-between items-center">
                    <dt className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                      Certificado
                    </dt>
                    <dd>
                      {validCertificate ? (
                        <Badge variant="success">Vigente</Badge>
                      ) : (
                        <Badge variant="destructive">Sin certificado vigente</Badge>
                      )}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {!validCertificate && (
              <div
                className="flex items-start gap-2 p-3 text-xs"
                style={{
                  backgroundColor: 'hsl(0, 84%, 60%, 0.08)',
                  borderRadius: 'var(--g-radius-sm)',
                  color: 'var(--status-error)',
                }}
                role="alert"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Se creará la liquidación como borrador, pero no se podrá solicitar el pago hasta
                  que exista un certificado de residencia fiscal vigente.
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-6 -mx-6 -mb-4">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
          )}
          <div className="flex-1" />
          {step === 0 && (
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}
          {step < 2 ? (
            <Button type="button" onClick={handleNext}>
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" loading={loading}>
              Crear liquidación
            </Button>
          )}
        </DialogFooter>
      </form>
    </Dialog>
  )
}
