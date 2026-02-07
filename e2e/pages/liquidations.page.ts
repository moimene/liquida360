import { Page, Locator } from '@playwright/test'

export class LiquidationsPage {
  readonly page: Page
  readonly heading: Locator
  readonly createButton: Locator
  readonly table: Locator
  readonly tableRows: Locator
  readonly searchInput: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Liquidaciones/i })
    this.createButton = page.getByRole('button', { name: /Nueva liquidación/i })
    this.table = page.locator('table')
    this.tableRows = page.locator('tbody tr')
    this.searchInput = page.getByPlaceholder(/Buscar/i)
  }

  async goto() {
    await this.page.goto('/liquidations')
  }

  async clickRow(index: number) {
    await this.tableRows.nth(index).click()
  }
}
