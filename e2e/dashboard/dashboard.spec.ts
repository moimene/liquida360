import { test, expect } from '../fixtures/auth.fixture'
import { DashboardPage } from '../pages/dashboard.page'
import AxeBuilder from '@axe-core/playwright'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin()
  })

  test('should display KPI cards', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await page.waitForLoadState('networkidle')
    // Verify KPI card titles are visible
    await expect(page.getByText('Liquidaciones pendientes')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Certificados por vencer').first()).toBeVisible()
    // Admin sees "Pagos pendientes", other roles may see "En aprobación/pago"
    const hasPagos = await page.getByText('Pagos pendientes').isVisible().catch(() => false)
    const hasAprobacion = await page.getByText('En aprobación/pago').isVisible().catch(() => false)
    expect(hasPagos || hasAprobacion).toBeTruthy()
  })

  test('should display liquidation trend chart section', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await page.waitForLoadState('networkidle')
    // Wait for loading to finish - charts render only after loading=false and data exists
    await page.waitForTimeout(3_000)
    const trendTitle = page.getByText('Tendencia de liquidaciones')
    const hasTrend = await trendTitle.isVisible().catch(() => false)
    if (hasTrend) {
      await expect(trendTitle).toBeVisible()
    } else {
      await expect(page.getByText(/Sin datos|No hay datos/i)).toBeVisible()
    }
  })

  test('should display liquidation status chart section', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await page.waitForLoadState('networkidle')
    // Wait for loading to finish
    await page.waitForTimeout(3_000)
    const statusTitle = page.getByText('Distribución por estado')
    const hasStatus = await statusTitle.isVisible().catch(() => false)
    if (hasStatus) {
      await expect(statusTitle).toBeVisible()
    } else {
      await expect(page.getByText(/Sin datos|No hay datos/i)).toBeVisible()
    }
  })

  test('should display certificate alerts section', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Alertas de certificados')).toBeVisible({ timeout: 10_000 })
  })

  test('should display recent liquidations section', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Liquidaciones recientes')).toBeVisible({ timeout: 10_000 })
  })

  test('should navigate to liquidations from view all button', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await page.waitForLoadState('networkidle')
    await expect(dashboard.viewAllButton).toBeVisible({ timeout: 10_000 })
    await dashboard.viewAllButton.click()
    await expect(page).toHaveURL(/\/liquidations/)
  })

  test('@responsive should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Liquidaciones pendientes')).toBeVisible({ timeout: 10_000 })
  })

  test('should pass accessibility checks', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page })
      .exclude('.recharts-wrapper') // Exclude chart SVGs from a11y scan
      .analyze()
    // Only fail on critical-impact violations
    const critical = results.violations.filter((v) => v.impact === 'critical')
    expect(critical).toEqual([])
  })
})
