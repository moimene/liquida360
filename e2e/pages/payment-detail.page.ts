import { Page, Locator } from '@playwright/test'

export class PaymentDetailPage {
  readonly page: Page
  readonly heading: Locator
  readonly backButton: Locator
  readonly statusBadge: Locator
  readonly breadcrumbs: Locator
  readonly startProcessButton: Locator
  readonly markPaidButton: Locator
  readonly rejectButton: Locator
  readonly notesTextarea: Locator
  readonly confirmDialog: Locator
  readonly confirmPaidButton: Locator
  readonly confirmRejectButton: Locator
  readonly cancelDialogButton: Locator
  readonly liquidationLink: Locator
  readonly dataCard: Locator
  readonly requestCard: Locator

  constructor(page: Page) {
    this.page = page
    // h2 "Solicitud de Pago"
    this.heading = page.getByRole('heading', { name: /Solicitud de Pago/i })
    // Icon button with aria-label
    this.backButton = page.getByLabel('Volver a la cola')
    // Badge next to heading
    this.statusBadge = page.locator('[class*="badge"]').first()
    // Breadcrumb nav
    this.breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    // Action buttons
    this.startProcessButton = page.getByRole('button', { name: /Iniciar proceso/i })
    this.markPaidButton = page.getByRole('button', { name: /Marcar como pagada/i })
    this.rejectButton = page.getByRole('button', { name: /^Rechazar$/i })
    // Confirm dialog (native <dialog> element)
    this.confirmDialog = page.locator('dialog[open]')
    // Notes textarea inside confirm dialog (has id="notes")
    this.notesTextarea = page.getByLabel(/Notas/i)
    // Confirm dialog buttons: "Confirmar pago" or "Rechazar" (the dialog uses these)
    this.confirmPaidButton = page.getByRole('button', { name: /Confirmar pago/i })
    this.confirmRejectButton = page.locator('dialog').getByRole('button', { name: /^Rechazar$/i })
    this.cancelDialogButton = page.locator('dialog').getByRole('button', { name: /Cancelar/i })
    // "Ver liquidacion asociada" is a <button>, not an <a> link
    this.liquidationLink = page.getByRole('button', { name: /Ver liquidación asociada/i })
    // Detail cards
    this.dataCard = page.getByText('Datos de la liquidación')
    this.requestCard = page.getByText('Información de la solicitud')
  }

  async goto(id: string) {
    await this.page.goto(`/payments/${id}`)
  }
}
