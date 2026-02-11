import { Page, Locator } from '@playwright/test'

export class GInvDashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly roleDisplay: Locator
  readonly infoCard: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'G-Invoice Dashboard' })
    this.roleDisplay = page.getByText(/^Rol:\s+/).first()
    this.infoCard = page.getByRole('heading', { name: 'Work queue' })
  }

  async goto() {
    await this.page.goto('/g-invoice')
  }
}
