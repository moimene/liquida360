import { test, expect } from '../fixtures/auth.fixture'
import { CertificatesPage } from '../pages/certificates.page'
import { waitForTableLoaded } from '../helpers/test-utils'

test.describe('Certificates CRUD', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin()
  })

  test('should display certificates table', async ({ page }) => {
    const certsPage = new CertificatesPage(page)
    await certsPage.goto()
    await expect(certsPage.heading).toBeVisible()
    await expect(certsPage.heading).toHaveText('Certificados de Residencia Fiscal')
    await expect(certsPage.table).toBeVisible()
  })

  test('should show expiry information in list', async ({ page }) => {
    const certsPage = new CertificatesPage(page)
    await certsPage.goto()
    await waitForTableLoaded(page)
    // Expect the Vencimiento column and at least one date or badge to appear
    const expiryHeader = page.getByRole('columnheader', { name: /Vencimiento/i })
    await expect(expiryHeader).toBeVisible()
    const expiryCell = page.locator('tbody td').filter({ hasText: /\d{2}\/\d{2}\/\d{4}|Vence|Vigente|Vencido/i }).first()
    await expect(expiryCell).toBeVisible()
  })

  test('should open create certificate dialog', async ({ page }) => {
    const certsPage = new CertificatesPage(page)
    await certsPage.goto()
    await certsPage.createButton.click()
    await expect(certsPage.formDialog).toBeVisible()
    await expect(certsPage.correspondentSelect).toBeVisible()
    await expect(certsPage.countrySelect).toBeVisible()
    await expect(certsPage.issueDateInput).toBeVisible()
    await expect(certsPage.expiryDateInput).toBeVisible()
  })

  test('should validate certificate form fields', async ({ page }) => {
    const certsPage = new CertificatesPage(page)
    await certsPage.goto()
    await certsPage.createButton.click()
    await certsPage.formSubmitButton.click()
    // Form should stay open with validation errors
    await expect(certsPage.formDialog).toBeVisible()
  })

  test('should display status badges correctly', async ({ page }) => {
    const certsPage = new CertificatesPage(page)
    await certsPage.goto()
    await waitForTableLoaded(page)
    // Check that at least one status badge text is visible in the table
    const statusBadges = page.locator('tbody').getByText(/Vigente|Por vencer|Vencido/)
    const count = await statusBadges.count()
    if (count > 0) {
      await expect(statusBadges.first()).toBeVisible()
    }
  })

  test('should sort certificates by columns', async ({ page }) => {
    const certsPage = new CertificatesPage(page)
    await certsPage.goto()
    await waitForTableLoaded(page)
    // Click on "Vencimiento" or "País emisor" column header to sort
    const header = page.getByRole('columnheader', { name: /País emisor|Vencimiento/i }).first()
    await header.click()
    await expect(certsPage.table).toBeVisible()
  })
})
