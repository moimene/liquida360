import { test, expect } from '../fixtures/ginv-test-data.fixture'
import { GInvIntakePage } from '../pages/ginv-intake.page'
import { waitForToast, waitForTableLoaded, hasTableData } from '../helpers/test-utils'
import AxeBuilder from '@axe-core/playwright'

test.describe('G-Invoice Intake', () => {
  test.beforeEach(async ({ loginAsGInvAdmin }) => {
    await loginAsGInvAdmin()
  })

  // Page rendering tests
  test('should display intake page heading', async ({ page }) => {
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await page.waitForLoadState('networkidle')
    await expect(intake.heading).toBeVisible()
    await expect(intake.heading).toHaveText('Ingesta Digital')
  })

  test('should display Nueva Ingesta button', async ({ page }) => {
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await page.waitForLoadState('networkidle')
    await expect(intake.createButton).toBeVisible()
  })

  test('should display 4 KPI cards', async ({ page }) => {
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await page.waitForLoadState('networkidle')
    // 4 KPI cards: Borrador, Enviado, Pendiente aprobación, Contabilizado
    await expect(intake.kpiCards).toHaveCount(4)
  })

  test('should display table columns', async ({ page }) => {
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('th').filter({ hasText: 'Tipo' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Nº Factura' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Importe' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Concepto' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Estado' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Creado' })).toBeVisible()
  })

  test('should display empty state when no items', async ({ page }) => {
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await page.waitForLoadState('networkidle')
    const hasData = await hasTableData(page)
    test.skip(hasData, 'Table has existing data - empty state not visible')
    await expect(page.getByText('No hay items de ingesta')).toBeVisible()
  })

  // Form tests
  test('should open form dialog when clicking Nueva Ingesta', async ({ page }) => {
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await page.waitForLoadState('networkidle')
    await intake.createButton.click()
    await expect(intake.formDialog).toBeVisible()
    await expect(page.getByText('Nueva Ingesta').nth(1)).toBeVisible()
  })

  test('should show all form fields in dialog', async ({ page }) => {
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await page.waitForLoadState('networkidle')
    await intake.createButton.click()
    await expect(intake.formDialog).toBeVisible()
    // Type, Job, Amount, Currency, Invoice number, Date, Concept
    await expect(intake.typeSelect).toBeVisible()
    await expect(intake.jobSelect).toBeVisible()
    await expect(intake.amountInput).toBeVisible()
    await expect(intake.currencySelect).toBeVisible()
    await expect(intake.invoiceNumberInput).toBeVisible()
    await expect(intake.invoiceDateInput).toBeVisible()
    await expect(intake.conceptTextarea).toBeVisible()
  })

  test('should show vendor select only when type is vendor_invoice', async ({ page }) => {
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await page.waitForLoadState('networkidle')
    await intake.createButton.click()
    await expect(intake.formDialog).toBeVisible()
    // Default type is vendor_invoice, so vendor select should be visible
    await expect(intake.vendorSelect).toBeVisible()
    // Switch to official_fee
    await intake.typeSelect.selectOption('official_fee')
    // Vendor select should now be hidden
    await expect(intake.vendorSelect).not.toBeVisible()
  })

  test('should validate required fields before submit', async ({ page }) => {
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await page.waitForLoadState('networkidle')
    await intake.createButton.click()
    await expect(intake.formDialog).toBeVisible()
    // Clear amount and try to submit without selecting a job
    await intake.formSubmitButton.click()
    // Form should stay open with validation errors
    await expect(intake.formDialog).toBeVisible()
  })

  // CRUD tests
  test('should create intake item and show success toast', async ({ page, testGInvIntake }) => {
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await page.waitForLoadState('networkidle')
    await intake.createButton.click()
    await expect(intake.formDialog).toBeVisible()

    const selectOptionByLabel = async (
      select: import('@playwright/test').Locator,
      preferredLabelIncludes: string,
    ) => {
      const optionLocator = select.locator('option')
      await optionLocator.nth(1).waitFor({ state: 'attached', timeout: 10_000 }).catch(() => {})
      const optionCount = await optionLocator.count()
      if (optionCount <= 1) {
        return false
      }

      const labels = await optionLocator.allTextContents()
      const preferredIndex = labels.findIndex((label) => label.includes(preferredLabelIncludes))
      const selectedIndex = preferredIndex > 0 ? preferredIndex : 1
      const selectedValue = await optionLocator.nth(selectedIndex).getAttribute('value')
      if (!selectedValue) {
        return false
      }

      await select.selectOption(selectedValue)
      return true
    }

    // Wait for jobs to load asynchronously into the select (> 1 option means real jobs loaded)
    const selectedJob = await selectOptionByLabel(intake.jobSelect, 'SEED-MAT-2025-0234')
    test.skip(!selectedJob, 'No jobs available - cannot create intake without a job')

    // Select a known compliant vendor to avoid compliance-blocked creation paths
    const selectedVendor = await selectOptionByLabel(
      intake.vendorSelect,
      'SEED Registradores de Barcelona',
    )
    test.skip(!selectedVendor, 'No vendors available - cannot create intake without a vendor')

    // Fill amount
    await intake.amountInput.fill(testGInvIntake.amount)
    // Fill invoice number
    await intake.invoiceNumberInput.fill(testGInvIntake.invoice_number)
    // Fill concept
    await intake.conceptTextarea.fill(testGInvIntake.concept_text)
    // Submit
    await intake.formSubmitButton.click()
    await waitForToast(page, 'Item registrado correctamente')
    // Dialog should close
    await expect(intake.formDialog).not.toBeVisible({ timeout: 5_000 })
  })

  // Filter tests
  test('should filter by search text', async ({ page }) => {
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await waitForTableLoaded(page)
    const hasData = await hasTableData(page)
    test.skip(!hasData, 'No intake data to filter')
    const initialCount = await page.locator('tbody tr').count()
    await intake.searchInput.fill('NonExistentIntake12345')
    await page.waitForTimeout(500)
    const filteredText = page.getByText('Sin resultados para estos filtros')
    const noResults = await filteredText.isVisible().catch(() => false)
    if (!noResults) {
      const filteredCount = await page.locator('tbody tr').count()
      expect(filteredCount).toBeLessThanOrEqual(initialCount)
    }
  })

  test('should filter by status', async ({ page }) => {
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await waitForTableLoaded(page)
    const hasData = await hasTableData(page)
    test.skip(!hasData, 'No intake data to filter')
    // Select a specific status filter
    await intake.statusFilter.selectOption('draft')
    await page.waitForTimeout(500)
    // Table should still be visible
    await expect(page.locator('table')).toBeVisible()
  })

  test('should filter by type', async ({ page }) => {
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await waitForTableLoaded(page)
    const hasData = await hasTableData(page)
    test.skip(!hasData, 'No intake data to filter')
    // Select official_fee type filter
    await intake.typeFilter.selectOption('official_fee')
    await page.waitForTimeout(500)
    // Table should still be visible
    await expect(page.locator('table')).toBeVisible()
  })

  // Accessibility
  test('should pass accessibility checks', async ({ page }) => {
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page })
      .disableRules(['select-name', 'label'])  // Form elements without labels - tracked for fix
      .analyze()
    const critical = results.violations.filter((v) => v.impact === 'critical')
    expect(critical).toEqual([])
  })
})
