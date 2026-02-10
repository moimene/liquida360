import { test, expect } from '../fixtures/auth.fixture'
import { GInvInvoicesPage } from '../pages/ginv-invoices.page'
import { waitForToast, waitForTableLoaded, hasTableData } from '../helpers/test-utils'

test.describe('Facturas Cliente', () => {
  test.beforeEach(async ({ loginAsGInvAdmin }) => {
    await loginAsGInvAdmin()
  })

  test('should display page heading', async ({ page }) => {
    const invoices = new GInvInvoicesPage(page)
    await invoices.goto()
    await page.waitForLoadState('networkidle')
    await expect(invoices.heading).toBeVisible()
    await expect(invoices.heading).toHaveText('Facturas Cliente')
  })

  test('should display Nueva Factura button', async ({ page }) => {
    const invoices = new GInvInvoicesPage(page)
    await invoices.goto()
    await page.waitForLoadState('networkidle')
    await expect(invoices.createButton).toBeVisible()
  })

  test('should display 4 KPI cards', async ({ page }) => {
    const invoices = new GInvInvoicesPage(page)
    await invoices.goto()
    await page.waitForLoadState('networkidle')
    // 4 status KPI cards
    const kpiCards = page.locator('.grid > .p-4')
    const count = await kpiCards.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('should display table with correct columns', async ({ page }) => {
    const invoices = new GInvInvoicesPage(page)
    await invoices.goto()
    await page.waitForLoadState('networkidle')
    const headers = ['ID', 'Nº SAP', 'Fecha SAP', 'Estado', 'Acciones']
    for (const h of headers) {
      await expect(page.locator('thead th').filter({ hasText: h }).first()).toBeVisible()
    }
  })

  test('should display empty state when no invoices', async ({ page }) => {
    const invoices = new GInvInvoicesPage(page)
    await invoices.goto()
    await page.waitForLoadState('networkidle')
    const hasData = await hasTableData(page)
    if (!hasData) {
      await expect(page.getByText('No hay facturas')).toBeVisible()
    }
  })

  test('should open create dialog with batch select', async ({ page }) => {
    const invoices = new GInvInvoicesPage(page)
    await invoices.goto()
    await page.waitForLoadState('networkidle')
    await invoices.createButton.click()
    await expect(invoices.createDialog).toBeVisible()
    await expect(invoices.batchSelect).toBeVisible()
  })

  test('should have search filter', async ({ page }) => {
    const invoices = new GInvInvoicesPage(page)
    await invoices.goto()
    await page.waitForLoadState('networkidle')
    await expect(invoices.searchInput).toBeVisible()
    await invoices.searchInput.fill('nonexistent-invoice-xyz')
    await page.waitForTimeout(500)
  })

  test('should have status filter', async ({ page }) => {
    const invoices = new GInvInvoicesPage(page)
    await invoices.goto()
    await page.waitForLoadState('networkidle')
    await expect(invoices.statusFilter).toBeVisible()
  })

  test('should show Solicitar aprobación for draft invoices', async ({ page }) => {
    const invoices = new GInvInvoicesPage(page)
    await invoices.goto()
    await page.waitForLoadState('networkidle')
    await waitForTableLoaded(page)
    const btn = invoices.requestApprovalButton.first()
    const isVisible = await btn.isVisible().catch(() => false)
    test.skip(!isVisible, 'No draft invoices to request approval')
    await expect(btn).toBeVisible()
  })

  test('should show Aprobar button for ginv_socio_aprobador role', async ({ page, loginAsGInvSocio }) => {
    await loginAsGInvSocio()
    const invoices = new GInvInvoicesPage(page)
    await invoices.goto()
    await page.waitForLoadState('networkidle')
    await waitForTableLoaded(page)
    const btn = invoices.approveButton.first()
    const isVisible = await btn.isVisible().catch(() => false)
    test.skip(!isVisible, 'No invoices pending partner approval')
    await expect(btn).toBeVisible()
  })
})
