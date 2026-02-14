import { differenceInDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CERTIFICATE_ALERT_DEFAULTS } from './constants'
import type { Certificate } from '@/types'

export type CertificateStatusInfo = {
  status: 'valid' | 'expiring_soon' | 'expired'
  label: string
  daysRemaining: number
  badgeVariant: 'success' | 'warning' | 'destructive'
}

export function getCertificateStatus(expiryDate: string): CertificateStatusInfo {
  const today = new Date()
  const expiry = parseISO(expiryDate)
  const daysRemaining = differenceInDays(expiry, today)

  if (daysRemaining < 0) {
    return {
      status: 'expired',
      label: `Vencido hace ${Math.abs(daysRemaining)} días`,
      daysRemaining,
      badgeVariant: 'destructive',
    }
  }

  if (daysRemaining <= CERTIFICATE_ALERT_DEFAULTS.FIRST_ALERT_DAYS) {
    return {
      status: 'expiring_soon',
      label: `Vence en ${daysRemaining} días`,
      daysRemaining,
      badgeVariant: 'destructive',
    }
  }

  return {
    status: 'valid',
    label: `Vigente (${daysRemaining} días)`,
    daysRemaining,
    badgeVariant: 'success',
  }
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'dd MMM yyyy', { locale: es })
}

export function getDefaultExpiryDate(issueDate: string): string {
  const date = parseISO(issueDate)
  date.setFullYear(date.getFullYear() + CERTIFICATE_ALERT_DEFAULTS.DEFAULT_VALIDITY_YEARS)
  return format(date, 'yyyy-MM-dd')
}

export function validateCountryMatch(
  certificateCountry: string,
  correspondentCountry: string,
): { valid: boolean; message: string } {
  if (certificateCountry === correspondentCountry) {
    return {
      valid: true,
      message: 'País del certificado coincide con la sede del corresponsal',
    }
  }
  return {
    valid: false,
    message: `Atención: el certificado es de ${certificateCountry} pero la sede del corresponsal es ${correspondentCountry}`,
  }
}

export function filterExpiringCertificates(
  certificates: Certificate[],
  daysThreshold: number = CERTIFICATE_ALERT_DEFAULTS.FIRST_ALERT_DAYS,
): Certificate[] {
  return certificates.filter((cert) => {
    const info = getCertificateStatus(cert.expiry_date)
    return info.daysRemaining <= daysThreshold
  })
}
