import { Page, Locator } from '@playwright/test'

export class CorrespondentsPage {
  readonly page: Page
  readonly heading: Locator
  readonly createButton: Locator
  readonly table: Locator
  readonly tableRows: Locator
  readonly searchInput: Locator
  readonly statusFilter: Locator
  readonly formDialog: Locator
  readonly nameInput: Locator
  readonly countrySelect: Locator
  readonly taxIdInput: Locator
  readonly addressInput: Locator
  readonly emailInput: Locator
  readonly phoneInput: Locator
  readonly formSubmitButton: Locator
  readonly exportButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Corresponsales/i })
    this.createButton = page.getByRole('button', { name: /Nuevo corresponsal/i })
    this.table = page.locator('table')
    this.tableRows = page.locator('tbody tr')
    this.searchInput = page.getByPlaceholder('Buscar corresponsal...')
    this.statusFilter = page.getByRole('combobox', { name: /Filtrar por estado/i }).or(
      page.getByLabel(/Filtrar por estado/i)
    )
    this.formDialog = page.getByRole('dialog')
    this.nameInput = this.formDialog.getByLabel(/Nombre/i)
    this.countrySelect = this.formDialog.getByLabel(/País/i)
    this.taxIdInput = this.formDialog.getByLabel(/NIF \/ Tax ID/i)
    this.addressInput = this.formDialog.getByLabel(/Dirección fiscal/i)
    this.emailInput = this.formDialog.getByLabel(/Email/i)
    this.phoneInput = this.formDialog.getByLabel(/Teléfono/i)
    this.formSubmitButton = this.formDialog.getByRole('button', { name: /Crear corresponsal|Guardar cambios/i })
    this.exportButton = page.getByRole('button', { name: /Exportar CSV/i })
  }

  async goto() {
    await this.page.goto('/correspondents')
  }

  async createCorrespondent(data: {
    name: string
    country: string
    tax_id: string
    email?: string
    phone?: string
    address?: string
  }) {
    await this.createButton.click()
    await this.nameInput.fill(data.name)
    if (data.country) {
      await this.countrySelect.selectOption(data.country)
    }
    await this.taxIdInput.fill(data.tax_id)
    if (data.address) await this.addressInput.fill(data.address)
    if (data.email) await this.emailInput.fill(data.email)
    if (data.phone) await this.phoneInput.fill(data.phone)
    await this.formSubmitButton.click()
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term)
  }

  async clickRow(index: number) {
    await this.tableRows.nth(index).click()
  }
}
