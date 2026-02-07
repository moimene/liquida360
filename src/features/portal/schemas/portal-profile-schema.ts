import { z } from 'zod'

export const portalProfileSchema = z.object({
  address: z.string().min(1, 'La direccion es obligatoria').max(500, 'Maximo 500 caracteres'),
  email: z.string().email('Introduce un email valido').nullable().or(z.literal('')),
  phone: z.string().max(30, 'Maximo 30 caracteres').nullable().or(z.literal('')),
})

export type PortalProfileFormData = z.infer<typeof portalProfileSchema>
