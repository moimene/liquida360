import { describe, it, expect } from 'vitest'
import { correspondentSchema } from '@/features/correspondents/schemas/correspondent-schema'
import { certificateSchema } from '@/features/certificates/schemas/certificate-schema'
import { liquidationSchema } from '@/features/liquidations/schemas/liquidation-schema'
import { processPaymentSchema } from '@/features/payments/schemas/payment-request-schema'

describe('Zod Schemas', () => {
  describe('correspondentSchema', () => {
    it('validates a valid correspondent', () => {
      const result = correspondentSchema.safeParse({
        name: 'Baker McKenzie',
        country: 'ES',
        tax_id: 'B12345678',
        address: 'Calle Mayor 1, Madrid',
        email: 'info@bakermckenzie.com',
        phone: '+34 911 234 567',
        status: 'active',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = correspondentSchema.safeParse({
        name: '',
        country: 'ES',
        tax_id: 'B12345678',
        address: 'Calle Mayor 1, Madrid',
        email: '',
        phone: '',
        status: 'active',
      })
      expect(result.success).toBe(false)
    })

    it('rejects name shorter than 2 chars', () => {
      const result = correspondentSchema.safeParse({
        name: 'A',
        country: 'ES',
        tax_id: 'B12345678',
        address: 'Calle Mayor 1, Madrid',
        email: '',
        phone: '',
        status: 'active',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid email format', () => {
      const result = correspondentSchema.safeParse({
        name: 'Test Corp',
        country: 'ES',
        tax_id: 'B12345678',
        address: 'Calle Mayor 1, Madrid',
        email: 'not-an-email',
        phone: '',
        status: 'active',
      })
      expect(result.success).toBe(false)
    })

    it('allows null/empty email and phone', () => {
      const result = correspondentSchema.safeParse({
        name: 'Test Corp',
        country: 'ES',
        tax_id: 'B12345678',
        address: 'Calle Mayor 1, Madrid',
        email: '',
        phone: '',
        status: 'active',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid status', () => {
      const result = correspondentSchema.safeParse({
        name: 'Test Corp',
        country: 'ES',
        tax_id: 'B12345678',
        address: 'Calle Mayor 1, Madrid',
        email: '',
        phone: '',
        status: 'deleted',
      })
      expect(result.success).toBe(false)
    })

    it('rejects short tax_id', () => {
      const result = correspondentSchema.safeParse({
        name: 'Test Corp',
        country: 'ES',
        tax_id: 'AB',
        address: 'Calle Mayor 1, Madrid',
        email: '',
        phone: '',
        status: 'active',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('certificateSchema', () => {
    it('validates a valid certificate', () => {
      const result = certificateSchema.safeParse({
        correspondent_id: '550e8400-e29b-41d4-a716-446655440000',
        issuing_country: 'ES',
        issue_date: '2026-01-01',
        expiry_date: '2027-01-01',
        apostilled: false,
      })
      expect(result.success).toBe(true)
    })

    it('rejects when expiry_date is before issue_date', () => {
      const result = certificateSchema.safeParse({
        correspondent_id: '550e8400-e29b-41d4-a716-446655440000',
        issuing_country: 'ES',
        issue_date: '2027-01-01',
        expiry_date: '2026-01-01',
        apostilled: false,
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-UUID correspondent_id', () => {
      const result = certificateSchema.safeParse({
        correspondent_id: 'not-a-uuid',
        issuing_country: 'ES',
        issue_date: '2026-01-01',
        expiry_date: '2027-01-01',
        apostilled: false,
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty issuing_country', () => {
      const result = certificateSchema.safeParse({
        correspondent_id: '550e8400-e29b-41d4-a716-446655440000',
        issuing_country: '',
        issue_date: '2026-01-01',
        expiry_date: '2027-01-01',
        apostilled: false,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('liquidationSchema', () => {
    it('validates a valid liquidation', () => {
      const result = liquidationSchema.safeParse({
        correspondent_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 1500.5,
        currency: 'EUR',
        concept: 'Honorarios Q1 2026',
        reference: 'REF-001',
      })
      expect(result.success).toBe(true)
    })

    it('rejects zero amount', () => {
      const result = liquidationSchema.safeParse({
        correspondent_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 0,
        currency: 'EUR',
        concept: 'Honorarios Q1 2026',
        reference: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative amount', () => {
      const result = liquidationSchema.safeParse({
        correspondent_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: -100,
        currency: 'EUR',
        concept: 'Honorarios Q1 2026',
        reference: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects concept shorter than 3 chars', () => {
      const result = liquidationSchema.safeParse({
        correspondent_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 100,
        currency: 'EUR',
        concept: 'AB',
        reference: '',
      })
      expect(result.success).toBe(false)
    })

    it('allows empty reference', () => {
      const result = liquidationSchema.safeParse({
        correspondent_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 100,
        currency: 'EUR',
        concept: 'Honorarios Q1',
        reference: '',
      })
      expect(result.success).toBe(true)
    })

    it('rejects non-numeric amount', () => {
      const result = liquidationSchema.safeParse({
        correspondent_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 'abc',
        currency: 'EUR',
        concept: 'Honorarios Q1',
        reference: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('processPaymentSchema', () => {
    it('validates empty notes', () => {
      const result = processPaymentSchema.safeParse({ notes: '' })
      expect(result.success).toBe(true)
    })

    it('validates notes with text', () => {
      const result = processPaymentSchema.safeParse({ notes: 'Pago procesado via transferencia' })
      expect(result.success).toBe(true)
    })

    it('rejects notes longer than 500 chars', () => {
      const result = processPaymentSchema.safeParse({ notes: 'A'.repeat(501) })
      expect(result.success).toBe(false)
    })

    it('allows null notes', () => {
      const result = processPaymentSchema.safeParse({ notes: null })
      expect(result.success).toBe(true)
    })
  })
})
