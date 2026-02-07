import { test, expect } from '../fixtures/auth.fixture'
import { PortalInvoicesPage } from '../pages/portal-invoices.page'
import { waitForToast, waitForTableLoaded } from '../helpers/test-utils'

test.describe('Portal Invoices', () => {
  test.beforeEach(async ({ loginAsCorresponsal }) => {
    await loginAsCorresponsal()
  })

  test('should display invoices page', async ({ page }) => {
    const invoicesPage = new PortalInvoicesPage(page)
    await invoicesPage.goto()
    await page.waitForLoadState('networkidle')
    await expect(invoicesPage.heading).toBeVisible({ timeout: 10_000 })
    await expect(invoicesPage.createButton).toBeVisible()
  })

  test('should display invoices table with correct columns', async ({ page }) => {
    const invoicesPage = new PortalInvoicesPage(page)
    await invoicesPage.goto()
    await page.waitForLoadState('networkidle')
    // Wait for the table to render (data fetched asynchronously from Supabase)
    await expect(invoicesPage.table).toBeVisible({ timeout: 15_000 })
    // Check column headers exist (some are rendered inside sortable buttons)
    await expect(page.getByText('Concepto').first()).toBeVisible()
    await expect(page.getByText('Importe').first()).toBeVisible()
    await expect(page.getByText('Estado').first()).toBeVisible()
    await expect(page.getByText('Fecha').first()).toBeVisible()
  })

  test('should open create invoice form', async ({ page }) => {
    const invoicesPage = new PortalInvoicesPage(page)
    await invoicesPage.goto()
    await page.waitForLoadState('networkidle')
    await expect(invoicesPage.createButton).toBeVisible({ timeout: 10_000 })
    await invoicesPage.createButton.click()
    await expect(invoicesPage.formDialog).toBeVisible({ timeout: 5_000 })
    await expect(invoicesPage.amountInput).toBeVisible()
    await expect(invoicesPage.conceptInput).toBeVisible()
  })

  test('should create new invoice draft', async ({ page }) => {
    const invoicesPage = new PortalInvoicesPage(page)
    await invoicesPage.goto()
    await page.waitForLoadState('networkidle')
    await expect(invoicesPage.createButton).toBeVisible({ timeout: 10_000 })
    const ts = Date.now()
    await invoicesPage.createInvoice({
      amount: '5000',
      concept: `E2E Invoice Test ${ts}`,
    })
    await waitForToast(page, /creada|guardad/i)
    await expect(invoicesPage.formDialog).not.toBeVisible()
  })

  test('should validate invoice form fields', async ({ page }) => {
    const invoicesPage = new PortalInvoicesPage(page)
    await invoicesPage.goto()
    await page.waitForLoadState('networkidle')
    await expect(invoicesPage.createButton).toBeVisible({ timeout: 10_000 })
    await invoicesPage.createButton.click()
    await expect(invoicesPage.formDialog).toBeVisible({ timeout: 5_000 })
    await invoicesPage.formSubmitButton.click()
    // Form should stay open due to validation
    await expect(invoicesPage.formDialog).toBeVisible()
  })

  test('should search invoices', async ({ page }) => {
    const invoicesPage = new PortalInvoicesPage(page)
    await invoicesPage.goto()
    await page.waitForLoadState('networkidle')
    await waitForTableLoaded(page)
    await expect(invoicesPage.searchInput).toBeVisible({ timeout: 10_000 })
    await invoicesPage.searchInput.fill('NonExistentInvoice12345')
    await page.waitForTimeout(500)
    await expect(invoicesPage.table).toBeVisible()
  })

  test('should navigate to invoice detail', async ({ page }) => {
    const invoicesPage = new PortalInvoicesPage(page)
    await invoicesPage.goto()
    await page.waitForLoadState('networkidle')
    await waitForTableLoaded(page)
    const rowCount = await invoicesPage.tableRows.count()
    test.skip(rowCount === 0, 'No invoices available')
    await invoicesPage.tableRows.first().click()
    await expect(page).toHaveURL(/\/portal\/invoices\//)
  })
})
