import { z } from 'zod'

export const jobSchema = z.object({
  job_code: z
    .string()
    .min(1, 'El código de job es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  client_code: z
    .string()
    .min(1, 'El código de cliente es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  client_name: z
    .string()
    .min(1, 'El nombre de cliente es obligatorio')
    .max(200, 'Máximo 200 caracteres'),
  uttai_status: z.enum(['clear', 'blocked', 'pending_review']).default('clear'),
  uttai_subject_obliged: z.boolean().nullable().optional(),
  owner_user_id: z.string().nullable().or(z.literal('')).optional(),
  status: z.string().default('active'),
})

export type JobFormData = z.output<typeof jobSchema>
export type JobFormInput = z.input<typeof jobSchema>

export const jobDefaults: JobFormInput = {
  job_code: '',
  client_code: '',
  client_name: '',
  uttai_status: 'clear',
  uttai_subject_obliged: null,
  owner_user_id: '',
  status: 'active',
}
