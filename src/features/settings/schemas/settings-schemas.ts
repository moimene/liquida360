import { z } from 'zod'

// ─── Alert Config Schema ─────────────────────────────────────────
export const alertConfigSchema = z.object({
  alert_type: z.string().min(1, 'El tipo de alerta es obligatorio'),
  days_before_expiry: z
    .number({ message: 'Debe ser un numero' })
    .int('Debe ser un numero entero')
    .min(1, 'Debe ser al menos 1 dia')
    .max(365, 'No puede superar 365 dias'),
  enabled: z.boolean().default(true),
})

export type AlertConfigFormData = z.infer<typeof alertConfigSchema>
export type AlertConfigFormInput = z.input<typeof alertConfigSchema>

export const alertConfigDefaultValues: AlertConfigFormData = {
  alert_type: 'certificate_expiry',
  days_before_expiry: 120,
  enabled: true,
}

export const ALERT_TYPE_OPTIONS = [
  { value: 'certificate_expiry', label: 'Vencimiento de certificado' },
] as const

// ─── Invite User Schema ──────────────────────────────────────────
export const inviteUserSchema = z.object({
  email: z.string().email('Email no valido'),
  role: z.enum(['pagador', 'supervisor', 'financiero', 'admin']),
})

export type InviteUserFormData = z.infer<typeof inviteUserSchema>

export const inviteUserDefaultValues: InviteUserFormData = {
  email: '',
  role: 'pagador',
}

export const ROLE_OPTIONS = [
  { value: 'pagador', label: 'Pagador' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'financiero', label: 'Financiero' },
  { value: 'admin', label: 'Administrador' },
] as const
