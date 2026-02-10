import { Page, Locator } from '@playwright/test'

export class GInvVendorCompliancePage {
  readonly page: Page
  readonly backButton: Locator
  readonly vendorName: Locator
  readonly complianceBadge: Locator
  readonly addDocumentButton: Locator
  readonly documentRows: Locator
  readonly emptyDocs: Locator
  readonly docTypeSelect: Locator
  readonly docIssueDateInput: Locator
  readonly docExpiryDateInput: Locator
  readonly docFileInput: Locator
  // Aliases used by specs
  readonly heading: Locator
  readonly nifDisplay: Locator

  constructor(page: Page) {
    this.page = page
    this.backButton = page.getByRole('button', { name: /Volver/ })
    this.vendorName = page.getByRole('heading').first()
    this.complianceBadge = page.locator('span').filter({ hasText: /Compliant|Non-compliant|No cumple|Cumple|Por vencer|Pendiente|Vigente|Vencido/ }).first()
    this.addDocumentButton = page.getByRole('button', { name: /Añadir documento/ })
    this.documentRows = page.locator('tbody tr')
    this.emptyDocs = page.getByText('No hay documentos registrados')
    this.docTypeSelect = page.locator('#doc-type')
    this.docIssueDateInput = page.locator('#doc-issue-date')
    this.docExpiryDateInput = page.locator('#doc-expiry-date')
    this.docFileInput = page.locator('#doc-file')
    // Aliases
    this.heading = this.vendorName
    this.nifDisplay = page.getByText(/NIF|CIF|Tax ID/i).first()
  }

  async goto(vendorId: string) {
    await this.page.goto(`/g-invoice/vendors/${vendorId}/compliance`)
  }

  async goBack() {
    await this.backButton.click()
  }
}
