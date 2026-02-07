import { z } from 'zod'

export const certificateSchema = z
  .object({
    correspondent_id: z.string().uuid('Selecciona un corresponsal'),
    issuing_country: z.string().min(2, 'Selecciona el país emisor del certificado'),
    issue_date: z.string().min(1, 'La fecha de emisión es obligatoria'),
    expiry_date: z.string().min(1, 'La fecha de vencimiento es obligatoria'),
  })
  .refine(
    (data) => {
      if (!data.issue_date || !data.expiry_date) return true
      return new Date(data.expiry_date) > new Date(data.issue_date)
    },
    {
      message: 'La fecha de vencimiento debe ser posterior a la de emisión',
      path: ['expiry_date'],
    },
  )

export type CertificateFormData = z.infer<typeof certificateSchema>

export const certificateDefaultValues: CertificateFormData = {
  correspondent_id: '',
  issuing_country: '',
  issue_date: '',
  expiry_date: '',
}
