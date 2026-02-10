import { Page, Locator } from '@playwright/test'

export class GInvDeliveryPage {
  readonly page: Page
  readonly heading: Locator
  readonly createButton: Locator
  readonly tableRows: Locator
  readonly invoiceSelect: Locator
  readonly subjectInput: Locator
  readonly bodyInput: Locator
  readonly addRecipientButton: Locator
  readonly sendButton: Locator
  readonly emptyState: Locator
  // Aliases used by specs
  readonly deliveryDialog: Locator
  readonly bodyTextarea: Locator
  readonly recipientNameInputs: Locator
  readonly recipientEmailInputs: Locator
  readonly removeRecipientButtons: Locator
  readonly submitButton: Locator
  readonly kpiCards: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Entregas' })
    this.createButton = page.getByRole('button', { name: /Nueva Entrega/ })
    this.tableRows = page.locator('tbody tr')
    this.invoiceSelect = page.locator('#del-invoice')
    this.subjectInput = page.locator('#del-subject')
    this.bodyInput = page.locator('#del-body')
    this.addRecipientButton = page.getByRole('button', { name: /Añadir/ })
    this.sendButton = page.getByRole('dialog').getByRole('button', { name: /Enviar/ })
    this.emptyState = page.getByText('No hay entregas registradas')
    // Aliases
    this.deliveryDialog = page.getByRole('dialog')
    this.bodyTextarea = this.bodyInput
    this.recipientNameInputs = page.getByPlaceholder(/nombre/i)
    this.recipientEmailInputs = page.getByPlaceholder(/email/i)
    this.removeRecipientButtons = page.getByRole('button', { name: /Eliminar|Quitar|Remove|×/ })
    this.submitButton = this.sendButton
    this.kpiCards = page.locator('.grid > div').filter({ has: page.locator('.text-2xl, .text-3xl') })
  }

  async goto() {
    await this.page.goto('/g-invoice/delivery')
  }

  async openSendDialog() {
    await this.createButton.click()
  }

  async addRecipient(name: string, email: string) {
    await this.page.getByPlaceholder(/nombre/i).last().fill(name)
    await this.page.getByPlaceholder(/email/i).last().fill(email)
    await this.addRecipientButton.click()
  }
}
