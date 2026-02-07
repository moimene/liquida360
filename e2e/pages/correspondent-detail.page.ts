import { Page, Locator } from '@playwright/test'

export class CorrespondentDetailPage {
  readonly page: Page
  readonly heading: Locator
  readonly backButton: Locator
  readonly editButton: Locator
  readonly tabList: Locator
  readonly datosTab: Locator
  readonly certificatesTab: Locator
  readonly liquidationsTab: Locator
  readonly breadcrumbs: Locator
  readonly dataCard: Locator
  readonly tabPanel: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.locator('h2').first()
    this.backButton = page.getByRole('button', { name: /Volver al listado/i })
    this.editButton = page.getByRole('button', { name: /Editar/i })
    this.tabList = page.getByRole('tablist', { name: /Secciones del corresponsal/i })
    this.datosTab = page.getByRole('tab', { name: /Datos/i })
    this.certificatesTab = page.getByRole('tab', { name: /Certificados/i })
    this.liquidationsTab = page.getByRole('tab', { name: /Histórico de pagos/i })
    this.breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    this.dataCard = page.getByText('Datos del corresponsal')
    this.tabPanel = page.getByRole('tabpanel')
  }

  async goto(id: string) {
    await this.page.goto(`/correspondents/${id}`)
  }
}
