import { Page, Locator } from '@playwright/test'

export class LiquidationDetailPage {
  readonly page: Page
  readonly heading: Locator
  readonly backButton: Locator
  readonly statusBadge: Locator
  readonly breadcrumbs: Locator
  readonly submitForApprovalButton: Locator
  readonly approveButton: Locator
  readonly rejectButton: Locator
  readonly requestPaymentButton: Locator
  readonly timeline: Locator
  readonly dataCard: Locator
  readonly paymentCard: Locator

  constructor(page: Page) {
    this.page = page
    // The h2 shows the formatted currency amount (e.g. "10.000,00 EUR")
    this.heading = page.locator('h2').first()
    // Icon button with aria-label
    this.backButton = page.getByLabel('Volver al listado')
    // Badge next to the h2 heading
    this.statusBadge = page.locator('h2').first().locator('xpath=..').locator('[class*="badge"]')
    // Breadcrumb nav
    this.breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    // Workflow action buttons
    this.submitForApprovalButton = page.getByRole('button', { name: /Enviar a aprobación/i })
    this.approveButton = page.getByRole('button', { name: /^Aprobar$/i })
    this.rejectButton = page.getByRole('button', { name: /^Rechazar$/i })
    this.requestPaymentButton = page.getByRole('button', { name: /Solicitar pago/i })
    // Timeline section: the span text "Flujo de la liquidación"
    this.timeline = page.getByText('Flujo de la liquidación')
    // Card containers identified by their h3 title text
    this.dataCard = page.getByRole('heading', { name: /Datos de la liquidación/i, level: 3 }).locator('xpath=ancestor::div[2]')
    this.paymentCard = page.getByRole('heading', { name: /Información de pago/i, level: 3 }).locator('xpath=ancestor::div[2]')
  }

  async goto(id: string) {
    await this.page.goto(`/liquidations/${id}`)
  }
}
