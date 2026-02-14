import { describe, expect, it } from 'vitest'
import {
  buildCollectionSnapshot,
  dedupeCollectionsForExport,
  deriveDueDate,
} from '@/features/ginvoice/lib/collections'

describe('deriveDueDate', () => {
  it('uses explicit due date when present', () => {
    expect(deriveDueDate({ due_date: '2026-04-30', sap_invoice_date: '2026-03-01' })).toBe('2026-04-30')
  })

  it('derives due date from sap_invoice_date + 60 days', () => {
    expect(deriveDueDate({ due_date: null, sap_invoice_date: '2026-03-01' })).toBe('2026-04-30')
  })
})

describe('buildCollectionSnapshot', () => {
  const today = new Date('2026-05-15T12:00:00.000Z')

  it('classifies invoice as overdue when due date has passed and outstanding > 0', () => {
    const snapshot = buildCollectionSnapshot(
      {
        collection_status: 'pending',
        amount_paid_eur: 10,
        amount_due_eur: 100,
        sap_payload: {},
        due_date: '2026-05-10',
        sap_invoice_date: '2026-03-01',
      },
      today,
    )

    expect(snapshot.bucket).toBe('overdue')
    expect(snapshot.daysOverdue).toBe(5)
    expect(snapshot.outstandingEur).toBe(90)
  })

  it('classifies invoice as pending when due date is in the future', () => {
    const snapshot = buildCollectionSnapshot(
      {
        collection_status: 'pending',
        amount_paid_eur: 0,
        amount_due_eur: 100,
        sap_payload: {},
        due_date: '2026-06-10',
        sap_invoice_date: '2026-03-01',
      },
      today,
    )

    expect(snapshot.bucket).toBe('pending')
    expect(snapshot.daysOverdue).toBe(0)
    expect(snapshot.outstandingEur).toBe(100)
  })

  it('classifies invoice as paid when collection_status is paid', () => {
    const snapshot = buildCollectionSnapshot(
      {
        collection_status: 'paid',
        amount_paid_eur: 100,
        amount_due_eur: 100,
        sap_payload: {},
        due_date: '2026-05-10',
        sap_invoice_date: '2026-03-01',
      },
      today,
    )

    expect(snapshot.bucket).toBe('paid')
    expect(snapshot.outstandingEur).toBe(0)
    expect(snapshot.daysOverdue).toBe(0)
  })
})

describe('dedupeCollectionsForExport', () => {
  it('deduplicates rows by sap number and keeps max amounts', () => {
    const result = dedupeCollectionsForExport([
      {
        id: 'inv-1',
        sap_invoice_number: '90001',
        amount_due_eur_resolved: 120,
        outstanding_eur: 120,
        bucket: 'pending' as const,
        days_overdue: 0,
        due_date_resolved: '2026-06-01',
      },
      {
        id: 'inv-2',
        sap_invoice_number: '90001',
        amount_due_eur_resolved: 120,
        outstanding_eur: 90,
        bucket: 'overdue' as const,
        days_overdue: 5,
        due_date_resolved: '2026-05-20',
      },
      {
        id: 'inv-3',
        sap_invoice_number: '90002',
        amount_due_eur_resolved: 50,
        outstanding_eur: 50,
        bucket: 'pending' as const,
        days_overdue: 0,
        due_date_resolved: '2026-06-10',
      },
    ])

    expect(result.rows).toHaveLength(2)
    expect(result.duplicatesRemoved).toBe(1)
    expect(result.duplicateGroups).toBe(1)
    const merged = result.rows.find((row) => row.sap_invoice_number === '90001')
    expect(merged?.duplicate_count).toBe(2)
    expect(merged?.amount_due_eur_resolved).toBe(120)
    expect(merged?.outstanding_eur).toBe(120)
    expect(merged?.bucket).toBe('overdue')
    expect(merged?.days_overdue).toBe(5)
    expect(merged?.due_date_resolved).toBe('2026-05-20')
  })
})
