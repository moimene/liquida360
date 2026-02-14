import { test, expect } from '../fixtures/auth.fixture'
import { GInvSettingsPage } from '../pages/ginv-settings.page'

test.describe('G-Invoice Configuración', () => {
  test.beforeEach(async ({ loginAsGInvAdmin }) => {
    await loginAsGInvAdmin()
  })

  test('ginv_admin should see settings console and controls', async ({ page }) => {
    const settingsPage = new GInvSettingsPage(page)
    await settingsPage.goto()
    await page.waitForLoadState('networkidle')

    await expect(settingsPage.heading).toBeVisible()
    await expect(settingsPage.saveButton).toBeVisible()
    await expect(settingsPage.resetButton).toBeVisible()
    await expect(settingsPage.uttaiPolicySelect).toBeVisible()
    await expect(settingsPage.deliveryAttachmentSelect).toBeVisible()
    await expect(settingsPage.signedUrlMinutesInput).toBeVisible()
    await expect(settingsPage.certificateAlertDaysInput).toBeVisible()
    await expect(settingsPage.platformSlaHoursInput).toBeVisible()
    await expect(settingsPage.openLatestInvoicePdfButton).toBeVisible()
  })

  test('settings should persist after save and reload', async ({ page }) => {
    const settingsPage = new GInvSettingsPage(page)
    await settingsPage.goto()
    await page.waitForLoadState('networkidle')

    await settingsPage.uttaiPolicySelect.selectOption('warn')
    await settingsPage.deliveryAttachmentSelect.selectOption('zip')
    await settingsPage.signedUrlMinutesInput.fill('25')
    await settingsPage.certificateAlertDaysInput.fill('90,45,10')
    await settingsPage.platformSlaHoursInput.fill('72')

    await settingsPage.saveButton.click()
    await expect(page.getByText('Configuración guardada')).toBeVisible()

    await page.reload()
    await page.waitForLoadState('networkidle')

    await expect(settingsPage.uttaiPolicySelect).toHaveValue('warn')
    await expect(settingsPage.deliveryAttachmentSelect).toHaveValue('zip')
    await expect(settingsPage.signedUrlMinutesInput).toHaveValue('25')
    await expect(settingsPage.certificateAlertDaysInput).toHaveValue('90,45,10')
    await expect(settingsPage.platformSlaHoursInput).toHaveValue('72')
  })

  test('ginv_operador should be redirected away from /g-invoice/settings', async ({
    page,
    loginAsGInvOperador,
  }) => {
    await loginAsGInvOperador()
    await page.goto('/g-invoice/settings')
    await expect(page).toHaveURL(/\/g-invoice$/)
    await expect(page.getByRole('heading', { name: 'G-Invoice Dashboard' })).toBeVisible()
  })
})
