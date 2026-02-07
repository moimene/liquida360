import { test, expect } from '../fixtures/auth.fixture'
import { PaymentsPage } from '../pages/payments.page'
import { waitForTableLoaded, hasTableData } from '../helpers/test-utils'

test.describe('Payment Queue', () => {
  test('financiero can access payment queue', async ({ page, loginAsFinanciero }) => {
    await loginAsFinanciero()
    const paymentsPage = new PaymentsPage(page)
    await paymentsPage.goto()
    await expect(paymentsPage.heading).toBeVisible()
  })

  test('admin can access payment queue', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
    const paymentsPage = new PaymentsPage(page)
    await paymentsPage.goto()
    await expect(paymentsPage.heading).toBeVisible()
  })

  test('should display status stat cards', async ({ page, loginAsFinanciero }) => {
    await loginAsFinanciero()
    const paymentsPage = new PaymentsPage(page)
    await paymentsPage.goto()
    await expect(paymentsPage.pendingCard).toBeVisible()
    await expect(paymentsPage.inProgressCard).toBeVisible()
    await expect(paymentsPage.paidCard).toBeVisible()
    await expect(paymentsPage.rejectedCard).toBeVisible()
  })

  test('should display payments table', async ({ page, loginAsFinanciero }) => {
    await loginAsFinanciero()
    const paymentsPage = new PaymentsPage(page)
    await paymentsPage.goto()
    await expect(paymentsPage.table).toBeVisible()
  })

  test('should navigate to payment detail', async ({ page, loginAsFinanciero }) => {
    await loginAsFinanciero()
    const paymentsPage = new PaymentsPage(page)
    await paymentsPage.goto()
    await waitForTableLoaded(page)
    const hasData = await hasTableData(page)
    test.skip(!hasData, 'No payment requests available')
    await paymentsPage.clickRow(0)
    await expect(page).toHaveURL(/\/payments\//)
  })

  test('pagador cannot access payments page', async ({ page, loginAsPagador }) => {
    await loginAsPagador()
    await page.goto('/payments')
    await expect(page).not.toHaveURL(/\/payments/)
  })
})
