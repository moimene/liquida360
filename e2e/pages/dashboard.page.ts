import { Page, Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly kpiCards: Locator
  readonly trendChart: Locator
  readonly statusChart: Locator
  readonly expiryChart: Locator
  readonly recentLiquidations: Locator
  readonly certificateAlerts: Locator
  readonly viewAllButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Dashboard' })
    // KPI cards are Card components inside the grid; each contains a metric title text
    this.kpiCards = page.locator('.grid > div').filter({
      has: page.locator('text=/Liquidaciones pendientes|Certificados vigentes|Certificados por vencer|Pagos pendientes|En aprobación/'),
    })
    // Chart sections identified by their CardTitle text
    this.trendChart = page.getByText('Tendencia de liquidaciones').locator('xpath=ancestor::div[contains(@class,"rounded")]')
    this.statusChart = page.getByText('Distribución por estado').locator('xpath=ancestor::div[contains(@class,"rounded")]')
    this.expiryChart = page.getByText('Certificados por vencer').first().locator('xpath=ancestor::div[contains(@class,"rounded")]')
    // Content sections
    this.recentLiquidations = page.getByText('Liquidaciones recientes').locator('..')
    this.certificateAlerts = page.getByText('Alertas de certificados').locator('..')
    // "Ver todas" is a ghost Button, not a link
    this.viewAllButton = page.getByRole('button', { name: /Ver todas/ })
  }

  async goto() {
    await this.page.goto('/')
  }

  async getKpiValue(index: number) {
    const card = this.kpiCards.nth(index)
    return card.locator('p.font-bold').first().textContent()
  }
}
