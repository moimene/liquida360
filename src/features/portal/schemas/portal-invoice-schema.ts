import { z } from 'zod'

export const portalInvoiceSchema = z.object({
  amount: z
    .number({ message: 'Introduce un importe valido' })
    .positive('El importe debe ser mayor que 0'),
  currency: z.string().min(1, 'Selecciona una divisa').default('EUR'),
  concept: z
    .string()
    .min(3, 'El concepto debe tener al menos 3 caracteres')
    .max(500, 'El concepto no puede superar 500 caracteres'),
  reference: z
    .string()
    .max(100, 'La referencia no puede superar 100 caracteres')
    .nullable()
    .or(z.literal('')),
})

export type PortalInvoiceFormData = z.infer<typeof portalInvoiceSchema>
export type PortalInvoiceFormInput = z.input<typeof portalInvoiceSchema>

export const portalInvoiceDefaultValues: PortalInvoiceFormData = {
  amount: 0,
  currency: 'EUR',
  concept: '',
  reference: '',
}
