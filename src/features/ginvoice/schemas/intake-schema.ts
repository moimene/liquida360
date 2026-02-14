import { z } from 'zod'

const exchangeRateToEurSchema = z.preprocess(
  (value) => {
    if (value === '' || value === null || typeof value === 'undefined') return null
    if (typeof value === 'number') return value
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : value
  },
  z
    .number({ message: 'El tipo de cambio debe ser un numero valido' })
    .positive('El tipo de cambio debe ser mayor que 0')
    .nullable()
    .optional(),
)

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
  exchange_rate_to_eur: exchangeRateToEurSchema,
  nrc_number: z.string().nullable().or(z.literal('')).optional(),
  invoice_number: z.string().nullable().or(z.literal('')).optional(),
  invoice_date: z.string().nullable().or(z.literal('')).optional(),
  official_organism: z.string().nullable().or(z.literal('')).optional(),
  tariff_type: z.enum(['general', 'special']).nullable().or(z.literal('')).optional(),
  concept_text: z.string().nullable().or(z.literal('')).optional(),
  approver_user_id: z.string().nullable().or(z.literal('')).optional(),
}).superRefine((value, ctx) => {
  if (value.currency.toUpperCase() === 'EUR') return
  if (typeof value.exchange_rate_to_eur === 'number' && value.exchange_rate_to_eur > 0) return
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: ['exchange_rate_to_eur'],
    message: 'El tipo de cambio es obligatorio cuando la moneda no es EUR',
  })
})

export type IntakeFormData = z.output<typeof intakeSchema>
export type IntakeFormInput = z.input<typeof intakeSchema>

export const intakeDefaults: IntakeFormInput = {
  type: 'vendor_invoice',
  vendor_id: '',
  job_id: '',
  currency: 'EUR',
  amount: 0,
  exchange_rate_to_eur: null,
  nrc_number: '',
  invoice_number: '',
  invoice_date: '',
  official_organism: '',
  tariff_type: null,
  concept_text: '',
  approver_user_id: '',
}
