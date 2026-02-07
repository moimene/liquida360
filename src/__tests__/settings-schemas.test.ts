import { describe, it, expect } from 'vitest'
import {
  alertConfigSchema,
  inviteUserSchema,
  alertConfigDefaultValues,
  inviteUserDefaultValues,
} from '@/features/settings/schemas/settings-schemas'

describe('Settings Schemas', () => {
  // ─── Alert Config Schema ─────────────────────────────────────────
  describe('alertConfigSchema', () => {
    it('validates a correct alert config', () => {
      const result = alertConfigSchema.safeParse({
        alert_type: 'certificate_expiry',
        days_before_expiry: 90,
        enabled: true,
      })
      expect(result.success).toBe(true)
    })

    it('validates default values', () => {
      const result = alertConfigSchema.safeParse(alertConfigDefaultValues)
      expect(result.success).toBe(true)
    })

    it('rejects empty alert_type', () => {
      const result = alertConfigSchema.safeParse({
        alert_type: '',
        days_before_expiry: 90,
        enabled: true,
      })
      expect(result.success).toBe(false)
    })

    it('rejects zero days_before_expiry', () => {
      const result = alertConfigSchema.safeParse({
        alert_type: 'certificate_expiry',
        days_before_expiry: 0,
        enabled: true,
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative days_before_expiry', () => {
      const result = alertConfigSchema.safeParse({
        alert_type: 'certificate_expiry',
        days_before_expiry: -5,
        enabled: true,
      })
      expect(result.success).toBe(false)
    })

    it('rejects days_before_expiry over 365', () => {
      const result = alertConfigSchema.safeParse({
        alert_type: 'certificate_expiry',
        days_before_expiry: 400,
        enabled: true,
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-integer days_before_expiry', () => {
      const result = alertConfigSchema.safeParse({
        alert_type: 'certificate_expiry',
        days_before_expiry: 30.5,
        enabled: true,
      })
      expect(result.success).toBe(false)
    })

    it('defaults enabled to true when not provided', () => {
      const result = alertConfigSchema.safeParse({
        alert_type: 'certificate_expiry',
        days_before_expiry: 90,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.enabled).toBe(true)
      }
    })

    it('accepts enabled = false', () => {
      const result = alertConfigSchema.safeParse({
        alert_type: 'certificate_expiry',
        days_before_expiry: 30,
        enabled: false,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.enabled).toBe(false)
      }
    })

    it('accepts boundary value 1 day', () => {
      const result = alertConfigSchema.safeParse({
        alert_type: 'certificate_expiry',
        days_before_expiry: 1,
        enabled: true,
      })
      expect(result.success).toBe(true)
    })

    it('accepts boundary value 365 days', () => {
      const result = alertConfigSchema.safeParse({
        alert_type: 'certificate_expiry',
        days_before_expiry: 365,
        enabled: true,
      })
      expect(result.success).toBe(true)
    })

    it('rejects non-number days_before_expiry', () => {
      const result = alertConfigSchema.safeParse({
        alert_type: 'certificate_expiry',
        days_before_expiry: 'ninety',
        enabled: true,
      })
      expect(result.success).toBe(false)
    })
  })

  // ─── Invite User Schema ──────────────────────────────────────────
  describe('inviteUserSchema', () => {
    it('validates a correct invitation', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@empresa.com',
        role: 'pagador',
      })
      expect(result.success).toBe(true)
    })

    it('validates default values', () => {
      const result = inviteUserSchema.safeParse(inviteUserDefaultValues)
      // Default email is empty string, which should fail
      expect(result.success).toBe(false)
    })

    it('validates all internal roles', () => {
      for (const role of ['pagador', 'supervisor', 'financiero', 'admin']) {
        const result = inviteUserSchema.safeParse({
          email: 'test@test.com',
          role,
        })
        expect(result.success).toBe(true)
      }
    })

    it('rejects invalid email', () => {
      const result = inviteUserSchema.safeParse({
        email: 'not-an-email',
        role: 'pagador',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty email', () => {
      const result = inviteUserSchema.safeParse({
        email: '',
        role: 'pagador',
      })
      expect(result.success).toBe(false)
    })

    it('rejects corresponsal role', () => {
      const result = inviteUserSchema.safeParse({
        email: 'test@test.com',
        role: 'corresponsal',
      })
      expect(result.success).toBe(false)
    })

    it('rejects unknown role', () => {
      const result = inviteUserSchema.safeParse({
        email: 'test@test.com',
        role: 'unknown_role',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty role', () => {
      const result = inviteUserSchema.safeParse({
        email: 'test@test.com',
        role: '',
      })
      expect(result.success).toBe(false)
    })
  })
})
