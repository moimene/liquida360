import { test, expect } from '../fixtures/auth.fixture'
import { PortalProfilePage } from '../pages/portal-profile.page'
import { waitForToast } from '../helpers/test-utils'

test.describe('Portal Profile', () => {
  test.beforeEach(async ({ loginAsCorresponsal }) => {
    await loginAsCorresponsal()
  })

  // Helper: wait for profile to finish loading (the page shows "Cargando perfil..." while loading)
  async function waitForProfileLoaded(page: import('@playwright/test').Page) {
    await page.waitForLoadState('networkidle')
    // Wait for loading text to disappear (the component renders "Cargando perfil..." until data arrives)
    await expect(page.getByText('Cargando perfil...')).toBeHidden({ timeout: 15_000 }).catch(() => {})
  }

  test('should display profile page', async ({ page }) => {
    const profilePage = new PortalProfilePage(page)
    await profilePage.goto()
    await waitForProfileLoaded(page)
    await expect(profilePage.heading).toBeVisible({ timeout: 10_000 })
  })

  test('should display readonly firm data', async ({ page }) => {
    const profilePage = new PortalProfilePage(page)
    await profilePage.goto()
    await waitForProfileLoaded(page)
    // Check the "Datos del despacho" card and its fields
    await expect(page.getByText('Datos del despacho')).toBeVisible({ timeout: 10_000 })
    await expect(profilePage.firmName).toBeVisible()
    await expect(profilePage.country).toBeVisible()
    await expect(profilePage.taxId).toBeVisible()
  })

  test('should display editable contact fields', async ({ page }) => {
    const profilePage = new PortalProfilePage(page)
    await profilePage.goto()
    await waitForProfileLoaded(page)
    await expect(page.getByRole('heading', { name: 'Datos de contacto' })).toBeVisible({ timeout: 10_000 })
    await expect(profilePage.addressInput).toBeVisible()
    await expect(profilePage.emailInput).toBeVisible()
    await profilePage.phoneInput.scrollIntoViewIfNeeded()
    await expect(profilePage.phoneInput).toBeVisible()
  })

  test('should update profile data', async ({ page }) => {
    const profilePage = new PortalProfilePage(page)
    await profilePage.goto()
    await waitForProfileLoaded(page)
    await expect(profilePage.saveButton).toBeVisible({ timeout: 10_000 })
    const ts = Date.now()
    await profilePage.updateProfile({
      address: `Calle E2E Test ${ts}, Madrid`,
    })
    await waitForToast(page, /guardad|actualizado/i)
  })

  test('should display save button', async ({ page }) => {
    const profilePage = new PortalProfilePage(page)
    await profilePage.goto()
    await waitForProfileLoaded(page)
    await expect(profilePage.saveButton).toBeVisible({ timeout: 10_000 })
  })
})
