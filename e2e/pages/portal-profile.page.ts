import { Page, Locator } from '@playwright/test'

export class PortalProfilePage {
  readonly page: Page
  readonly heading: Locator
  readonly firmDataCard: Locator
  readonly firmName: Locator
  readonly country: Locator
  readonly taxId: Locator
  readonly contactCard: Locator
  readonly addressInput: Locator
  readonly emailInput: Locator
  readonly phoneInput: Locator
  readonly saveButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { level: 1 }).filter({ hasText: /Mi perfil/ })
    this.firmDataCard = page.getByText('Datos del despacho').locator('..').locator('..')
    this.firmName = page.getByText('Nombre').first()
    this.country = page.getByText('Pais').first()
    this.taxId = page.getByText('NIF / Tax ID')
    this.contactCard = page.getByText('Datos de contacto').locator('..').locator('..')
    this.addressInput = page.locator('#profile-address')
    this.emailInput = page.locator('#profile-email')
    this.phoneInput = page.locator('#profile-phone')
    this.saveButton = page.getByRole('button', { name: /Guardar cambios/i })
  }

  async goto() {
    await this.page.goto('/portal/profile')
  }

  async updateProfile(data: { address?: string; email?: string; phone?: string }) {
    if (data.address) {
      await this.addressInput.clear()
      await this.addressInput.fill(data.address)
    }
    if (data.email) {
      await this.emailInput.clear()
      await this.emailInput.fill(data.email)
    }
    if (data.phone) {
      await this.phoneInput.clear()
      await this.phoneInput.fill(data.phone)
    }
    await this.saveButton.click()
  }
}
