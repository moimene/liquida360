import { describe, it, expect } from 'vitest'
import {
  APP_NAME,
  CERTIFICATE_ALERT_DEFAULTS,
  LIQUIDATION_STATUS,
  PAYMENT_REQUEST_STATUS,
  CERTIFICATE_STATUS,
  USER_ROLES,
} from '@/lib/constants'

describe('constants', () => {
  it('APP_NAME is LIQUIDA360', () => {
    expect(APP_NAME).toBe('LIQUIDA360')
  })

  describe('CERTIFICATE_ALERT_DEFAULTS', () => {
    it('first alert at 90 days', () => {
      expect(CERTIFICATE_ALERT_DEFAULTS.FIRST_ALERT_DAYS).toBe(90)
    })

    it('second alert at 30 days', () => {
      expect(CERTIFICATE_ALERT_DEFAULTS.SECOND_ALERT_DAYS).toBe(30)
    })

    it('default validity is 1 year', () => {
      expect(CERTIFICATE_ALERT_DEFAULTS.DEFAULT_VALIDITY_YEARS).toBe(1)
    })
  })

  describe('LIQUIDATION_STATUS', () => {
    it('has 6 statuses', () => {
      expect(Object.keys(LIQUIDATION_STATUS)).toHaveLength(6)
    })

    it('follows correct workflow order', () => {
      expect(LIQUIDATION_STATUS.DRAFT).toBe('draft')
      expect(LIQUIDATION_STATUS.PENDING_APPROVAL).toBe('pending_approval')
      expect(LIQUIDATION_STATUS.APPROVED).toBe('approved')
      expect(LIQUIDATION_STATUS.PAYMENT_REQUESTED).toBe('payment_requested')
      expect(LIQUIDATION_STATUS.PAID).toBe('paid')
      expect(LIQUIDATION_STATUS.REJECTED).toBe('rejected')
    })
  })

  describe('PAYMENT_REQUEST_STATUS', () => {
    it('has 4 statuses', () => {
      expect(Object.keys(PAYMENT_REQUEST_STATUS)).toHaveLength(4)
    })
  })

  describe('CERTIFICATE_STATUS', () => {
    it('has 3 statuses', () => {
      expect(Object.keys(CERTIFICATE_STATUS)).toHaveLength(3)
    })
  })

  describe('USER_ROLES', () => {
    it('has 5 roles', () => {
      expect(Object.keys(USER_ROLES)).toHaveLength(5)
    })

    it('includes all expected roles', () => {
      expect(USER_ROLES.PAGADOR).toBe('pagador')
      expect(USER_ROLES.SUPERVISOR).toBe('supervisor')
      expect(USER_ROLES.FINANCIERO).toBe('financiero')
      expect(USER_ROLES.ADMIN).toBe('admin')
      expect(USER_ROLES.CORRESPONSAL).toBe('corresponsal')
    })
  })
})
