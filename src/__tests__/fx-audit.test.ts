import { describe, expect, it } from 'vitest'
import {
  buildSapInvoicePayload,
  getSapPayloadAttachmentCount,
  getSapPayloadFxSummary,
  resolveFxToEur,
} from '@/features/ginvoice/lib/fx-audit'

describe('resolveFxToEur', () => {
  it('uses rate 1 for EUR amounts', () => {
    const result = resolveFxToEur({
      currency: 'EUR',
      amount: 120.456,
    })

    expect(result.error).toBeUndefined()
    expect(result.value).toEqual({
      exchangeRateToEur: 1,
      amountEur: 120.46,
    })
  })

  it('computes conversion for non-EUR currencies', () => {
    const result = resolveFxToEur({
      currency: 'USD',
      amount: 100,
      exchangeRateToEur: 0.92,
    })

    expect(result.error).toBeUndefined()
    expect(result.value).toEqual({
      exchangeRateToEur: 0.92,
      amountEur: 92,
    })
  })

  it('returns error when non-EUR has no valid rate', () => {
    const result = resolveFxToEur({
      currency: 'USD',
      amount: 100,
      exchangeRateToEur: null,
    })

    expect(result.value).toBeUndefined()
    expect(result.error).toContain('tipo de cambio')
  })
})

describe('buildSapInvoicePayload', () => {
  it('builds attachment and fx snapshots', () => {
    const payload = buildSapInvoicePayload(
      [
        { intake_item_id: 'fee-1', attach_fee: true, decision: 'emit' },
        { intake_item_id: 'fee-2', attach_fee: true, decision: 'emit' },
        { intake_item_id: 'inv-1', attach_fee: false, decision: 'transfer' },
        { intake_item_id: 'inv-discard', attach_fee: false, decision: 'discard' },
      ],
      [
        {
          id: 'fee-1',
          type: 'official_fee',
          currency: 'USD',
          amount: 100,
          exchange_rate_to_eur: 0.9,
          amount_eur: 90,
          file_path: 'intake/fee-1.pdf',
          invoice_number: null,
          nrc_number: 'NRC-1',
        },
        {
          id: 'fee-2',
          type: 'official_fee',
          currency: 'USD',
          amount: 100,
          exchange_rate_to_eur: null,
          amount_eur: null,
          file_path: null,
          invoice_number: null,
          nrc_number: 'NRC-2',
        },
        {
          id: 'inv-1',
          type: 'vendor_invoice',
          currency: 'EUR',
          amount: 80,
          exchange_rate_to_eur: null,
          amount_eur: null,
          file_path: 'intake/inv-1.pdf',
          invoice_number: 'FV-1',
          nrc_number: null,
        },
        {
          id: 'inv-discard',
          type: 'vendor_invoice',
          currency: 'EUR',
          amount: 500,
          exchange_rate_to_eur: null,
          amount_eur: null,
          file_path: null,
          invoice_number: 'FV-X',
          nrc_number: null,
        },
      ],
      '2026-02-14T12:00:00.000Z',
    )

    expect(getSapPayloadAttachmentCount(payload)).toBe(1)
    expect(getSapPayloadFxSummary(payload)).toEqual({
      totalAmountEur: 170,
      missingRatesCount: 1,
    })
  })
})

