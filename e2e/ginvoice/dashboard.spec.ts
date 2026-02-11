import { test, expect } from '../fixtures/auth.fixture'
import { GInvDashboardPage } from '../pages/ginv-dashboard.page'
import AxeBuilder from '@axe-core/playwright'

test.describe('G-Invoice Dashboard', () => {
  test.beforeEach(async ({ loginAsGInvAdmin }) => {
    await loginAsGInvAdmin()
  })

  test('should display dashboard heading', async ({ page }) => {
    const dashboard = new GInvDashboardPage(page)
    await dashboard.goto()
    await page.waitForLoadState('networkidle')
    await expect(dashboard.heading).toBeVisible()
  })

  test('should display current role for admin', async ({ page }) => {
    const dashboard = new GInvDashboardPage(page)
    await dashboard.goto()
    await page.waitForLoadState('networkidle')
    await expect(dashboard.roleDisplay).toBeVisible()
    await expect(dashboard.roleDisplay).toContainText('ginv_admin')
  })

  test('should display work queue and alerts sections', async ({ page }) => {
    const dashboard = new GInvDashboardPage(page)
    await dashboard.goto()
    await page.waitForLoadState('networkidle')
    await expect(dashboard.infoCard).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Alertas' })).toBeVisible()
  })

  test('@responsive should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const dashboard = new GInvDashboardPage(page)
    await dashboard.goto()
    await page.waitForLoadState('networkidle')
    await expect(dashboard.heading).toBeVisible()
  })

  test('should pass accessibility checks', async ({ page }) => {
    const dashboard = new GInvDashboardPage(page)
    await dashboard.goto()
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page }).analyze()
    const critical = results.violations.filter((v) => v.impact === 'critical')
    expect(critical).toEqual([])
  })
})
