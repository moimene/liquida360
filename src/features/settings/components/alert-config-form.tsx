import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  alertConfigSchema,
  alertConfigDefaultValues,
  ALERT_TYPE_OPTIONS,
  type AlertConfigFormData,
  type AlertConfigFormInput,
} from '../schemas/settings-schemas'
import type { AlertConfig } from '@/types'

interface AlertConfigFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: AlertConfigFormData) => Promise<void>
  config?: AlertConfig | null
  loading?: boolean
}

export function AlertConfigForm({
  open,
  onClose,
  onSubmit,
  config,
  loading,
}: AlertConfigFormProps) {
  const isEdit = !!config

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AlertConfigFormInput, unknown, AlertConfigFormData>({
    resolver: zodResolver(alertConfigSchema),
    defaultValues: config
      ? {
          alert_type: config.alert_type,
          days_before_expiry: config.days_before_expiry,
          enabled: config.enabled,
        }
      : alertConfigDefaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        config
          ? {
              alert_type: config.alert_type,
              days_before_expiry: config.days_before_expiry,
              enabled: config.enabled,
            }
          : alertConfigDefaultValues,
      )
    }
  }, [open, config, reset])

  async function handleFormSubmit(data: AlertConfigFormData) {
    await onSubmit(data)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar alerta' : 'Nueva alerta'}
      description="Configura cuando se envian alertas de vencimiento de certificados."
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="alert_type">
            Tipo de alerta <span style={{ color: 'var(--status-error)' }}>*</span>
          </Label>
          <select
            id="alert_type"
            {...register('alert_type')}
            className="flex h-10 w-full items-center px-3 text-sm"
            style={{
              backgroundColor: 'var(--g-surface-card)',
              border: '1px solid var(--g-border-default)',
              borderRadius: 'var(--g-radius-sm)',
              color: 'var(--g-text-primary)',
            }}
            aria-describedby={errors.alert_type ? 'alert_type-error' : undefined}
          >
            {ALERT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.alert_type && (
            <span
              id="alert_type-error"
              className="text-sm"
              style={{ color: 'var(--status-error)' }}
            >
              {errors.alert_type.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="days_before_expiry">
            Dias antes del vencimiento <span style={{ color: 'var(--status-error)' }}>*</span>
          </Label>
          <Input
            id="days_before_expiry"
            type="number"
            {...register('days_before_expiry', { valueAsNumber: true })}
            placeholder="120"
            error={!!errors.days_before_expiry}
            aria-describedby={errors.days_before_expiry ? 'days-error' : undefined}
          />
          {errors.days_before_expiry && (
            <span id="days-error" className="text-sm" style={{ color: 'var(--status-error)' }}>
              {errors.days_before_expiry.message}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            id="enabled"
            type="checkbox"
            {...register('enabled')}
            className="h-4 w-4 rounded"
            style={{ accentColor: 'var(--g-brand-3308)' }}
          />
          <Label htmlFor="enabled" className="cursor-pointer">
            Alerta activa
          </Label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear alerta'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
