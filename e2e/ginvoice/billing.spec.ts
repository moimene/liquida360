import { test, expect } from '../fixtures/auth.fixture'
import { GInvBillingPage } from '../pages/ginv-billing.page'
import { waitForToast, waitForTableLoaded, hasTableData } from '../helpers/test-utils'

test.describe('Para Facturar', () => {
  test.beforeEach(async ({ loginAsGInvAdmin }) => {
    await loginAsGInvAdmin()
  })

  test('should display page heading', async ({ page }) => {
    const billing = new GInvBillingPage(page)
    await billing.goto()
    await page.waitForLoadState('networkidle')
    await expect(billing.heading).toBeVisible()
    await expect(billing.heading).toHaveText('Para Facturar')
  })

  test('should display 3 KPI cards', async ({ page }) => {
    const billing = new GInvBillingPage(page)
    await billing.goto()
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Contabilizados.*pte\. agrupar/)).toBeVisible()
    await expect(page.getByText(/En lotes para facturar/)).toBeVisible()
    await expect(page.getByText('Lotes creados')).toBeVisible()
  })

  test('should default to Cargos disponibles tab', async ({ page }) => {
    const billing = new GInvBillingPage(page)
    await billing.goto()
    await page.waitForLoadState('networkidle')
    await expect(billing.itemsTab).toBeVisible()
    // The items tab should be active by default
    const itemsTabStyle = await billing.itemsTab.getAttribute('style')
    expect(itemsTabStyle).toContain('var(--g-brand-3308)')
  })

  test('should switch to Lotes tab', async ({ page }) => {
    const billing = new GInvBillingPage(page)
    await billing.goto()
    await page.waitForLoadState('networkidle')
    await billing.batchesTab.click()
    const batchesTabStyle = await billing.batchesTab.getAttribute('style')
    expect(batchesTabStyle).toContain('var(--g-brand-3308)')
  })

  test('should display checkboxes in items tab', async ({ page }) => {
    const billing = new GInvBillingPage(page)
    await billing.goto()
    await page.waitForLoadState('networkidle')
    const isEmpty = await billing.emptyState.isVisible().catch(() => false)
    test.skip(isEmpty, 'No posted items to display checkboxes')
    const checkbox = billing.rowCheckboxes.first()
    await expect(checkbox).toBeVisible()
  })

  test('should show Crear lote button when items selected', async ({ page }) => {
    const billing = new GInvBillingPage(page)
    await billing.goto()
    await page.waitForLoadState('networkidle')
    const isEmpty = await billing.emptyState.isVisible().catch(() => false)
    test.skip(isEmpty, 'No posted items available')
    // Select first checkbox
    const checkbox = billing.rowCheckboxes.first()
    await checkbox.check()
    await expect(billing.createBatchButton).toBeVisible()
  })

  test('should open batch creation dialog', async ({ page }) => {
    const billing = new GInvBillingPage(page)
    await billing.goto()
    await page.waitForLoadState('networkidle')
    const isEmpty = await billing.emptyState.isVisible().catch(() => false)
    test.skip(isEmpty, 'No posted items available')
    const checkbox = billing.rowCheckboxes.first()
    await checkbox.check()
    await billing.createBatchButton.click()
    await expect(billing.batchDialog).toBeVisible()
    // UTTAI select should be present in the dialog
    await expect(billing.uttaiSelect).toBeVisible()
  })

  test('should display batches table in Lotes tab', async ({ page }) => {
    const billing = new GInvBillingPage(page)
    await billing.goto()
    await page.waitForLoadState('networkidle')
    await billing.batchesTab.click()
    await page.waitForLoadState('networkidle')
    // If empty state is shown without a table, skip
    const emptyVisible = await billing.emptyBatches.isVisible().catch(() => false)
    const hasTable = await page.locator('thead').isVisible().catch(() => false)
    test.skip(emptyVisible && !hasTable, 'No batches and table headers not rendered in empty state')
    // Table headers should be visible
    await expect(page.locator('thead th').filter({ hasText: 'Lote' })).toBeVisible()
    await expect(page.locator('thead th').filter({ hasText: 'Job' })).toBeVisible()
  })

  test('should show batch detail dialog via Ver cargos', async ({ page }) => {
    const billing = new GInvBillingPage(page)
    await billing.goto()
    await page.waitForLoadState('networkidle')
    await billing.batchesTab.click()
    await waitForTableLoaded(page)
    const viewBtn = billing.viewBatchItemsButton.first()
    const isVisible = await viewBtn.isVisible().catch(() => false)
    test.skip(!isVisible, 'No batches available to view')
    await viewBtn.click()
    await expect(billing.batchDetailDialog).toBeVisible()
  })

  test('should show decision buttons in batch detail', async ({ page }) => {
    const billing = new GInvBillingPage(page)
    await billing.goto()
    await page.waitForLoadState('networkidle')
    await billing.batchesTab.click()
    await waitForTableLoaded(page)
    // Try each batch's "Ver cargos" until we find one with decision buttons
    const viewBtns = billing.viewBatchItemsButton
    const btnCount = await viewBtns.count()
    test.skip(btnCount === 0, 'No batches available to view')
    let foundDecisionButtons = false
    for (let i = 0; i < btnCount; i++) {
      await viewBtns.nth(i).click()
      await expect(billing.batchDetailDialog).toBeVisible()
      const emitBtn = page.getByRole('button', { name: 'Emitir' }).first()
      const hasEmit = await emitBtn.isVisible().catch(() => false)
      if (hasEmit) {
        foundDecisionButtons = true
        await expect(emitBtn).toBeVisible()
        await expect(page.getByRole('button', { name: 'Transferir' }).first()).toBeVisible()
        await expect(page.getByRole('button', { name: 'Descartar' }).first()).toBeVisible()
        break
      }
      // Close dialog and try next batch
      await page.keyboard.press('Escape')
      await expect(billing.batchDetailDialog).not.toBeVisible({ timeout: 3_000 }).catch(() => {})
    }
    test.skip(!foundDecisionButtons, 'No batch items with decision buttons in any batch')
  })

  test('should display empty state when no posted items', async ({ page }) => {
    const billing = new GInvBillingPage(page)
    await billing.goto()
    await page.waitForLoadState('networkidle')
    const hasData = await hasTableData(page)
    if (!hasData) {
      await expect(billing.emptyState).toBeVisible()
    }
  })
})
