import { Page, Locator } from '@playwright/test'

export class GInvInvoicesPage {
  readonly page: Page
  readonly heading: Locator
  readonly createButton: Locator
  readonly searchInput: Locator
  readonly tableRows: Locator
  readonly batchSelect: Locator
  readonly createSubmitButton: Locator
  readonly requestApprovalButton: Locator
  readonly approveButton: Locator
  readonly emitSapButton: Locator
  readonly sapInvNumInput: Locator
  readonly sapInvDateInput: Locator
  readonly emptyState: Locator
  // Aliases used by specs
  readonly createDialog: Locator
  readonly statusFilter: Locator
  readonly kpiCards: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Facturas Cliente' })
    this.createButton = page.getByRole('button', { name: /Nueva Factura/ })
    this.searchInput = page.getByPlaceholder('Buscar por nº factura SAP...')
    this.tableRows = page.locator('tbody tr')
    this.batchSelect = page.locator('#batch-select')
    this.createSubmitButton = page.getByRole('dialog').getByRole('button', { name: /Crear Factura/ })
    this.requestApprovalButton = page.getByRole('button', { name: /Solicitar aprobación/ })
    this.approveButton = page.getByRole('button', { name: /Aprobar/ })
    this.emitSapButton = page.getByRole('button', { name: /Emitir en SAP/ })
    this.sapInvNumInput = page.locator('#sap-inv-num')
    this.sapInvDateInput = page.locator('#sap-inv-date')
    this.emptyState = page.getByText('No hay facturas')
    // Aliases
    this.createDialog = page.getByRole('dialog')
    this.statusFilter = page.locator('select').first()
    this.kpiCards = page.locator('.grid > div').filter({ has: page.locator('.text-2xl, .text-3xl') })
  }

  async goto() {
    await this.page.goto('/g-invoice/invoices')
  }

  async openCreateDialog() {
    await this.createButton.click()
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term)
  }
}
