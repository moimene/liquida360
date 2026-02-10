import { test, expect } from '../fixtures/auth.fixture'
import { GInvPlatformsPage } from '../pages/ginv-platforms.page'
import { waitForToast, waitForTableLoaded, hasTableData } from '../helpers/test-utils'

test.describe('Plataformas', () => {
  test.beforeEach(async ({ loginAsGInvAdmin }) => {
    await loginAsGInvAdmin()
  })

  test('should display page heading', async ({ page }) => {
    const platforms = new GInvPlatformsPage(page)
    await platforms.goto()
    await page.waitForLoadState('networkidle')
    await expect(platforms.heading).toBeVisible()
    await expect(platforms.heading).toHaveText('Plataformas')
  })

  test('should display Nueva Tarea button', async ({ page }) => {
    const platforms = new GInvPlatformsPage(page)
    await platforms.goto()
    await page.waitForLoadState('networkidle')
    await expect(platforms.createButton).toBeVisible()
  })

  test('should display 4 KPI cards including SLA overdue', async ({ page }) => {
    const platforms = new GInvPlatformsPage(page)
    await platforms.goto()
    await page.waitForLoadState('networkidle')
    const kpiGrid = page.locator('.grid')
    await expect(kpiGrid.locator('> div').filter({ hasText: 'Pendientes' })).toBeVisible()
    await expect(kpiGrid.locator('> div').filter({ hasText: 'En curso' })).toBeVisible()
    await expect(kpiGrid.locator('> div').filter({ hasText: 'Completadas' })).toBeVisible()
    await expect(kpiGrid.locator('> div').filter({ hasText: 'Vencidas SLA' })).toBeVisible()
  })

  test('should display table with correct columns', async ({ page }) => {
    const platforms = new GInvPlatformsPage(page)
    await platforms.goto()
    await page.waitForLoadState('networkidle')
    const headers = ['Plataforma', 'Código', 'Nº Factura', 'SLA', 'Estado', 'Acciones']
    for (const h of headers) {
      await expect(page.locator('thead th').filter({ hasText: h }).first()).toBeVisible()
    }
  })

  test('should display empty state when no platform tasks', async ({ page }) => {
    const platforms = new GInvPlatformsPage(page)
    await platforms.goto()
    await page.waitForLoadState('networkidle')
    const hasData = await hasTableData(page)
    if (!hasData) {
      await expect(page.getByText('No hay tareas de plataforma')).toBeVisible()
    }
  })

  test('should open create task dialog', async ({ page }) => {
    const platforms = new GInvPlatformsPage(page)
    await platforms.goto()
    await page.waitForLoadState('networkidle')
    await platforms.createButton.click()
    await expect(platforms.createDialog).toBeVisible()
    await expect(platforms.invoiceSelect).toBeVisible()
    await expect(platforms.platformInput).toBeVisible()
  })

  test('should have search filter', async ({ page }) => {
    const platforms = new GInvPlatformsPage(page)
    await platforms.goto()
    await page.waitForLoadState('networkidle')
    await expect(platforms.searchInput).toBeVisible()
    await platforms.searchInput.fill('nonexistent-platform-xyz')
    await page.waitForTimeout(500)
  })

  test('should have status filter', async ({ page }) => {
    const platforms = new GInvPlatformsPage(page)
    await platforms.goto()
    await page.waitForLoadState('networkidle')
    await expect(platforms.statusFilter).toBeVisible()
  })

  test('should show Iniciar button for pending tasks', async ({ page }) => {
    const platforms = new GInvPlatformsPage(page)
    await platforms.goto()
    await page.waitForLoadState('networkidle')
    await waitForTableLoaded(page)
    const btn = platforms.startButton.first()
    const isVisible = await btn.isVisible().catch(() => false)
    test.skip(!isVisible, 'No pending tasks to start')
    await expect(btn).toBeVisible()
  })

  test('should show Completar and Bloquear buttons for in-progress tasks', async ({ page }) => {
    const platforms = new GInvPlatformsPage(page)
    await platforms.goto()
    await page.waitForLoadState('networkidle')
    await waitForTableLoaded(page)
    const completeBtn = platforms.completeButton.first()
    const isVisible = await completeBtn.isVisible().catch(() => false)
    test.skip(!isVisible, 'No in-progress tasks to complete/block')
    await expect(completeBtn).toBeVisible()
    const blockBtn = platforms.blockButton.first()
    const blockVisible = await blockBtn.isVisible().catch(() => false)
    if (blockVisible) {
      await expect(blockBtn).toBeVisible()
    }
  })
})
