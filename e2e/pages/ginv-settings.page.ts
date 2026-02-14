import { Locator, Page } from '@playwright/test'

export class GInvSettingsPage {
  readonly page: Page
  readonly heading: Locator
  readonly saveButton: Locator
  readonly resetButton: Locator
  readonly uttaiPolicySelect: Locator
  readonly deliveryAttachmentSelect: Locator
  readonly invoicePdfRequiredCheckbox: Locator
  readonly signedUrlMinutesInput: Locator
  readonly certificateAlertDaysInput: Locator
  readonly platformSlaHoursInput: Locator
  readonly openLatestInvoicePdfButton: Locator
  readonly unsavedChangesBadge: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Consola de configuración G-Invoice' })
    this.saveButton = page.getByRole('button', { name: 'Guardar cambios' })
    this.resetButton = page.getByRole('button', { name: 'Restaurar defaults' })
    this.uttaiPolicySelect = page.locator('#uttai-gate-mode')
    this.deliveryAttachmentSelect = page.locator('#delivery-attachment-mode')
    this.invoicePdfRequiredCheckbox = page.getByLabel('El PDF de factura es obligatorio para continuar flujo')
    this.signedUrlMinutesInput = page.locator('#signed-url-minutes')
    this.certificateAlertDaysInput = page.locator('#certificate-alert-days')
    this.platformSlaHoursInput = page.locator('#platform-sla-hours')
    this.openLatestInvoicePdfButton = page.getByRole('button', { name: 'Abrir última factura con PDF' })
    this.unsavedChangesBadge = page.getByText('Cambios sin guardar')
  }

  async goto() {
    await this.page.goto('/g-invoice/settings')
  }
}
