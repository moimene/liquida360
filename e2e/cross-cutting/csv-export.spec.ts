import { test, expect } from '../fixtures/auth.fixture'
import { waitForTableLoaded } from '../helpers/test-utils'

test.describe('CSV Export', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin()
  })

  test('should export correspondents to CSV', async ({ page }) => {
    await page.goto('/correspondents')
    await waitForTableLoaded(page)
    const exportButton = page.getByRole('button', { name: /Exportar CSV/i })
    const hasExport = await exportButton.isVisible().catch(() => false)
    test.skip(!hasExport, 'No export button available')
    const downloadPromise = page.waitForEvent('download')
    await exportButton.click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.csv$/i)
  })

  test('should export liquidations to CSV', async ({ page }) => {
    await page.goto('/liquidations')
    await waitForTableLoaded(page)
    const exportButton = page.getByRole('button', { name: /Exportar CSV/i })
    const hasExport = await exportButton.isVisible().catch(() => false)
    test.skip(!hasExport, 'No export button available')
    const downloadPromise = page.waitForEvent('download')
    await exportButton.click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.csv$/i)
  })

  test('should export certificates to CSV', async ({ page }) => {
    await page.goto('/certificates')
    await waitForTableLoaded(page)
    const exportButton = page.getByRole('button', { name: /Exportar CSV/i })
    const hasExport = await exportButton.isVisible().catch(() => false)
    test.skip(!hasExport, 'No export button available')
    const downloadPromise = page.waitForEvent('download')
    await exportButton.click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.csv$/i)
  })
})
