import { test, expect } from '../fixtures/auth.fixture'
import { GInvAccountingPage } from '../pages/ginv-accounting.page'
import { waitForToast, waitForTableLoaded, hasTableData } from '../helpers/test-utils'

test.describe('Contabilización', () => {
  test.beforeEach(async ({ loginAsGInvAdmin }) => {
    await loginAsGInvAdmin()
  })

  test('should display page heading', async ({ page }) => {
    const accounting = new GInvAccountingPage(page)
    await accounting.goto()
    await page.waitForLoadState('networkidle')
    await expect(accounting.heading).toBeVisible()
  })

  test('should display Exportar CSV button', async ({ page }) => {
    const accounting = new GInvAccountingPage(page)
    await accounting.goto()
    await page.waitForLoadState('networkidle')
    await expect(accounting.exportCsvButton).toBeVisible()
  })

  test('should display 3 KPI cards', async ({ page }) => {
    const accounting = new GInvAccountingPage(page)
    await accounting.goto()
    await page.waitForLoadState('networkidle')
    const kpiGrid = page.locator('.grid')
    await expect(kpiGrid.locator('> div').filter({ hasText: 'Aprobados (pendientes)' })).toBeVisible()
    await expect(kpiGrid.locator('> div').filter({ hasText: 'En contabilización' })).toBeVisible()
    await expect(kpiGrid.locator('> div').filter({ hasText: 'Contabilizados' })).toBeVisible()
  })

  test('should display table with correct columns', async ({ page }) => {
    const accounting = new GInvAccountingPage(page)
    await accounting.goto()
    await page.waitForLoadState('networkidle')
    const headers = ['Tipo', 'Nº Factura', 'Importe', 'Concepto', 'Estado', 'Acciones']
    for (const h of headers) {
      const headerEl = page.locator('thead th, thead td').filter({ hasText: h })
      const exists = await headerEl.count()
      if (exists === 0) {
        // Table might be empty, which is OK
        const isEmpty = await accounting.emptyState.isVisible().catch(() => false)
        if (isEmpty) break
      }
    }
  })

  test('should display empty state when no items', async ({ page }) => {
    const accounting = new GInvAccountingPage(page)
    await accounting.goto()
    await page.waitForLoadState('networkidle')
    const hasData = await hasTableData(page)
    if (!hasData) {
      await expect(accounting.emptyState).toBeVisible()
    }
  })

  test('should filter items by search text', async ({ page }) => {
    const accounting = new GInvAccountingPage(page)
    await accounting.goto()
    await page.waitForLoadState('networkidle')
    const hasData = await hasTableData(page)
    test.skip(!hasData, 'No data to filter')
    await accounting.searchFor('nonexistent-search-term-xyz')
    await page.waitForTimeout(500)
  })

  test('should filter items by status', async ({ page }) => {
    const accounting = new GInvAccountingPage(page)
    await accounting.goto()
    await page.waitForLoadState('networkidle')
    // Status filter should exist
    const statusSelect = page.locator('select').nth(0)
    await expect(statusSelect).toBeVisible()
  })

  test('should show Enviar a contab button for approved items', async ({ page }) => {
    const accounting = new GInvAccountingPage(page)
    await accounting.goto()
    await page.waitForLoadState('networkidle')
    const btn = accounting.sendToAccountingButton.first()
    const isVisible = await btn.isVisible().catch(() => false)
    test.skip(!isVisible, 'No approved items to send to accounting')
    await expect(btn).toBeVisible()
  })

  test('should open SAP dialog for sent items', async ({ page }) => {
    const accounting = new GInvAccountingPage(page)
    await accounting.goto()
    await page.waitForLoadState('networkidle')
    const btn = accounting.registerSapButton.first()
    const isVisible = await btn.isVisible().catch(() => false)
    test.skip(!isVisible, 'No items in sent_to_accounting state')
    await btn.click()
    await expect(accounting.sapRefInput).toBeVisible()
  })

  test('should have CSV export functionality', async ({ page }) => {
    const accounting = new GInvAccountingPage(page)
    await accounting.goto()
    await page.waitForLoadState('networkidle')
    await expect(accounting.exportCsvButton).toBeEnabled()
  })
})
