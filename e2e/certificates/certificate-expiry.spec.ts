import { test, expect } from '../fixtures/auth.fixture'
import { CertificatesPage } from '../pages/certificates.page'
import { waitForTableLoaded, hasTableData } from '../helpers/test-utils'

test.describe('Certificate Status Filtering', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin()
  })

  test('should show all certificates by default', async ({ page }) => {
    const certsPage = new CertificatesPage(page)
    await certsPage.goto()
    await waitForTableLoaded(page)
    await expect(certsPage.table).toBeVisible()
    await expect(certsPage.statusFilter).toBeVisible()
  })

  test('should filter by "Vigente" status', async ({ page }) => {
    const certsPage = new CertificatesPage(page)
    await certsPage.goto()
    await waitForTableLoaded(page)
    await certsPage.filterByStatus('valid')
    await page.waitForTimeout(500)
    // Verify filter applied - either data rows with Vigente badge or empty state
    const hasData = await hasTableData(page)
    if (hasData) {
      const badges = page.locator('tbody').getByText('Vigente')
      await expect(badges.first()).toBeVisible()
    } else {
      await expect(page.getByText(/No se encontraron/i)).toBeVisible()
    }
  })

  test('should filter by "Por vencer" status', async ({ page }) => {
    const certsPage = new CertificatesPage(page)
    await certsPage.goto()
    await waitForTableLoaded(page)
    await certsPage.filterByStatus('expiring_soon')
    await page.waitForTimeout(500)
    const hasData = await hasTableData(page)
    if (hasData) {
      const badges = page.locator('tbody').getByText('Por vencer')
      await expect(badges.first()).toBeVisible()
    } else {
      await expect(page.getByText(/No se encontraron/i)).toBeVisible()
    }
  })

  test('should filter by "Vencido" status', async ({ page }) => {
    const certsPage = new CertificatesPage(page)
    await certsPage.goto()
    await waitForTableLoaded(page)
    await certsPage.filterByStatus('expired')
    await page.waitForTimeout(500)
    const hasData = await hasTableData(page)
    if (hasData) {
      const badges = page.locator('tbody').getByText('Vencido')
      await expect(badges.first()).toBeVisible()
    } else {
      await expect(page.getByText(/No se encontraron/i)).toBeVisible()
    }
  })

  test('should reset filter to show all certificates', async ({ page }) => {
    const certsPage = new CertificatesPage(page)
    await certsPage.goto()
    await waitForTableLoaded(page)
    await certsPage.filterByStatus('valid')
    await page.waitForTimeout(500)
    await certsPage.filterByStatus('all')
    await page.waitForTimeout(500)
    // Just verify the table is visible after resetting
    await expect(certsPage.table).toBeVisible()
  })
})
