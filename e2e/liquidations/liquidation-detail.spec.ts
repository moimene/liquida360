import { test, expect } from '../fixtures/auth.fixture'
import { LiquidationsPage } from '../pages/liquidations.page'
import { LiquidationDetailPage } from '../pages/liquidation-detail.page'
import { waitForTableLoaded, expectBreadcrumbs, hasTableData } from '../helpers/test-utils'

test.describe('Liquidation Detail', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin()
  })

  test('should display liquidation detail page', async ({ page }) => {
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await waitForTableLoaded(page)
    const hasData = await hasTableData(page)
    test.skip(!hasData, 'No liquidations available')
    await liqPage.clickRow(0)
    const detailPage = new LiquidationDetailPage(page)
    await expect(detailPage.heading).toBeVisible()
    await expect(detailPage.dataCard).toBeVisible()
    await expect(detailPage.paymentCard).toBeVisible()
  })

  test('should display status timeline', async ({ page }) => {
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await waitForTableLoaded(page)
    const hasData = await hasTableData(page)
    test.skip(!hasData, 'No liquidations available')
    await liqPage.clickRow(0)
    const detailPage = new LiquidationDetailPage(page)
    await expect(detailPage.timeline).toBeVisible()
  })

  test('should display breadcrumbs', async ({ page }) => {
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await waitForTableLoaded(page)
    const hasData = await hasTableData(page)
    test.skip(!hasData, 'No liquidations available')
    await liqPage.clickRow(0)
    await expectBreadcrumbs(page, ['Inicio', 'Liquidaciones'])
  })

  test('should navigate back to list', async ({ page }) => {
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await waitForTableLoaded(page)
    const hasData = await hasTableData(page)
    test.skip(!hasData, 'No liquidations available')
    await liqPage.clickRow(0)
    const detailPage = new LiquidationDetailPage(page)
    await detailPage.backButton.click()
    await expect(page).toHaveURL(/\/liquidations$/)
  })

  test('should display correspondent information', async ({ page }) => {
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await waitForTableLoaded(page)
    const hasData = await hasTableData(page)
    test.skip(!hasData, 'No liquidations available')
    await liqPage.clickRow(0)
    const detailPage = new LiquidationDetailPage(page)
    await expect(detailPage.dataCard.getByText(/Corresponsal/i)).toBeVisible()
  })
})
