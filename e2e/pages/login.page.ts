import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly internalTab: Locator
  readonly corresponsalTab: Locator
  readonly errorAlert: Locator
  readonly registerLink: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('#email')
    this.passwordInput = page.locator('#password')
    this.submitButton = page.getByRole('button', { name: /Acceder/i })
    this.internalTab = page.getByRole('tab', { name: 'Interno' })
    this.corresponsalTab = page.getByRole('tab', { name: 'Corresponsal' })
    this.errorAlert = page.getByRole('alert')
    this.registerLink = page.getByRole('link', { name: /Registrate/i })
  }

  async goto() {
    await this.page.goto('/login')
  }

  async loginAsInternal(email: string, password: string) {
    await this.internalTab.click()
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async loginAsCorresponsal(email: string, password: string) {
    await this.corresponsalTab.click()
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.page.getByRole('button', { name: /Acceder al portal/i }).click()
  }

  async getErrorMessage() {
    return (await this.errorAlert.textContent()) ?? ''
  }
}
