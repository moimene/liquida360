import { describe, it, expect } from 'vitest'
import { buildSearchIndex, searchEntities } from '@/lib/search-index'

// Minimal mock data matching type shapes
const correspondents = [
  {
    id: 'c1',
    name: 'Bufete Madrid',
    country: 'ES',
    tax_id: 'B12345678',
    email: 'madrid@bufete.com',
    phone: null,
    address: null,
    status: 'active',
    user_id: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 'c2',
    name: 'Law Firm London',
    country: 'GB',
    tax_id: 'GB999999',
    email: 'london@firm.com',
    phone: null,
    address: null,
    status: 'active',
    user_id: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
]

const liquidations = [
  {
    id: 'l1',
    correspondent_id: 'c1',
    certificate_id: null,
    amount: 5000,
    currency: 'EUR',
    concept: 'Honorarios consultoria',
    reference: 'REF-001',
    invoice_url: null,
    status: 'paid',
    created_by: 'u1',
    approved_by: null,
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    correspondents: { name: 'Bufete Madrid' },
  },
]

const certificates = [
  {
    id: 'cert1',
    correspondent_id: 'c1',
    issuing_country: 'ES',
    issue_date: '2025-01-01',
    expiry_date: '2026-12-31',
    document_url: null,
    status: 'valid',
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
    correspondents: { name: 'Bufete Madrid' },
  },
]

const payments = [
  {
    id: 'p1',
    liquidation_id: 'l1',
    status: 'paid',
    requested_at: '2026-01-20',
    processed_at: '2026-01-21',
    processed_by: 'u2',
    payment_proof_url: null,
    notes: null,
    liquidations: {
      ...liquidations[0],
      correspondents: { name: 'Bufete Madrid' },
    },
  },
]

describe('Search Index', () => {
  it('builds index from all entity types', () => {
    const index = buildSearchIndex(
      correspondents as never[],
      liquidations as never[],
      certificates as never[],
      payments as never[],
    )
    // 2 correspondents + 1 liquidation + 1 certificate + 1 payment = 5
    expect(index.length).toBe(5)
  })

  it('returns empty array for empty query', () => {
    const index = buildSearchIndex(
      correspondents as never[],
      liquidations as never[],
      certificates as never[],
      payments as never[],
    )
    const results = searchEntities(index, '')
    expect(results).toEqual([])
  })

  it('finds correspondents by name (case insensitive)', () => {
    const index = buildSearchIndex(
      correspondents as never[],
      liquidations as never[],
      certificates as never[],
      payments as never[],
    )
    const results = searchEntities(index, 'madrid')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.type === 'correspondent' && r.title === 'Bufete Madrid')).toBe(
      true,
    )
  })

  it('finds liquidations by concept', () => {
    const index = buildSearchIndex(
      correspondents as never[],
      liquidations as never[],
      certificates as never[],
      payments as never[],
    )
    const results = searchEntities(index, 'consultoria')
    expect(results.some((r) => r.type === 'liquidation')).toBe(true)
  })

  it('respects limit parameter', () => {
    const index = buildSearchIndex(
      correspondents as never[],
      liquidations as never[],
      certificates as never[],
      payments as never[],
    )
    const results = searchEntities(index, 'bufete', 1)
    expect(results.length).toBeLessThanOrEqual(1)
  })

  it('returns entries from multiple entity types', () => {
    const index = buildSearchIndex(
      correspondents as never[],
      liquidations as never[],
      certificates as never[],
      payments as never[],
    )
    // "bufete madrid" appears in correspondent, liquidation, certificate, and payment
    const results = searchEntities(index, 'bufete')
    const types = new Set(results.map((r) => r.type))
    expect(types.size).toBeGreaterThan(1)
  })
})
