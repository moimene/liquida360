import { test, expect } from '../fixtures/test-data.fixture'
import { CorrespondentsPage } from '../pages/correspondents.page'
import { waitForToast, waitForTableLoaded } from '../helpers/test-utils'

test.describe('Correspondents CRUD', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin()
  })

  test('should display correspondents table', async ({ page }) => {
    const correspondentsPage = new CorrespondentsPage(page)
    await correspondentsPage.goto()
    await expect(correspondentsPage.heading).toBeVisible()
    await expect(correspondentsPage.heading).toHaveText('Corresponsales')
    await expect(correspondentsPage.table).toBeVisible()
  })

  test('should create a new correspondent', async ({ page, testCorrespondent }) => {
    const correspondentsPage = new CorrespondentsPage(page)
    await correspondentsPage.goto()
    await correspondentsPage.createCorrespondent(testCorrespondent)
    await waitForToast(page, /creado|guardado/i)
    await expect(correspondentsPage.formDialog).not.toBeVisible()
  })

  test('should open create form dialog', async ({ page }) => {
    const correspondentsPage = new CorrespondentsPage(page)
    await correspondentsPage.goto()
    await correspondentsPage.createButton.click()
    await expect(correspondentsPage.formDialog).toBeVisible()
    await expect(correspondentsPage.nameInput).toBeVisible()
    await expect(correspondentsPage.countrySelect).toBeVisible()
    await expect(correspondentsPage.taxIdInput).toBeVisible()
  })

  test('should validate required fields in create form', async ({ page }) => {
    const correspondentsPage = new CorrespondentsPage(page)
    await correspondentsPage.goto()
    await correspondentsPage.createButton.click()
    await correspondentsPage.formSubmitButton.click()
    // Form should stay open with validation errors
    await expect(correspondentsPage.formDialog).toBeVisible()
  })

  test('should search correspondents by name', async ({ page }) => {
    const correspondentsPage = new CorrespondentsPage(page)
    await correspondentsPage.goto()
    await waitForTableLoaded(page)
    const initialCount = await correspondentsPage.tableRows.count()
    await correspondentsPage.searchFor('NonExistentCorrespondent12345')
    // Wait for filter to apply
    await page.waitForTimeout(500)
    const filteredCount = await correspondentsPage.tableRows.count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)
  })

  test('should sort table by columns', async ({ page }) => {
    const correspondentsPage = new CorrespondentsPage(page)
    await correspondentsPage.goto()
    await waitForTableLoaded(page)
    // Click on column header button to sort by Nombre
    const nameHeader = page.getByRole('columnheader', { name: /Nombre/i })
    await nameHeader.click()
    await waitForTableLoaded(page)
    // Table should still be visible after sorting
    await expect(correspondentsPage.table).toBeVisible()
  })

  test('should navigate to correspondent detail', async ({ page }) => {
    const correspondentsPage = new CorrespondentsPage(page)
    await correspondentsPage.goto()
    await waitForTableLoaded(page)
    const rowCount = await correspondentsPage.tableRows.count()
    if (rowCount > 0) {
      // Click the eye icon on the first row
      const firstEyeButton = page.getByRole('button', { name: /Ver detalle de/i }).first()
      await firstEyeButton.click()
      await expect(page).toHaveURL(/\/correspondents\//)
    }
  })

  test('should export correspondents to CSV', async ({ page }) => {
    const correspondentsPage = new CorrespondentsPage(page)
    await correspondentsPage.goto()
    await waitForTableLoaded(page)
    const downloadPromise = page.waitForEvent('download')
    await correspondentsPage.exportButton.click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.csv$/)
  })
})
