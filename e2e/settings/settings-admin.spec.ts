import { test, expect } from '../fixtures/auth.fixture'
import { SettingsPage } from '../pages/settings.page'

test.describe('Settings (Admin Only)', () => {
  test('admin can access settings', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    const settingsPage = new SettingsPage(page)
    await settingsPage.goto()
    await expect(settingsPage.heading).toBeVisible()
  })

  test('should display alert configs tab', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    const settingsPage = new SettingsPage(page)
    await settingsPage.goto()
    await settingsPage.alertsTab.click()
    // Alertas tab contains "Nueva alerta" button and a table with alert configs
    await expect(settingsPage.newAlertButton).toBeVisible()
  })

  test('should display users tab', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    const settingsPage = new SettingsPage(page)
    await settingsPage.goto()
    await settingsPage.usersTab.click()
    await expect(settingsPage.usersList).toBeVisible()
  })

  test('should display general tab', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    const settingsPage = new SettingsPage(page)
    await settingsPage.goto()
    await settingsPage.generalTab.click()
    await expect(page).toHaveURL(/\/settings/)
  })

  test('should show invite user button on usuarios tab', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    const settingsPage = new SettingsPage(page)
    await settingsPage.goto()
    // "Invitar usuario" button is on the Usuarios tab
    await settingsPage.usersTab.click()
    await expect(settingsPage.inviteButton).toBeVisible()
  })

  test('pagador cannot access settings', async ({ page, loginAsPagador }) => {
    await loginAsPagador()
    await page.goto('/settings')
    await expect(page).not.toHaveURL(/\/settings/)
  })

  test('supervisor cannot access settings', async ({ page, loginAsSupervisor }) => {
    await loginAsSupervisor()
    await page.goto('/settings')
    await expect(page).not.toHaveURL(/\/settings/)
  })

  test('financiero cannot access settings', async ({ page, loginAsFinanciero }) => {
    await loginAsFinanciero()
    await page.goto('/settings')
    await expect(page).not.toHaveURL(/\/settings/)
  })

  test('should switch between tabs', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    const settingsPage = new SettingsPage(page)
    await settingsPage.goto()

    await settingsPage.alertsTab.click()
    await expect(settingsPage.newAlertButton).toBeVisible()

    await settingsPage.usersTab.click()
    await expect(settingsPage.usersList).toBeVisible()

    await settingsPage.generalTab.click()
    await expect(page).toHaveURL(/\/settings/)
  })
})
