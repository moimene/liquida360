import { Page, Locator } from '@playwright/test'

export class GInvUttaiPage {
  readonly page: Page
  readonly heading: Locator
  readonly searchInput: Locator
  readonly tableRows: Locator
  readonly requestUnblockButton: Locator
  readonly unblockButton: Locator
  // Aliases used by specs
  readonly kpiCards: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'UTTAI' })
    this.searchInput = page.getByPlaceholder('Buscar job...')
    this.tableRows = page.locator('tbody tr')
    this.requestUnblockButton = page.getByRole('button', { name: /Solicitar desbloqueo/ })
    this.unblockButton = page.getByRole('button', { name: /Desbloquear/ })
    // Aliases
    this.kpiCards = page.locator('.grid > div').filter({ has: page.locator('.text-2xl, .text-3xl') })
  }

  async goto() {
    await this.page.goto('/g-invoice/uttai')
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term)
  }
}
