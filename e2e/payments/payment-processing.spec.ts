import { test, expect } from '../fixtures/auth.fixture'
import { PaymentDetailPage } from '../pages/payment-detail.page'
import { PaymentsPage } from '../pages/payments.page'
import { waitForTableLoaded, waitForToast, hasTableData } from '../helpers/test-utils'

test.describe('Payment Processing', () => {
  test('should display payment detail page', async ({ page, loginAsFinanciero }) => {
    await loginAsFinanciero()
    const paymentsPage = new PaymentsPage(page)
    await paymentsPage.goto()
    await waitForTableLoaded(page)
    const hasData = await hasTableData(page)
    test.skip(!hasData, 'No payment requests available')
    await paymentsPage.clickRow(0)
    const detailPage = new PaymentDetailPage(page)
    await expect(detailPage.heading).toBeVisible()
  })

  test('should display breadcrumbs on detail page', async ({ page, loginAsFinanciero }) => {
    await loginAsFinanciero()
    const paymentsPage = new PaymentsPage(page)
    await paymentsPage.goto()
    await waitForTableLoaded(page)
    const hasData = await hasTableData(page)
    test.skip(!hasData, 'No payment requests available')
    await paymentsPage.clickRow(0)
    const detailPage = new PaymentDetailPage(page)
    await expect(detailPage.breadcrumbs).toBeVisible()
    // Breadcrumbs should contain Inicio, Pagos
    await expect(detailPage.breadcrumbs.getByText('Inicio')).toBeVisible()
    await expect(detailPage.breadcrumbs.getByText('Pagos')).toBeVisible()
  })

  test('should display detail cards', async ({ page, loginAsFinanciero }) => {
    await loginAsFinanciero()
    const paymentsPage = new PaymentsPage(page)
    await paymentsPage.goto()
    await waitForTableLoaded(page)
    const hasData = await hasTableData(page)
    test.skip(!hasData, 'No payment requests available')
    await paymentsPage.clickRow(0)
    const detailPage = new PaymentDetailPage(page)
    await expect(detailPage.dataCard).toBeVisible()
    await expect(detailPage.requestCard).toBeVisible()
  })

  test('should start payment process for pending request', async ({ page, loginAsFinanciero }) => {
    await loginAsFinanciero()
    const paymentsPage = new PaymentsPage(page)
    await paymentsPage.goto()
    await waitForTableLoaded(page)
    const pendingRow = page.locator('tbody tr').filter({ hasText: /Pendiente/i }).first()
    const hasPending = await pendingRow.isVisible().catch(() => false)
    test.skip(!hasPending, 'No pending payment requests')
    await pendingRow.click()
    const detailPage = new PaymentDetailPage(page)
    await expect(detailPage.startProcessButton).toBeVisible()
    await detailPage.startProcessButton.click()
    await waitForToast(page, /proceso|iniciado/i)
  })

  test('should mark payment as paid', async ({ page, loginAsFinanciero }) => {
    await loginAsFinanciero()
    const paymentsPage = new PaymentsPage(page)
    await paymentsPage.goto()
    await waitForTableLoaded(page)
    // Look for pending or in-progress rows (both can be marked as paid)
    const actionableRow = page.locator('tbody tr').filter({ hasText: /Pendiente|En proceso/i }).first()
    const hasRow = await actionableRow.isVisible().catch(() => false)
    test.skip(!hasRow, 'No actionable payment requests')
    await actionableRow.click()
    const detailPage = new PaymentDetailPage(page)
    await expect(detailPage.markPaidButton).toBeVisible()
    await detailPage.markPaidButton.click()
    // Confirm dialog appears
    await expect(detailPage.confirmDialog).toBeVisible()
    // Optionally fill notes
    if (await detailPage.notesTextarea.isVisible()) {
      await detailPage.notesTextarea.fill('E2E Test: paid')
    }
    // Click "Confirmar pago" button in dialog
    await detailPage.confirmPaidButton.click()
    await waitForToast(page, /pagada|completad/i)
  })

  test('should reject payment request with notes', async ({ page, loginAsFinanciero }) => {
    await loginAsFinanciero()
    const paymentsPage = new PaymentsPage(page)
    await paymentsPage.goto()
    await waitForTableLoaded(page)
    const pendingRow = page.locator('tbody tr').filter({ hasText: /Pendiente|En proceso/i }).first()
    const hasRow = await pendingRow.isVisible().catch(() => false)
    test.skip(!hasRow, 'No actionable payment requests')
    await pendingRow.click()
    const detailPage = new PaymentDetailPage(page)
    // Click the main reject button to open confirm dialog
    await detailPage.rejectButton.click()
    await expect(detailPage.confirmDialog).toBeVisible()
    // Fill rejection notes
    if (await detailPage.notesTextarea.isVisible()) {
      await detailPage.notesTextarea.fill('E2E Test: rejected for testing')
    }
    // Click "Rechazar" button inside the dialog
    await detailPage.confirmRejectButton.click()
    await waitForToast(page, /rechazad/i)
  })

  test('should navigate to associated liquidation', async ({ page, loginAsFinanciero }) => {
    await loginAsFinanciero()
    const paymentsPage = new PaymentsPage(page)
    await paymentsPage.goto()
    await waitForTableLoaded(page)
    const hasData = await hasTableData(page)
    test.skip(!hasData, 'No payment requests available')
    await paymentsPage.clickRow(0)
    const detailPage = new PaymentDetailPage(page)
    const linkVisible = await detailPage.liquidationLink.isVisible().catch(() => false)
    test.skip(!linkVisible, 'No liquidation link available')
    await detailPage.liquidationLink.click()
    await expect(page).toHaveURL(/\/liquidations\//)
  })
})
