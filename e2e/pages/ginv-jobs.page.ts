import { Page, Locator } from '@playwright/test'

export class GInvJobsPage {
  readonly page: Page
  readonly heading: Locator
  readonly createButton: Locator
  readonly importCsvButton: Locator
  readonly searchInput: Locator
  readonly tableRows: Locator
  readonly jobCodeInput: Locator
  readonly clientCodeInput: Locator
  readonly clientNameInput: Locator
  readonly formSubmitButton: Locator
  readonly emptyState: Locator
  readonly formDialog: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Jobs / Clientes' })
    this.createButton = page.getByRole('button', { name: /Nuevo Job/ })
    this.importCsvButton = page.getByRole('button', { name: /Importar CSV/ })
    this.searchInput = page.getByPlaceholder('Buscar por código o cliente...')
    this.tableRows = page.locator('tbody tr')
    this.jobCodeInput = page.getByPlaceholder('ej. J-2026-0001')
    this.clientCodeInput = page.getByPlaceholder('ej. CLI-001')
    this.clientNameInput = page.getByPlaceholder('Nombre completo del cliente')
    this.formSubmitButton = page.getByRole('button', { name: /Crear Job/ })
    this.emptyState = page.getByText('No hay jobs registrados')
    this.formDialog = page.getByRole('dialog')
  }

  async goto() {
    await this.page.goto('/g-invoice/jobs')
  }

  async createJob(data: {
    jobCode: string
    clientCode: string
    clientName: string
  }) {
    await this.createButton.click()
    await this.jobCodeInput.fill(data.jobCode)
    await this.clientCodeInput.fill(data.clientCode)
    await this.clientNameInput.fill(data.clientName)
    await this.formSubmitButton.click()
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term)
  }
}
