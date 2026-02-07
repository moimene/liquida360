import { z } from 'zod'

export const liquidationSchema = z.object({
  correspondent_id: z.string().uuid('Selecciona un corresponsal'),
  amount: z
    .number({ message: 'Introduce un importe válido' })
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

export type LiquidationFormData = z.infer<typeof liquidationSchema>
export type LiquidationFormInput = z.input<typeof liquidationSchema>

export const liquidationDefaultValues: LiquidationFormData = {
  correspondent_id: '',
  amount: 0,
  currency: 'EUR',
  concept: '',
  reference: '',
}

export const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dólar USA' },
  { code: 'GBP', symbol: '£', name: 'Libra esterlina' },
  { code: 'CHF', symbol: 'CHF', name: 'Franco suizo' },
  { code: 'BRL', symbol: 'R$', name: 'Real brasileño' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano' },
  { code: 'CLP', symbol: '$', name: 'Peso chileno' },
  { code: 'COP', symbol: '$', name: 'Peso colombiano' },
  { code: 'PEN', symbol: 'S/', name: 'Sol peruano' },
  { code: 'ARS', symbol: '$', name: 'Peso argentino' },
] as const
