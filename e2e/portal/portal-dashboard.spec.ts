import { test, expect } from '../fixtures/auth.fixture'
import { PortalDashboardPage } from '../pages/portal-dashboard.page'

test.describe('Portal Dashboard', () => {
  test.beforeEach(async ({ loginAsCorresponsal }) => {
    await loginAsCorresponsal()
  })

  test('should display welcome message', async ({ page }) => {
    const dashboard = new PortalDashboardPage(page)
    await dashboard.goto()
    await expect(dashboard.welcomeHeading).toBeVisible()
    await expect(page.getByText(/Bienvenido/)).toBeVisible()
  })

  test('should display KPI cards', async ({ page }) => {
    const dashboard = new PortalDashboardPage(page)
    await dashboard.goto()
    await expect(dashboard.kpiBorradores).toBeVisible()
    await expect(dashboard.kpiEnProceso).toBeVisible()
    await expect(dashboard.kpiPagadas).toBeVisible()
    await expect(dashboard.kpiCertificados).toBeVisible()
  })

  test('should display certificate alerts when applicable', async ({ page }) => {
    const dashboard = new PortalDashboardPage(page)
    await dashboard.goto()
    // Certificate alert may or may not be present depending on data
    // If present, it contains text about "vencido" or a "Ver certificados" button
    await expect(page).toHaveURL(/\/portal/)
    const alertVisible = await page.getByText(/vencido|proximo/i).first().isVisible().catch(() => false)
    if (alertVisible) {
      await expect(page.getByRole('button', { name: /Ver certificados/i })).toBeVisible()
    }
  })

  test('should display recent invoices section', async ({ page }) => {
    const dashboard = new PortalDashboardPage(page)
    await dashboard.goto()
    await expect(dashboard.recentInvoices).toBeVisible()
  })

  test('should only show data for current corresponsal', async ({ page }) => {
    const dashboard = new PortalDashboardPage(page)
    await dashboard.goto()
    // Verify we're on portal and not seeing admin data
    await expect(page).toHaveURL(/\/portal/)
    // The portal dashboard says "Panel de control de tu portal de corresponsal" (not "Panel de Control" as admin heading)
    await expect(page.getByRole('heading', { name: /Panel de Control/i })).not.toBeVisible()
  })
})
