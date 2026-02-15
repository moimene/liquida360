import { Page, Locator } from '@playwright/test'

export class PortalCertificatesPage {
  readonly page: Page
  readonly heading: Locator
  readonly createButton: Locator
  readonly validCount: Locator
  readonly expiringCount: Locator
  readonly expiredCount: Locator
  readonly certificateCards: Locator
  readonly uploadButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { level: 1, name: /Certificados/i })
    this.createButton = page.getByRole('button', { name: /Nuevo certificado/i })
    this.validCount = page.getByText('Vigentes', { exact: true }).first()
    this.expiringCount = page.getByText('Proximos a vencer', { exact: true }).first()
    this.expiredCount = page.getByText('Vencidos', { exact: true }).first()
    this.certificateCards = page.locator('[class*="card"]')
    // The "Subir certificado" button appears on empty state
    this.uploadButton = page.getByRole('button', { name: /Subir certificado/i })
  }

  async goto() {
    await this.page.goto('/portal/certificates')
  }
}
