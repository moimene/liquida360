import { z } from 'zod'

export const portalProfileSchema = z.object({
  address: z.string().min(1, 'La direccion es obligatoria').max(500, 'Maximo 500 caracteres'),
  email: z.string().email('Introduce un email valido').nullable().or(z.literal('')),
  phone: z.string().max(30, 'Maximo 30 caracteres').nullable().or(z.literal('')),
  bank_account_holder: z.string().max(200, 'Maximo 200 caracteres').nullable().or(z.literal('')),
  bank_account_iban: z
    .string()
    .max(50, 'Maximo 50 caracteres')
    .regex(/^[A-Za-z0-9\s-]*$/, 'IBAN con caracteres no validos')
    .nullable()
    .or(z.literal('')),
  bank_swift_bic: z
    .string()
    .max(20, 'Maximo 20 caracteres')
    .regex(/^[A-Za-z0-9\s-]*$/, 'SWIFT/BIC con caracteres no validos')
    .nullable()
    .or(z.literal('')),
})

export type PortalProfileFormData = z.infer<typeof portalProfileSchema>
