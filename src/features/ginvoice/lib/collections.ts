import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns'
import type { GInvClientInvoice } from '@/types'
import { getSapPayloadFxSummary } from './fx-audit'

export type CollectionBucket = 'pending' | 'overdue' | 'paid' | 'unknown'

export interface CollectionSnapshot {
  dueDate: string | null
  amountDueEur: number | null
  amountPaidEur: number
  outstandingEur: number | null
  bucket: CollectionBucket
  daysOverdue: number
}

export interface ExportCollectionLike {
  id: string
  sap_invoice_number: string | null
  amount_due_eur_resolved: number | null
  outstanding_eur: number | null
  bucket: CollectionBucket
  days_overdue: number
  due_date_resolved: string | null
}

export type DedupedExportRow<T extends ExportCollectionLike> = T & {
  duplicate_count: number
}

export interface DedupedExportResult<T extends ExportCollectionLike> {
  rows: DedupedExportRow<T>[]
  duplicatesRemoved: number
  duplicateGroups: number
}

export const DEFAULT_COLLECTION_TERMS_DAYS = 60

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function maxNullable(left: number | null, right: number | null): number | null {
  if (typeof left !== 'number' && typeof right !== 'number') return null
  if (typeof left !== 'number') return right
  if (typeof right !== 'number') return left
  return Math.max(left, right)
}

export function deriveDueDate(invoice: Pick<GInvClientInvoice, 'due_date' | 'sap_invoice_date'>, defaultTermsDays: number = DEFAULT_COLLECTION_TERMS_DAYS): string | null {
  if (invoice.due_date) return invoice.due_date
  if (!invoice.sap_invoice_date) return null
  return format(addDays(parseDateOnly(invoice.sap_invoice_date), defaultTermsDays), 'yyyy-MM-dd')
}

export function deriveAmountDueEur(invoice: Pick<GInvClientInvoice, 'amount_due_eur' | 'sap_payload'>): number | null {
  if (typeof invoice.amount_due_eur === 'number' && Number.isFinite(invoice.amount_due_eur)) {
    return invoice.amount_due_eur
  }
  return getSapPayloadFxSummary(invoice.sap_payload).totalAmountEur
}

export function buildCollectionSnapshot(
  invoice: Pick<
    GInvClientInvoice,
    'collection_status' | 'amount_paid_eur' | 'amount_due_eur' | 'sap_payload' | 'due_date' | 'sap_invoice_date'
  >,
  today: Date = new Date(),
): CollectionSnapshot {
  const dueDate = deriveDueDate(invoice)
  const amountDueEur = deriveAmountDueEur(invoice)
  const amountPaidEur = typeof invoice.amount_paid_eur === 'number' && Number.isFinite(invoice.amount_paid_eur)
    ? invoice.amount_paid_eur
    : 0
  const outstandingEur = amountDueEur === null ? null : roundToTwo(Math.max(amountDueEur - amountPaidEur, 0))

  const todayStart = startOfDay(today)
  const dueDateStart = dueDate ? startOfDay(parseDateOnly(dueDate)) : null
  const daysOverdue = dueDateStart ? Math.max(differenceInCalendarDays(todayStart, dueDateStart), 0) : 0

  if (invoice.collection_status === 'paid') {
    return {
      dueDate,
      amountDueEur,
      amountPaidEur,
      outstandingEur: 0,
      bucket: 'paid',
      daysOverdue: 0,
    }
  }

  if (outstandingEur === null) {
    return {
      dueDate,
      amountDueEur,
      amountPaidEur,
      outstandingEur,
      bucket: dueDateStart && daysOverdue > 0 ? 'overdue' : 'unknown',
      daysOverdue,
    }
  }

  if (outstandingEur <= 0) {
    return {
      dueDate,
      amountDueEur,
      amountPaidEur,
      outstandingEur: 0,
      bucket: 'paid',
      daysOverdue: 0,
    }
  }

  return {
    dueDate,
    amountDueEur,
    amountPaidEur,
    outstandingEur,
    bucket: dueDateStart && daysOverdue > 0 ? 'overdue' : 'pending',
    daysOverdue,
  }
}

export function dedupeCollectionsForExport<T extends ExportCollectionLike>(rows: T[]): DedupedExportResult<T> {
  const deduped = new Map<string, DedupedExportRow<T>>()

  rows.forEach((row) => {
    const key = (row.sap_invoice_number ?? row.id).trim().toLowerCase()
    const existing = deduped.get(key)
    if (!existing) {
      deduped.set(key, {
        ...row,
        duplicate_count: 1,
      })
      return
    }

    existing.duplicate_count += 1
    existing.amount_due_eur_resolved = maxNullable(existing.amount_due_eur_resolved, row.amount_due_eur_resolved)
    existing.outstanding_eur = maxNullable(existing.outstanding_eur, row.outstanding_eur)
    existing.days_overdue = Math.max(existing.days_overdue, row.days_overdue)
    if (existing.bucket !== 'overdue' && row.bucket === 'overdue') {
      existing.bucket = 'overdue'
    } else if (existing.bucket === 'unknown' && row.bucket !== 'unknown') {
      existing.bucket = row.bucket
    }

    if (!existing.due_date_resolved && row.due_date_resolved) {
      existing.due_date_resolved = row.due_date_resolved
    } else if (existing.due_date_resolved && row.due_date_resolved) {
      existing.due_date_resolved = existing.due_date_resolved <= row.due_date_resolved
        ? existing.due_date_resolved
        : row.due_date_resolved
    }
  })

  const uniqueRows = Array.from(deduped.values())
  const duplicatesRemoved = rows.length - uniqueRows.length
  const duplicateGroups = uniqueRows.filter((row) => row.duplicate_count > 1).length

  return {
    rows: uniqueRows,
    duplicatesRemoved,
    duplicateGroups,
  }
}
