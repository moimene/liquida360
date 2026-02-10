import { Page, Locator } from '@playwright/test'

export class GInvDashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly subtitle: Locator
  readonly roleDisplay: Locator
  readonly infoCard: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'G-Invoice Dashboard' })
    this.subtitle = page.getByText('Facturación digital — Vista general')
    this.roleDisplay = page.getByText(/Rol actual/)
    this.infoCard = page.locator('div').filter({ hasText: /Los módulos de ingesta/ }).first()
  }

  async goto() {
    await this.page.goto('/g-invoice')
  }
}
