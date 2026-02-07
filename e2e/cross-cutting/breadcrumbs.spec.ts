import { test, expect } from '../fixtures/auth.fixture'
import { waitForTableLoaded } from '../helpers/test-utils'

test.describe('Breadcrumbs Navigation', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin()
  })

  test('should show breadcrumbs on correspondent detail page', async ({ page }) => {
    // List pages do NOT have breadcrumbs; only detail pages do
    await page.goto('/correspondents')
    await waitForTableLoaded(page)
    const rows = page.locator('tbody tr')
    const count = await rows.count()
    test.skip(count === 0, 'No correspondents available to view detail')
    await rows.first().click()
    // Now on detail page, breadcrumbs should be visible
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumbs).toBeVisible()
    await expect(breadcrumbs.getByText('Inicio')).toBeVisible()
    await expect(breadcrumbs.getByText('Corresponsales')).toBeVisible()
  })

  test('should show breadcrumbs on liquidation detail page', async ({ page }) => {
    await page.goto('/liquidations')
    await waitForTableLoaded(page)
    const rows = page.locator('tbody tr')
    const count = await rows.count()
    test.skip(count === 0, 'No liquidations available to view detail')
    await rows.first().click()
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumbs).toBeVisible()
    await expect(breadcrumbs.getByText('Inicio')).toBeVisible()
    await expect(breadcrumbs.getByText('Liquidaciones')).toBeVisible()
  })

  test('should have last breadcrumb item as current page', async ({ page }) => {
    await page.goto('/correspondents')
    await waitForTableLoaded(page)
    const rows = page.locator('tbody tr')
    const count = await rows.count()
    test.skip(count === 0, 'No correspondents available to view detail')
    await rows.first().click()
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumbs).toBeVisible()
    // Last item should have aria-current="page"
    const lastItem = breadcrumbs.locator('[aria-current="page"]')
    await expect(lastItem).toBeVisible()
  })

  test('should navigate via breadcrumb links', async ({ page }) => {
    await page.goto('/correspondents')
    await waitForTableLoaded(page)
    const rows = page.locator('tbody tr')
    const count = await rows.count()
    test.skip(count === 0, 'No correspondents available to view detail')
    await rows.first().click()
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumbs).toBeVisible()
    await breadcrumbs.getByText('Inicio').click()
    await expect(page).toHaveURL('/')
  })
})
