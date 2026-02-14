import { describe, it, expect } from 'vitest'
import {
  STATUS_CONFIG,
  getStatusConfig,
  formatAmount,
  STATUS_TIMELINE,
} from '@/lib/liquidation-utils'

describe('liquidation-utils', () => {
  describe('STATUS_CONFIG', () => {
    it('has all 6 statuses defined', () => {
      const keys = Object.keys(STATUS_CONFIG)
      expect(keys).toContain('draft')
      expect(keys).toContain('pending_approval')
      expect(keys).toContain('approved')
      expect(keys).toContain('payment_requested')
      expect(keys).toContain('paid')
      expect(keys).toContain('rejected')
    })

    it('rejected has step -1', () => {
      expect(STATUS_CONFIG.rejected.step).toBe(-1)
    })

    it('draft has step 0', () => {
      expect(STATUS_CONFIG.draft.step).toBe(0)
    })

    it('paid has step 4', () => {
      expect(STATUS_CONFIG.paid.step).toBe(4)
    })
  })

  describe('getStatusConfig', () => {
    it('returns correct config for known status', () => {
      const config = getStatusConfig('approved')
      expect(config.label).toBe('Aceptada')
      expect(config.badgeVariant).toBe('success')
    })

    it('falls back to draft for unknown status', () => {
      const config = getStatusConfig('nonexistent')
      expect(config.label).toBe('Borrador')
    })
  })

  describe('formatAmount', () => {
    it('formats EUR correctly', () => {
      const result = formatAmount(1500.5, 'EUR')
      // Intl.NumberFormat output varies by environment locale support
      expect(result).toMatch(/1[.]?500,50/)
      expect(result).toMatch(/€|EUR/)
    })

    it('formats USD correctly', () => {
      const result = formatAmount(2000, 'USD')
      expect(result).toMatch(/2[.]?000,00/)
      expect(result).toMatch(/\$|US/)
    })

    it('formats zero amount', () => {
      const result = formatAmount(0, 'EUR')
      expect(result).toMatch(/0,00/)
    })

    it('formats large amounts with currency symbol', () => {
      const result = formatAmount(1234567.89, 'EUR')
      expect(result).toMatch(/€|EUR/)
      expect(result).toContain('89')
    })
  })

  describe('STATUS_TIMELINE', () => {
    it('has 5 timeline steps (excludes rejected)', () => {
      expect(STATUS_TIMELINE).toHaveLength(5)
    })

    it('starts with draft and ends with paid', () => {
      expect(STATUS_TIMELINE[0].key).toBe('draft')
      expect(STATUS_TIMELINE[4].key).toBe('paid')
    })
  })
})
