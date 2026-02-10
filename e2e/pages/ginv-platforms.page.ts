import { Page, Locator } from '@playwright/test'

export class GInvPlatformsPage {
  readonly page: Page
  readonly heading: Locator
  readonly createButton: Locator
  readonly searchInput: Locator
  readonly tableRows: Locator
  readonly startButton: Locator
  readonly completeButton: Locator
  readonly blockButton: Locator
  readonly emptyState: Locator
  // Aliases used by specs
  readonly createDialog: Locator
  readonly invoiceSelect: Locator
  readonly platformInput: Locator
  readonly statusFilter: Locator
  readonly kpiCards: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Plataformas' })
    this.createButton = page.getByRole('button', { name: /Nueva Tarea/ })
    this.searchInput = page.getByPlaceholder('Buscar plataforma, código o nº factura...')
    this.tableRows = page.locator('tbody tr')
    this.startButton = page.getByRole('button', { name: /Iniciar/ })
    this.completeButton = page.getByRole('button', { name: /Completar/ })
    this.blockButton = page.getByRole('button', { name: /Bloquear/ })
    this.emptyState = page.getByText('No hay tareas de plataforma')
    // Aliases
    this.createDialog = page.getByRole('dialog')
    this.invoiceSelect = page.locator('#pt-invoice')
    this.platformInput = page.locator('#pt-platform')
    this.statusFilter = page.locator('select').first()
    this.kpiCards = page.locator('.grid > div').filter({ has: page.locator('.text-2xl, .text-3xl') })
  }

  async goto() {
    await this.page.goto('/g-invoice/platforms')
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term)
  }
}
