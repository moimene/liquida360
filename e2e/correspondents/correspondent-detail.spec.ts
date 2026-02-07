import { test, expect } from '../fixtures/auth.fixture'
import { CorrespondentsPage } from '../pages/correspondents.page'
import { CorrespondentDetailPage } from '../pages/correspondent-detail.page'
import { waitForTableLoaded, expectBreadcrumbs } from '../helpers/test-utils'

test.describe('Correspondent Detail', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin()
  })

  test('should display correspondent details', async ({ page }) => {
    // Navigate from list to first correspondent
    const listPage = new CorrespondentsPage(page)
    await listPage.goto()
    await waitForTableLoaded(page)
    const rowCount = await listPage.tableRows.count()
    test.skip(rowCount === 0, 'No correspondents available')
    await listPage.clickRow(0)
    await expect(page).toHaveURL(/\/correspondents\//)
    const detailPage = new CorrespondentDetailPage(page)
    await expect(detailPage.heading).toBeVisible()
    // Check for the "Datos del corresponsal" card (default tab)
    await expect(detailPage.dataCard).toBeVisible()
  })

  test('should show breadcrumbs navigation', async ({ page }) => {
    const listPage = new CorrespondentsPage(page)
    await listPage.goto()
    await waitForTableLoaded(page)
    const rowCount = await listPage.tableRows.count()
    test.skip(rowCount === 0, 'No correspondents available')
    await listPage.clickRow(0)
    const detailPage = new CorrespondentDetailPage(page)
    await expect(detailPage.breadcrumbs).toBeVisible()
    await expectBreadcrumbs(page, ['Inicio', 'Corresponsales'])
  })

  test('should display certificates tab', async ({ page }) => {
    const listPage = new CorrespondentsPage(page)
    await listPage.goto()
    await waitForTableLoaded(page)
    const rowCount = await listPage.tableRows.count()
    test.skip(rowCount === 0, 'No correspondents available')
    await listPage.clickRow(0)
    const detailPage = new CorrespondentDetailPage(page)
    await detailPage.certificatesTab.click()
    // Tab panel should be visible with certificate content
    await expect(detailPage.tabPanel).toBeVisible()
  })

  test('should display liquidations tab', async ({ page }) => {
    const listPage = new CorrespondentsPage(page)
    await listPage.goto()
    await waitForTableLoaded(page)
    const rowCount = await listPage.tableRows.count()
    test.skip(rowCount === 0, 'No correspondents available')
    await listPage.clickRow(0)
    const detailPage = new CorrespondentDetailPage(page)
    await detailPage.liquidationsTab.click()
    // Tab panel should be visible with payment history content
    await expect(detailPage.tabPanel).toBeVisible()
  })

  test('should navigate back to list', async ({ page }) => {
    const listPage = new CorrespondentsPage(page)
    await listPage.goto()
    await waitForTableLoaded(page)
    const rowCount = await listPage.tableRows.count()
    test.skip(rowCount === 0, 'No correspondents available')
    await listPage.clickRow(0)
    const detailPage = new CorrespondentDetailPage(page)
    await detailPage.backButton.click()
    await expect(page).toHaveURL(/\/correspondents$/)
  })
})
