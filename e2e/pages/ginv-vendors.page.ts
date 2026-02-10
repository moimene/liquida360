import { Page, Locator } from '@playwright/test'

export class GInvVendorsPage {
  readonly page: Page
  readonly heading: Locator
  readonly createButton: Locator
  readonly searchInput: Locator
  readonly tableRows: Locator
  readonly vendorName: Locator
  readonly vendorTaxId: Locator
  readonly vendorCountry: Locator
  readonly formSubmitButton: Locator
  readonly emptyState: Locator
  // Aliases used by specs
  readonly formDialog: Locator
  readonly nameInput: Locator
  readonly taxIdInput: Locator
  readonly countrySelect: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Proveedores' })
    this.createButton = page.getByRole('button', { name: /Nuevo Proveedor/ })
    this.searchInput = page.getByPlaceholder('Buscar por nombre, NIF o país...')
    this.tableRows = page.locator('tbody tr')
    this.vendorName = page.locator('#vendor-name')
    this.vendorTaxId = page.locator('#vendor-tax-id')
    this.vendorCountry = page.locator('#vendor-country')
    this.formSubmitButton = page.getByRole('button', { name: /Crear Proveedor/ })
    this.emptyState = page.getByText('No hay proveedores registrados')
    // Aliases
    this.formDialog = page.getByRole('dialog')
    this.nameInput = this.vendorName
    this.taxIdInput = this.vendorTaxId
    this.countrySelect = this.vendorCountry
  }

  async goto() {
    await this.page.goto('/g-invoice/vendors')
  }

  async createVendor(data: {
    name: string
    taxId: string
    country: string
  }) {
    await this.createButton.click()
    await this.vendorName.fill(data.name)
    await this.vendorTaxId.fill(data.taxId)
    await this.vendorCountry.selectOption(data.country)
    await this.formSubmitButton.click()
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term)
  }

  async clickVendorRow(index: number) {
    await this.tableRows.nth(index).click()
  }
}
