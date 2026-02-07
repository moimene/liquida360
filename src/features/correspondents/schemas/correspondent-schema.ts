import { z } from 'zod'

export const correspondentSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede superar 200 caracteres'),
  country: z.string().min(2, 'Selecciona un país'),
  tax_id: z
    .string()
    .min(3, 'El NIF/Tax ID debe tener al menos 3 caracteres')
    .max(50, 'El NIF/Tax ID no puede superar 50 caracteres'),
  address: z
    .string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(500, 'La dirección no puede superar 500 caracteres'),
  email: z.string().email('Email no válido').nullable().or(z.literal('')),
  phone: z
    .string()
    .max(30, 'El teléfono no puede superar 30 caracteres')
    .nullable()
    .or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
})

export type CorrespondentFormData = z.infer<typeof correspondentSchema>
export type CorrespondentFormInput = z.input<typeof correspondentSchema>

export const correspondentDefaultValues: CorrespondentFormData = {
  name: '',
  country: '',
  tax_id: '',
  address: '',
  email: '',
  phone: '',
  status: 'active',
}
