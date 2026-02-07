import { z } from 'zod'

export const processPaymentSchema = z.object({
  notes: z
    .string()
    .max(500, 'Las notas no pueden superar 500 caracteres')
    .nullable()
    .or(z.literal('')),
})

export type ProcessPaymentFormData = z.infer<typeof processPaymentSchema>

export const processPaymentDefaultValues: ProcessPaymentFormData = {
  notes: '',
}
