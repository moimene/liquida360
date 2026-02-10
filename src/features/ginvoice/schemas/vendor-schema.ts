import { z } from 'zod'

export const vendorSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del proveedor es obligatorio')
    .max(200, 'Máximo 200 caracteres'),
  tax_id: z
    .string()
    .min(1, 'El NIF/CIF es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  country: z
    .string()
    .min(1, 'El país es obligatorio'),
  compliance_status: z.enum(['compliant', 'expiring_soon', 'non_compliant']).default('non_compliant'),
})

export type VendorFormData = z.output<typeof vendorSchema>
export type VendorFormInput = z.input<typeof vendorSchema>

export const vendorDefaults: VendorFormInput = {
  name: '',
  tax_id: '',
  country: '',
  compliance_status: 'non_compliant',
}
