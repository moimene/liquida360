type BillingDecision = 'emit' | 'transfer' | 'discard' | null

interface ResolveFxInput {
  currency: string
  amount: number
  exchangeRateToEur?: number | null
}

export interface FxResolvedValue {
  exchangeRateToEur: number
  amountEur: number
}

export interface SapPayloadIntakeItem {
  id: string
  type: 'vendor_invoice' | 'official_fee'
  currency: string
  amount: number
  exchange_rate_to_eur: number | null
  amount_eur: number | null
  file_path: string | null
  invoice_number: string | null
  nrc_number: string | null
}

export interface SapPayloadBatchItem {
  intake_item_id: string
  attach_fee: boolean
  decision: BillingDecision
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function resolveFxToEur(input: ResolveFxInput): { value?: FxResolvedValue; error?: string } {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { error: 'El importe debe ser mayor que cero.' }
  }

  const currency = input.currency.toUpperCase()
  if (currency === 'EUR') {
    return {
      value: {
        exchangeRateToEur: 1,
        amountEur: roundTo(input.amount, 2),
      },
    }
  }

  if (
    typeof input.exchangeRateToEur !== 'number' ||
    !Number.isFinite(input.exchangeRateToEur) ||
    input.exchangeRateToEur <= 0
  ) {
    return { error: `Indica un tipo de cambio valido para convertir ${currency} a EUR.` }
  }

  return {
    value: {
      exchangeRateToEur: roundTo(input.exchangeRateToEur, 6),
      amountEur: roundTo(input.amount * input.exchangeRateToEur, 2),
    },
  }
}

export function buildSapInvoicePayload(
  batchItems: SapPayloadBatchItem[],
  intakeItems: SapPayloadIntakeItem[],
  generatedAt: string = new Date().toISOString(),
): Record<string, unknown> {
  const intakeById = new Map(intakeItems.map((item) => [item.id, item]))
  const selectedBatchItems = batchItems.filter((item) => item.decision !== 'discard')

  let fxTotalEur = 0
  let fxMissingRatesCount = 0
  let missingAttachmentCount = 0

  const fxLines: Array<Record<string, unknown>> = []
  const autoAttachments: Array<Record<string, unknown>> = []

  selectedBatchItems.forEach((batchItem) => {
    const intake = intakeById.get(batchItem.intake_item_id)
    if (!intake) return

    const fxResolved = resolveFxToEur({
      currency: intake.currency,
      amount: intake.amount,
      exchangeRateToEur: intake.exchange_rate_to_eur,
    })

    if (!fxResolved.value) {
      fxMissingRatesCount += 1
    } else {
      fxTotalEur += fxResolved.value.amountEur
      fxLines.push({
        intake_item_id: intake.id,
        currency: intake.currency,
        amount: intake.amount,
        exchange_rate_to_eur: fxResolved.value.exchangeRateToEur,
        amount_eur: intake.amount_eur ?? fxResolved.value.amountEur,
      })
    }

    if (intake.type !== 'official_fee' || !batchItem.attach_fee) return

    if (!intake.file_path) {
      missingAttachmentCount += 1
      return
    }

    autoAttachments.push({
      intake_item_id: intake.id,
      file_path: intake.file_path,
      reference: intake.nrc_number ?? intake.invoice_number ?? null,
      kind: 'official_fee_proof',
    })
  })

  return {
    auto_attachments: autoAttachments,
    fx_audit: {
      generated_at: generatedAt,
      total_amount_eur: roundTo(fxTotalEur, 2),
      missing_rates_count: fxMissingRatesCount,
      lines: fxLines,
    },
    attachment_warnings: {
      missing_files_count: missingAttachmentCount,
    },
  }
}

export function getSapPayloadAttachmentCount(payload: unknown): number {
  if (!isRecord(payload)) return 0
  const attachments = payload.auto_attachments
  if (!Array.isArray(attachments)) return 0
  return attachments.length
}

export function getSapPayloadFxSummary(payload: unknown): { totalAmountEur: number | null; missingRatesCount: number } {
  if (!isRecord(payload)) {
    return { totalAmountEur: null, missingRatesCount: 0 }
  }

  const fxAudit = payload.fx_audit
  if (!isRecord(fxAudit)) {
    return { totalAmountEur: null, missingRatesCount: 0 }
  }

  const totalAmountEur = typeof fxAudit.total_amount_eur === 'number' && Number.isFinite(fxAudit.total_amount_eur)
    ? fxAudit.total_amount_eur
    : null
  const missingRatesCount = typeof fxAudit.missing_rates_count === 'number' && Number.isFinite(fxAudit.missing_rates_count)
    ? fxAudit.missing_rates_count
    : 0

  return { totalAmountEur, missingRatesCount }
}

