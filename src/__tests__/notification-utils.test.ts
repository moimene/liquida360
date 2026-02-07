import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatRelativeTime, getNotificationIcon } from '@/lib/notification-utils'

describe('notification-utils', () => {
  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns "Ahora" for dates less than 1 minute ago', () => {
      expect(formatRelativeTime('2026-06-15T11:59:30Z')).toBe('Ahora')
    })

    it('returns minutes for dates < 60 min ago', () => {
      const result = formatRelativeTime('2026-06-15T11:30:00Z')
      expect(result).toBe('Hace 30 min')
    })

    it('returns hours for dates < 24h ago', () => {
      const result = formatRelativeTime('2026-06-15T06:00:00Z')
      expect(result).toBe('Hace 6h')
    })

    it('returns "Ayer" for 1 day ago', () => {
      const result = formatRelativeTime('2026-06-14T12:00:00Z')
      expect(result).toBe('Ayer')
    })

    it('returns days for < 7 days ago', () => {
      const result = formatRelativeTime('2026-06-11T12:00:00Z')
      expect(result).toBe('Hace 4 días')
    })

    it('returns weeks for < 30 days ago', () => {
      const result = formatRelativeTime('2026-06-01T12:00:00Z')
      expect(result).toBe('Hace 2 sem')
    })

    it('returns months for > 30 days ago', () => {
      const result = formatRelativeTime('2026-03-15T12:00:00Z')
      expect(result).toMatch(/Hace \d+ mes/)
    })

    it('pluralizes months correctly', () => {
      const result = formatRelativeTime('2025-12-15T12:00:00Z')
      expect(result).toContain('meses')
    })
  })

  describe('getNotificationIcon', () => {
    it('returns correct icon for certificate_expiring', () => {
      expect(getNotificationIcon('certificate_expiring')).toBe('\u26A0\uFE0F')
    })

    it('returns correct icon for liquidation_approved', () => {
      expect(getNotificationIcon('liquidation_approved')).toBe('\u2705')
    })

    it('returns correct icon for payment_completed', () => {
      expect(getNotificationIcon('payment_completed')).toBe('\uD83D\uDCB0')
    })

    it('returns bell for unknown type', () => {
      expect(getNotificationIcon('unknown_type')).toBe('\uD83D\uDD14')
    })
  })
})
