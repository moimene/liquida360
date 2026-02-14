import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCertificateStatus,
  formatDate,
  getDefaultExpiryDate,
  validateCountryMatch,
  filterExpiringCertificates,
} from '@/lib/certificate-utils'
import type { Certificate } from '@/types'

describe('certificate-utils', () => {
  describe('getCertificateStatus', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-06-15'))
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns expired for past dates', () => {
      const result = getCertificateStatus('2026-06-10')
      expect(result.status).toBe('expired')
      expect(result.daysRemaining).toBeLessThan(0)
      expect(result.badgeVariant).toBe('destructive')
    })

    it('returns expiring_soon (destructive) for dates within 30 days', () => {
      const result = getCertificateStatus('2026-07-10')
      expect(result.status).toBe('expiring_soon')
      expect(result.badgeVariant).toBe('destructive')
      expect(result.daysRemaining).toBeLessThanOrEqual(30)
    })

    it('returns expiring_soon (destructive) for dates within 120 days', () => {
      const result = getCertificateStatus('2026-09-20')
      expect(result.status).toBe('expiring_soon')
      expect(result.badgeVariant).toBe('destructive')
      expect(result.daysRemaining).toBeLessThanOrEqual(120)
    })

    it('returns valid for dates > 120 days out', () => {
      const result = getCertificateStatus('2027-06-15')
      expect(result.status).toBe('valid')
      expect(result.badgeVariant).toBe('success')
      expect(result.daysRemaining).toBeGreaterThan(120)
    })

    it('label contains days remaining for valid cert', () => {
      const result = getCertificateStatus('2027-06-15')
      expect(result.label).toContain('Vigente')
      expect(result.label).toContain('días')
    })

    it('label says "Vencido" for expired cert', () => {
      const result = getCertificateStatus('2026-01-01')
      expect(result.label).toContain('Vencido')
    })
  })

  describe('formatDate', () => {
    it('formats an ISO date to dd MMM yyyy in Spanish', () => {
      const result = formatDate('2026-03-15')
      expect(result).toMatch(/15/)
      expect(result).toMatch(/mar/i)
      expect(result).toMatch(/2026/)
    })
  })

  describe('getDefaultExpiryDate', () => {
    it('adds 1 year to the issue date', () => {
      const result = getDefaultExpiryDate('2026-06-15')
      expect(result).toBe('2027-06-15')
    })

    it('handles leap year correctly', () => {
      const result = getDefaultExpiryDate('2028-02-29')
      // 2029 is not a leap year, so Feb 29 + 1 year = Mar 1
      expect(result).toBe('2029-03-01')
    })
  })

  describe('validateCountryMatch', () => {
    it('returns valid when countries match', () => {
      const result = validateCountryMatch('ES', 'ES')
      expect(result.valid).toBe(true)
    })

    it('returns invalid when countries differ', () => {
      const result = validateCountryMatch('FR', 'ES')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('FR')
      expect(result.message).toContain('ES')
    })
  })

  describe('filterExpiringCertificates', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-06-15'))
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    const certs: Certificate[] = [
      {
        id: '1',
        correspondent_id: 'c1',
        issuing_country: 'ES',
        issue_date: '2025-01-01',
        expiry_date: '2026-07-01', // within 120 days
        certificate_type: 'residence',
        document_url: null,
        status: 'valid',
        apostilled: false,
        apostille_requirement: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        correspondent_id: 'c2',
        issuing_country: 'FR',
        issue_date: '2025-01-01',
        expiry_date: '2027-12-01', // far future
        certificate_type: 'residence',
        document_url: null,
        status: 'valid',
        apostilled: false,
        apostille_requirement: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ]

    it('filters only certs within threshold', () => {
      const result = filterExpiringCertificates(certs)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('accepts custom threshold', () => {
      const result = filterExpiringCertificates(certs, 365 * 2)
      expect(result).toHaveLength(2)
    })
  })
})
