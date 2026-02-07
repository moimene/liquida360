import { Page, Locator } from '@playwright/test'

export class CertificatesPage {
  readonly page: Page
  readonly heading: Locator
  readonly createButton: Locator
  readonly table: Locator
  readonly tableRows: Locator
  readonly searchInput: Locator
  readonly statusFilter: Locator
  readonly formDialog: Locator
  readonly correspondentSelect: Locator
  readonly countrySelect: Locator
  readonly issueDateInput: Locator
  readonly expiryDateInput: Locator
  readonly fileInput: Locator
  readonly formSubmitButton: Locator
  readonly exportButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Certificados de Residencia Fiscal/i })
    this.createButton = page.getByRole('button', { name: /Nuevo certificado/i })
    this.table = page.locator('table')
    this.tableRows = page.locator('tbody tr')
    this.searchInput = page.getByPlaceholder('Buscar certificado...')
    this.statusFilter = page.getByRole('combobox', { name: /Filtrar por estado/i }).or(
      page.getByLabel(/Filtrar por estado/i)
    )
    this.formDialog = page.getByRole('dialog')
    this.correspondentSelect = this.formDialog.getByLabel(/Corresponsal/i)
    this.countrySelect = this.formDialog.getByLabel(/País emisor/i)
    this.issueDateInput = this.formDialog.getByLabel(/Fecha de emisión/i)
    this.expiryDateInput = this.formDialog.getByLabel(/Fecha de vencimiento/i)
    this.fileInput = this.formDialog.locator('input[type="file"]')
    this.formSubmitButton = this.formDialog.getByRole('button', { name: /Registrar certificado/i })
    this.exportButton = page.getByRole('button', { name: /Exportar CSV/i })
  }

  async goto() {
    await this.page.goto('/certificates')
  }

  async filterByStatus(statusValue: string) {
    await this.statusFilter.selectOption(statusValue)
  }
}
