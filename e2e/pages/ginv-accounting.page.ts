import { Page, Locator } from '@playwright/test'

export class GInvAccountingPage {
  readonly page: Page
  readonly heading: Locator
  readonly exportCsvButton: Locator
  readonly searchInput: Locator
  readonly tableRows: Locator
  readonly sendToAccountingButton: Locator
  readonly registerSapButton: Locator
  readonly sapRef: Locator
  readonly sapNotes: Locator
  readonly sapConfirmButton: Locator
  readonly emptyState: Locator
  // Aliases used by specs
  readonly sapRefInput: Locator
  readonly sapNotesInput: Locator
  readonly kpiCards: Locator
  readonly statusFilter: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Contabilización' })
    this.exportCsvButton = page.getByRole('button', { name: /Exportar CSV/ })
    this.searchInput = page.getByPlaceholder('Buscar por nº factura o concepto...')
    this.tableRows = page.locator('tbody tr')
    this.sendToAccountingButton = page.getByRole('button', { name: /Enviar a contab/ })
    this.registerSapButton = page.getByRole('button', { name: /Registrar SAP/ })
    this.sapRef = page.locator('#sap-ref')
    this.sapNotes = page.locator('#sap-notes')
    this.sapConfirmButton = page.getByRole('dialog').getByRole('button', { name: /Confirmar/ })
    this.emptyState = page.getByText('No hay items en la cola de contabilización')
    // Aliases
    this.sapRefInput = this.sapRef
    this.sapNotesInput = this.sapNotes
    this.kpiCards = page.locator('.grid > div').filter({ has: page.locator('.text-2xl, .text-3xl') })
    this.statusFilter = page.locator('select').first()
  }

  async goto() {
    await this.page.goto('/g-invoice/accounting')
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term)
  }

  async exportCsv() {
    await this.exportCsvButton.click()
  }
}
