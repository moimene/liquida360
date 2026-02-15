import { Page, Locator } from '@playwright/test'

export class PortalDashboardPage {
  readonly page: Page
  readonly welcomeHeading: Locator
  readonly kpiCards: Locator
  readonly kpiBorradores: Locator
  readonly kpiEnProceso: Locator
  readonly kpiPagadas: Locator
  readonly kpiCertificados: Locator
  readonly certificateAlert: Locator
  readonly recentInvoices: Locator
  readonly viewAllButton: Locator

  constructor(page: Page) {
    this.page = page
    this.welcomeHeading = page.getByRole('heading', { level: 1 }).filter({ hasText: /Bienvenido/ })
    this.kpiBorradores = page.getByText('Subidas')
    this.kpiEnProceso = page.getByText('Aceptadas / pendientes')
    this.kpiPagadas = page.getByText('Pagadas')
    this.kpiCertificados = page.getByText('Certificados vigentes')
    this.kpiCards = page
      .locator('.grid > div')
      .filter({ has: page.getByText(/Subidas|Aceptadas \/ pendientes|Pagadas|Certificados vigentes/) })
    this.certificateAlert = page.getByText(/vencido|proximo/i).first()
    this.recentInvoices = page.getByText('Facturas recientes')
    this.viewAllButton = page.getByRole('button', { name: /Ver todas/i })
  }

  async goto() {
    await this.page.goto('/portal')
  }
}
