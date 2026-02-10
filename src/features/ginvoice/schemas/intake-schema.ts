import { z } from 'zod'

export const intakeSchema = z.object({
  type: z.enum(['vendor_invoice', 'official_fee'], {
    message: 'El tipo es obligatorio',
  }),
  vendor_id: z.string().min(1, 'El proveedor es obligatorio').nullable().optional(),
  job_id: z.string().min(1, 'El Job es obligatorio'),
  currency: z.string().default('EUR'),
  amount: z
    .number({ message: 'El importe es obligatorio' })
    .positive('El importe debe ser mayor que 0'),
  invoice_number: z.string().nullable().or(z.literal('')).optional(),
  invoice_date: z.string().nullable().or(z.literal('')).optional(),
  concept_text: z.string().nullable().or(z.literal('')).optional(),
  approver_user_id: z.string().nullable().or(z.literal('')).optional(),
})

export type IntakeFormData = z.output<typeof intakeSchema>
export type IntakeFormInput = z.input<typeof intakeSchema>

export const intakeDefaults: IntakeFormInput = {
  type: 'vendor_invoice',
  vendor_id: '',
  job_id: '',
  currency: 'EUR',
  amount: 0,
  invoice_number: '',
  invoice_date: '',
  concept_text: '',
  approver_user_id: '',
}
