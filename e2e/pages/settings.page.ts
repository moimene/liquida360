import { Page, Locator } from '@playwright/test'

export class SettingsPage {
  readonly page: Page
  readonly heading: Locator
  readonly alertsTab: Locator
  readonly usersTab: Locator
  readonly generalTab: Locator
  readonly newAlertButton: Locator
  readonly inviteButton: Locator
  readonly alertForm: Locator
  readonly usersList: Locator

  constructor(page: Page) {
    this.page = page
    // The actual heading text is "Configuracion" without accent
    this.heading = page.getByRole('heading', { name: /Configuracion/i })
    this.alertsTab = page.getByRole('tab', { name: /Alertas/i })
    this.usersTab = page.getByRole('tab', { name: /Usuarios/i })
    this.generalTab = page.getByRole('tab', { name: /General/i })
    // "Nueva alerta" button is on the Alertas tab
    this.newAlertButton = page.getByRole('button', { name: /Nueva alerta/i })
    // "Invitar usuario" button is on the Usuarios tab
    this.inviteButton = page.getByRole('button', { name: /Invitar usuario/i })
    this.alertForm = page.getByRole('dialog')
    this.usersList = page.locator('table')
  }

  async goto() {
    await this.page.goto('/settings')
  }
}
