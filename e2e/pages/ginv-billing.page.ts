import { Page, Locator } from '@playwright/test'

export class GInvBillingPage {
  readonly page: Page
  readonly heading: Locator
  readonly itemsTab: Locator
  readonly batchesTab: Locator
  readonly searchInput: Locator
  readonly rowCheckboxes: Locator
  readonly createBatchButton: Locator
  readonly batchUttaiSelect: Locator
  readonly batchSubmitButton: Locator
  readonly emptyItems: Locator
  readonly emptyBatches: Locator
  // Aliases used by specs
  readonly kpiCards: Locator
  readonly batchDialog: Locator
  readonly uttaiSelect: Locator
  readonly viewBatchItemsButton: Locator
  readonly batchDetailDialog: Locator
  readonly emptyState: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Para Facturar' })
    this.itemsTab = page.getByText('Cargos disponibles')
    this.batchesTab = page.getByRole('button', { name: /^Lotes/ })
    this.searchInput = page.getByPlaceholder('Buscar por nº factura o concepto...')
    this.rowCheckboxes = page.locator('tbody input[type="checkbox"]')
    this.createBatchButton = page.getByRole('button', { name: /Crear lote/ })
    this.batchUttaiSelect = page.locator('#batch-uttai')
    this.batchSubmitButton = page.getByRole('dialog').getByRole('button', { name: /Crear Lote/ })
    this.emptyItems = page.getByText('No hay cargos contabilizados disponibles')
    this.emptyBatches = page.getByText('No hay lotes creados')
    // Aliases
    this.kpiCards = page.locator('.grid > div').filter({ has: page.locator('.text-2xl, .text-3xl') })
    this.batchDialog = page.getByRole('dialog')
    this.uttaiSelect = this.batchUttaiSelect
    this.viewBatchItemsButton = page.getByRole('button', { name: /Ver cargos/ })
    this.batchDetailDialog = page.getByRole('dialog')
    this.emptyState = this.emptyItems
  }

  async goto() {
    await this.page.goto('/g-invoice/billing')
  }

  async switchToItems() {
    await this.itemsTab.click()
  }

  async switchToBatches() {
    await this.batchesTab.click()
  }

  async selectItem(index: number) {
    await this.rowCheckboxes.nth(index).check()
  }

  async openCreateBatch() {
    await this.createBatchButton.click()
  }

  async createBatch(uttai: string) {
    await this.openCreateBatch()
    await this.batchUttaiSelect.selectOption(uttai)
    await this.batchSubmitButton.click()
  }
}
