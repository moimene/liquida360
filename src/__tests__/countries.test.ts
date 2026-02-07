import { describe, it, expect } from 'vitest'
import { COUNTRIES } from '@/lib/countries'

describe('countries', () => {
  it('contains 54 countries', () => {
    expect(COUNTRIES).toHaveLength(54)
  })

  it('all entries have code and name', () => {
    for (const country of COUNTRIES) {
      expect(country.code).toBeTruthy()
      expect(country.name).toBeTruthy()
      expect(country.code.length).toBe(2)
    }
  })

  it('codes are unique', () => {
    const codes = COUNTRIES.map((c) => c.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('is sorted alphabetically by name', () => {
    const names = COUNTRIES.map((c) => c.name)
    const sorted = [...names].sort((a, b) => a.localeCompare(b, 'es'))
    expect(names).toEqual(sorted)
  })

  it('contains key countries (ES, US, GB, FR, DE)', () => {
    const codes = COUNTRIES.map((c) => c.code)
    expect(codes).toContain('ES')
    expect(codes).toContain('US')
    expect(codes).toContain('GB')
    expect(codes).toContain('FR')
    expect(codes).toContain('DE')
  })
})
