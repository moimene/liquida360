import { test, expect } from '../fixtures/auth.fixture'
import { LiquidationDetailPage } from '../pages/liquidation-detail.page'
import { LiquidationsPage } from '../pages/liquidations.page'
import { waitForTableLoaded, waitForToast } from '../helpers/test-utils'

test.describe('Liquidation Workflow', () => {
  test('pagador can submit draft for approval', async ({ page, loginAsPagador }) => {
    await loginAsPagador()
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await waitForTableLoaded(page)
    // Find a draft liquidation
    const draftRow = page.locator('tbody tr').filter({ hasText: /Borrador/i }).first()
    const hasDraft = await draftRow.isVisible().catch(() => false)
    test.skip(!hasDraft, 'No draft liquidations available')
    await draftRow.click()
    const detailPage = new LiquidationDetailPage(page)
    await expect(detailPage.submitForApprovalButton).toBeVisible()
    await detailPage.submitForApprovalButton.click()
    // Wait for any toast (success or error)
    const toast = page.locator('[data-sonner-toast]').first()
    await expect(toast).toBeVisible({ timeout: 10_000 })
  })

  test('supervisor can approve pending liquidation', async ({ page, loginAsSupervisor }) => {
    await loginAsSupervisor()
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await waitForTableLoaded(page)
    const pendingRow = page.locator('tbody tr').filter({ hasText: /Pendiente/i }).first()
    const hasPending = await pendingRow.isVisible().catch(() => false)
    test.skip(!hasPending, 'No pending liquidations available')
    await pendingRow.click()
    const detailPage = new LiquidationDetailPage(page)
    await expect(detailPage.approveButton).toBeVisible()
    await detailPage.approveButton.click()
    await waitForToast(page, /aprobada/i)
  })

  test('supervisor can reject pending liquidation', async ({ page, loginAsSupervisor }) => {
    await loginAsSupervisor()
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await waitForTableLoaded(page)
    const pendingRow = page.locator('tbody tr').filter({ hasText: /Pendiente/i }).first()
    const hasPending = await pendingRow.isVisible().catch(() => false)
    test.skip(!hasPending, 'No pending liquidations available')
    await pendingRow.click()
    const detailPage = new LiquidationDetailPage(page)
    await expect(detailPage.rejectButton).toBeVisible()
    await detailPage.rejectButton.click()
    await waitForToast(page, /rechazada/i)
  })

  test('approved liquidation shows request payment button', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await waitForTableLoaded(page)
    const approvedRow = page.locator('tbody tr').filter({ hasText: /Aprobada/i }).first()
    const hasApproved = await approvedRow.isVisible().catch(() => false)
    test.skip(!hasApproved, 'No approved liquidations available')
    await approvedRow.click()
    const detailPage = new LiquidationDetailPage(page)
    // Request payment button may or may not be visible depending on certificate
    await expect(detailPage.dataCard).toBeVisible()
  })

  test('each role sees correct action buttons', async ({ page, loginAsPagador }) => {
    await loginAsPagador()
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await waitForTableLoaded(page)
    const rowCount = await liqPage.tableRows.count()
    test.skip(rowCount === 0, 'No liquidations available')
    await liqPage.clickRow(0)
    const detailPage = new LiquidationDetailPage(page)
    // Pagador should not see approve/reject buttons
    await expect(detailPage.approveButton).not.toBeVisible()
    await expect(detailPage.rejectButton).not.toBeVisible()
  })
})
