import { Page, Locator } from '@playwright/test'

export class GInvIntakePage {
  readonly page: Page
  readonly heading: Locator
  readonly createButton: Locator
  readonly searchInput: Locator
  readonly statusFilter: Locator
  readonly typeFilter: Locator
  readonly tableRows: Locator
  readonly intakeType: Locator
  readonly intakeJob: Locator
  readonly intakeVendor: Locator
  readonly intakeAmount: Locator
  readonly intakeCurrency: Locator
  readonly intakeInvoiceNumber: Locator
  readonly intakeInvoiceDate: Locator
  readonly intakeConcept: Locator
  readonly cancelButton: Locator
  readonly submitButton: Locator
  readonly emptyState: Locator
  readonly noResultsState: Locator
  // Aliases used by specs
  readonly kpiCards: Locator
  readonly formDialog: Locator
  readonly typeSelect: Locator
  readonly jobSelect: Locator
  readonly amountInput: Locator
  readonly currencySelect: Locator
  readonly invoiceNumberInput: Locator
  readonly invoiceDateInput: Locator
  readonly conceptTextarea: Locator
  readonly conceptInput: Locator
  readonly vendorSelect: Locator
  readonly formSubmitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /(Ingesta Digital|Subidas)/ })
    this.createButton = page.getByRole('button', { name: /Nueva (Ingesta|Subida)/ })
    this.searchInput = page.getByPlaceholder('Buscar por factura, NRC, concepto o cliente...')
    this.statusFilter = page.locator('select').nth(0)
    this.typeFilter = page.locator('select').nth(1)
    this.tableRows = page.locator('tbody tr')
    this.intakeType = page.locator('#intake-type')
    this.intakeJob = page.locator('#intake-job')
    this.intakeVendor = page.locator('#intake-vendor')
    this.intakeAmount = page.locator('#intake-amount')
    this.intakeCurrency = page.locator('#intake-currency')
    this.intakeInvoiceNumber = page.locator('#intake-reference-number')
    this.intakeInvoiceDate = page.locator('#intake-invoice-date')
    this.intakeConcept = page.locator('#intake-concept')
    this.cancelButton = page.getByRole('button', { name: /Cancelar/ })
    this.submitButton = page.getByRole('button', { name: /Registrar/ })
    this.emptyState = page.getByText('No hay subidas registradas')
    this.noResultsState = page.getByText('Sin resultados para estos filtros')
    // Aliases
    this.kpiCards = page.locator('.grid > div').filter({ has: page.locator('.text-2xl, .text-3xl') })
    this.formDialog = page.getByRole('dialog')
    this.typeSelect = this.intakeType
    this.jobSelect = this.intakeJob
    this.amountInput = this.intakeAmount
    this.currencySelect = this.intakeCurrency
    this.invoiceNumberInput = this.intakeInvoiceNumber
    this.invoiceDateInput = this.intakeInvoiceDate
    this.conceptTextarea = this.intakeConcept
    this.conceptInput = this.intakeConcept
    this.vendorSelect = this.intakeVendor
    this.formSubmitButton = this.submitButton
  }

  async goto() {
    await this.page.goto('/g-invoice/intake')
  }

  async openCreateForm() {
    await this.createButton.click()
  }

  async fillIntakeForm(data: {
    type?: string
    job?: string
    vendor?: string
    amount?: string
    currency?: string
    invoiceNumber?: string
    invoiceDate?: string
    concept?: string
  }) {
    if (data.type) await this.intakeType.selectOption(data.type)
    if (data.job) await this.intakeJob.selectOption(data.job)
    if (data.vendor) await this.intakeVendor.selectOption(data.vendor)
    if (data.amount) await this.intakeAmount.fill(data.amount)
    if (data.currency) await this.intakeCurrency.selectOption(data.currency)
    if (data.invoiceNumber) await this.intakeInvoiceNumber.fill(data.invoiceNumber)
    if (data.invoiceDate) await this.intakeInvoiceDate.fill(data.invoiceDate)
    if (data.concept) await this.intakeConcept.fill(data.concept)
  }

  async submitForm() {
    await this.submitButton.click()
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term)
  }
}
