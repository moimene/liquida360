import { describe, it, expect } from 'vitest'
import { generateCsv, csvFilename } from '@/lib/csv-export'

describe('CSV Export', () => {
  const sampleData = [
    { name: 'Juan García', amount: 1500.5, status: 'paid' },
    { name: 'María López', amount: 2300, status: 'pending' },
  ]

  const columns = [
    { header: 'Nombre', accessor: 'name' as const },
    { header: 'Importe', accessor: 'amount' as const },
    { header: 'Estado', accessor: 'status' as const },
  ]

  it('generates CSV with correct headers', () => {
    const csv = generateCsv(sampleData, columns)
    const lines = csv.split('\n')
    // First line after BOM is headers
    expect(lines[0]).toContain('Nombre,Importe,Estado')
  })

  it('includes BOM character at start', () => {
    const csv = generateCsv(sampleData, columns)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it('generates correct number of rows', () => {
    const csv = generateCsv(sampleData, columns)
    const lines = csv.split('\n')
    // BOM + header + 2 data rows
    expect(lines.length).toBe(3)
  })

  it('handles empty data array (headers only)', () => {
    const csv = generateCsv([], columns)
    const lines = csv.split('\n')
    expect(lines.length).toBe(1)
    expect(lines[0]).toContain('Nombre,Importe,Estado')
  })

  it('escapes double quotes in cell values', () => {
    const data = [{ name: 'Juan "El Grande"', amount: 100, status: 'ok' }]
    const csv = generateCsv(data, columns)
    expect(csv).toContain('"Juan ""El Grande"""')
  })

  it('wraps cells containing commas in quotes', () => {
    const data = [{ name: 'López, García', amount: 100, status: 'ok' }]
    const csv = generateCsv(data, columns)
    expect(csv).toContain('"López, García"')
  })

  it('handles accessor functions correctly', () => {
    const columnsWithFn = [
      { header: 'Nombre', accessor: (row: (typeof sampleData)[0]) => row.name.toUpperCase() },
      { header: 'Importe', accessor: 'amount' as const },
    ]
    const csv = generateCsv(sampleData, columnsWithFn)
    expect(csv).toContain('JUAN GARCÍA')
  })

  it('handles null/undefined values gracefully', () => {
    const data = [{ name: null, amount: undefined, status: 'ok' }] as unknown as typeof sampleData
    const csv = generateCsv(data, columns)
    // Should not throw and should have empty cells
    expect(csv).toContain(',,ok')
  })

  it('generates filename with correct format', () => {
    const filename = csvFilename('liquidaciones')
    expect(filename).toMatch(/^liquidaciones_\d{4}-\d{2}-\d{2}\.csv$/)
  })
})
