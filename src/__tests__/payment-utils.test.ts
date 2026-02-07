import { describe, it, expect } from 'vitest'
import { PAYMENT_STATUS_CONFIG, getPaymentStatusConfig } from '@/lib/payment-utils'

describe('payment-utils', () => {
  describe('PAYMENT_STATUS_CONFIG', () => {
    it('has 4 payment statuses', () => {
      const keys = Object.keys(PAYMENT_STATUS_CONFIG)
      expect(keys).toHaveLength(4)
      expect(keys).toContain('pending')
      expect(keys).toContain('in_progress')
      expect(keys).toContain('paid')
      expect(keys).toContain('rejected')
    })

    it('pending has warning badge', () => {
      expect(PAYMENT_STATUS_CONFIG.pending.badgeVariant).toBe('warning')
    })

    it('paid has success badge', () => {
      expect(PAYMENT_STATUS_CONFIG.paid.badgeVariant).toBe('success')
    })

    it('rejected has destructive badge', () => {
      expect(PAYMENT_STATUS_CONFIG.rejected.badgeVariant).toBe('destructive')
    })
  })

  describe('getPaymentStatusConfig', () => {
    it('returns correct config for in_progress', () => {
      const config = getPaymentStatusConfig('in_progress')
      expect(config.label).toBe('En proceso')
      expect(config.badgeVariant).toBe('default')
    })

    it('falls back to pending for unknown status', () => {
      const config = getPaymentStatusConfig('unknown_status')
      expect(config.label).toBe('Pendiente')
    })
  })
})
