import type { Correspondent, Certificate, Liquidation, PaymentRequest } from '@/types'
import { getStatusConfig, formatAmount } from '@/lib/liquidation-utils'
import { getCertificateStatus } from '@/lib/certificate-utils'
import { COUNTRIES } from '@/lib/countries'

export interface SearchableEntity {
  id: string
  type: 'correspondent' | 'liquidation' | 'certificate' | 'payment'
  searchText: string
  title: string
  subtitle: string
  href: string
}

type CorrespondentWithName = Correspondent
type LiquidationWithCorr = Liquidation & { correspondents?: { name: string } }
type CertificateWithCorr = Certificate & { correspondents?: { name: string } }
type PaymentWithLiq = PaymentRequest & {
  liquidations?: Liquidation & { correspondents?: { name: string } }
}

export function buildSearchIndex(
  correspondents: CorrespondentWithName[],
  liquidations: LiquidationWithCorr[],
  certificates: CertificateWithCorr[],
  payments: PaymentWithLiq[],
): SearchableEntity[] {
  const index: SearchableEntity[] = []

  for (const c of correspondents) {
    index.push({
      id: c.id,
      type: 'correspondent',
      searchText: [c.name, c.country, c.tax_id, c.email].filter(Boolean).join(' ').toLowerCase(),
      title: c.name,
      subtitle: `${c.country} · ${c.tax_id}`,
      href: `/correspondents/${c.id}`,
    })
  }

  for (const l of liquidations) {
    const config = getStatusConfig(l.status)
    index.push({
      id: l.id,
      type: 'liquidation',
      searchText: [
        l.correspondents?.name,
        l.concept,
        l.reference,
        config.label,
        String(l.amount),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
      title: l.concept ?? 'Sin concepto',
      subtitle: `${l.correspondents?.name ?? '—'} · ${formatAmount(l.amount, l.currency)}`,
      href: `/liquidations/${l.id}`,
    })
  }

  for (const cert of certificates) {
    const country = COUNTRIES.find((co) => co.code === cert.issuing_country)
    const statusInfo = getCertificateStatus(cert.expiry_date)
    index.push({
      id: cert.id,
      type: 'certificate',
      searchText: [
        cert.correspondents?.name,
        country?.name ?? cert.issuing_country,
        statusInfo.label,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
      title: `Certificado ${country?.name ?? cert.issuing_country}`,
      subtitle: `${cert.correspondents?.name ?? '—'} · ${statusInfo.label}`,
      href: `/certificates`,
    })
  }

  for (const p of payments) {
    const liq = p.liquidations
    index.push({
      id: p.id,
      type: 'payment',
      searchText: [liq?.correspondents?.name, liq?.concept, p.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
      title: `Pago — ${liq?.concept ?? 'Sin concepto'}`,
      subtitle: liq?.correspondents?.name ?? '—',
      href: `/payments/${p.id}`,
    })
  }

  return index
}

export function searchEntities(
  index: SearchableEntity[],
  query: string,
  limit = 20,
): SearchableEntity[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  const results: SearchableEntity[] = []

  // Group by type, max 5 per type
  const counts: Record<string, number> = {}

  for (const entity of index) {
    if (results.length >= limit) break
    if (entity.searchText.includes(q)) {
      const typeCount = counts[entity.type] ?? 0
      if (typeCount < 5) {
        results.push(entity)
        counts[entity.type] = typeCount + 1
      }
    }
  }

  return results
}
