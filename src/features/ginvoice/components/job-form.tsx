import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { jobSchema, jobDefaults, type JobFormInput, type JobFormData } from '../schemas/job-schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

interface JobFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: JobFormData) => Promise<void>
  submitting?: boolean
  defaultValues?: Partial<JobFormInput>
}

export function JobForm({ open, onClose, onSubmit, submitting, defaultValues }: JobFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobFormInput, unknown, JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: { ...jobDefaults, ...defaultValues },
  })

  function handleClose() {
    reset(jobDefaults)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Nuevo Job"
      description="Registra un nuevo job/cliente en el catálogo maestro"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--g-text-primary)' }}
          >
            Código Job <span style={{ color: 'var(--status-error)' }}>*</span>
          </label>
          <Input
            {...register('job_code')}
            placeholder="ej. J-2026-0001"
            aria-describedby={errors.job_code ? 'job_code-error' : undefined}
          />
          {errors.job_code && (
            <p id="job_code-error" className="text-xs mt-1" style={{ color: 'var(--status-error)' }}>
              {errors.job_code.message}
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--g-text-primary)' }}
          >
            Código Cliente <span style={{ color: 'var(--status-error)' }}>*</span>
          </label>
          <Input
            {...register('client_code')}
            placeholder="ej. CLI-001"
            aria-describedby={errors.client_code ? 'client_code-error' : undefined}
          />
          {errors.client_code && (
            <p id="client_code-error" className="text-xs mt-1" style={{ color: 'var(--status-error)' }}>
              {errors.client_code.message}
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--g-text-primary)' }}
          >
            Nombre Cliente <span style={{ color: 'var(--status-error)' }}>*</span>
          </label>
          <Input
            {...register('client_name')}
            placeholder="Nombre completo del cliente"
            aria-describedby={errors.client_name ? 'client_name-error' : undefined}
          />
          {errors.client_name && (
            <p id="client_name-error" className="text-xs mt-1" style={{ color: 'var(--status-error)' }}>
              {errors.client_name.message}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Job
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
