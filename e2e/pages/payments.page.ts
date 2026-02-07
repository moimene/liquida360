import { Page, Locator } from '@playwright/test'

export class PaymentsPage {
  readonly page: Page
  readonly heading: Locator
  readonly table: Locator
  readonly tableRows: Locator
  readonly searchInput: Locator
  readonly pendingCard: Locator
  readonly inProgressCard: Locator
  readonly paidCard: Locator
  readonly rejectedCard: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Cola de Pagos/i })
    this.table = page.locator('table')
    this.tableRows = page.locator('tbody tr')
    this.searchInput = page.getByPlaceholder(/Buscar solicitud/i)
    // Stat cards: find by the label text (uppercase in the UI)
    this.pendingCard = page.getByText('Pendientes').first()
    this.inProgressCard = page.getByText('En proceso').first()
    this.paidCard = page.getByText('Pagadas').first()
    this.rejectedCard = page.getByText('Rechazadas').first()
  }

  async goto() {
    await this.page.goto('/payments')
  }

  async clickRow(index: number) {
    await this.tableRows.nth(index).click()
  }
}
