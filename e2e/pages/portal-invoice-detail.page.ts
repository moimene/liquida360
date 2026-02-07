import { Page, Locator } from '@playwright/test'

export class PortalInvoiceDetailPage {
  readonly page: Page
  readonly heading: Locator
  readonly backButton: Locator
  readonly statusBadge: Locator
  readonly invoiceDataCard: Locator
  readonly processStatusCard: Locator
  readonly submitForApprovalButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.locator('h2').first()
    this.backButton = page.getByRole('button', { name: /Volver al listado/i })
    this.statusBadge = page.locator('[class*="badge"]').first()
    this.invoiceDataCard = page.getByText('Datos de la factura').locator('..').locator('..')
    this.processStatusCard = page.getByText('Estado del proceso').locator('..').locator('..')
    this.submitForApprovalButton = page.getByRole('button', { name: /Enviar a aprobacion/i })
  }

  async goto(id: string) {
    await this.page.goto(`/portal/invoices/${id}`)
  }
}
