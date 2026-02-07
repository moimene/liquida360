import { Page, Locator } from '@playwright/test'

export class PortalInvoicesPage {
  readonly page: Page
  readonly heading: Locator
  readonly createButton: Locator
  readonly table: Locator
  readonly tableRows: Locator
  readonly searchInput: Locator
  readonly formDialog: Locator
  readonly amountInput: Locator
  readonly currencySelect: Locator
  readonly conceptInput: Locator
  readonly referenceInput: Locator
  readonly fileInput: Locator
  readonly formSubmitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { level: 1 }).filter({ hasText: /Mis facturas/ })
    this.createButton = page.getByRole('button', { name: /Nueva factura/i })
    this.table = page.locator('table')
    this.tableRows = page.locator('tbody tr')
    this.searchInput = page.getByPlaceholder('Buscar por concepto, referencia...')
    this.formDialog = page.getByRole('dialog')
    this.amountInput = this.formDialog.locator('#invoice-amount')
    this.currencySelect = this.formDialog.locator('#invoice-currency')
    this.conceptInput = this.formDialog.locator('#invoice-concept')
    this.referenceInput = this.formDialog.locator('#invoice-reference')
    this.fileInput = this.formDialog.locator('input[type="file"]')
    this.formSubmitButton = this.formDialog.getByRole('button', { name: /Crear borrador/i })
  }

  async goto() {
    await this.page.goto('/portal/invoices')
  }

  async createInvoice(data: { amount: string; currency?: string; concept: string; reference?: string }) {
    await this.createButton.click()
    await this.amountInput.fill(data.amount)
    if (data.currency) await this.currencySelect.selectOption(data.currency)
    await this.conceptInput.fill(data.concept)
    if (data.reference) await this.referenceInput.fill(data.reference)
    await this.formSubmitButton.click()
  }
}
