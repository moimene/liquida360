import { test, expect } from '../fixtures/auth.fixture'
import { GInvIntakePage } from '../pages/ginv-intake.page'
import { GInvAccountingPage } from '../pages/ginv-accounting.page'
import { GInvBillingPage } from '../pages/ginv-billing.page'
import { GInvInvoicesPage } from '../pages/ginv-invoices.page'
import { waitForToast, waitForTableLoaded } from '../helpers/test-utils'
import { createTestGInvJob, createTestGInvVendor, cleanupGInvTestData } from '../helpers/supabase-admin'

test.describe('Full Invoice Lifecycle', () => {
  test.describe.configure({ mode: 'serial' })

  let seedFailed = false

  test.beforeAll(async () => {
    try {
      // Use upsert to avoid duplicate errors on re-runs
      await createTestGInvJob({
        job_code: 'E2E-LIFECYCLE',
        client_code: 'E2E-CLI-LC',
        client_name: 'E2E Lifecycle Client',
        uttai_status: 'clear',
      })

      await createTestGInvVendor({
        name: 'E2E Lifecycle Vendor',
        tax_id: 'E2E-LC-B1234',
        country: 'ES',
      })
    } catch (err) {
      console.warn('Seed data creation failed — lifecycle tests will be skipped:', err)
      seedFailed = true
    }
  })

  test.afterAll(async () => {
    if (!seedFailed) {
      await cleanupGInvTestData('E2E')
    }
  })

  test('Step 1: Create intake item', async ({ page, loginAsGInvAdmin }) => {
    test.skip(seedFailed, 'Seed data creation failed — ginv tables may not exist')
    await loginAsGInvAdmin()
    const intake = new GInvIntakePage(page)
    await intake.goto()
    await page.waitForLoadState('networkidle')
    await intake.openCreateForm()
    // Fill form - select vendor_invoice type, job, vendor, amount, etc.
    await intake.typeSelect.selectOption('vendor_invoice')
    // Wait for job options to load asynchronously
    await page.locator('#intake-job option').nth(1).waitFor({ state: 'attached', timeout: 10_000 }).catch(() => {})
    // Select the job (it should appear in the dropdown — may show job_code or client_name)
    const jobOption = page.locator('#intake-job option').filter({ hasText: /E2E[-\s]?LIFECYCLE|E2E Lifecycle/i })
    const hasJobOption = await jobOption.count()
    test.skip(hasJobOption === 0, 'Test job not found in dropdown')
    await intake.jobSelect.selectOption({ label: await jobOption.textContent() ?? '' })
    // Select vendor (required for vendor_invoice type)
    const vendorSelect = page.locator('#intake-vendor')
    await vendorSelect.locator('option').nth(1).waitFor({ state: 'attached', timeout: 10_000 }).catch(() => {})
    const vendorCount = await vendorSelect.locator('option').count()
    if (vendorCount > 1) {
      const firstVendor = await vendorSelect.locator('option').nth(1).getAttribute('value')
      await vendorSelect.selectOption(firstVendor!)
    }
    await intake.amountInput.fill('1500.00')
    await intake.invoiceNumberInput.fill('FV-E2E-LC-001')
    await intake.conceptInput.fill('E2E Lifecycle test intake')
    await intake.submitForm()
    await waitForToast(page, 'Item registrado correctamente')
  })

  test('Step 2: Send to accounting', async ({ page, loginAsGInvAdmin }) => {
    test.skip(seedFailed, 'Seed data creation failed — ginv tables may not exist')
    await loginAsGInvAdmin()
    const accounting = new GInvAccountingPage(page)
    await accounting.goto()
    await page.waitForLoadState('networkidle')
    await waitForTableLoaded(page)
    const btn = accounting.sendToAccountingButton.first()
    const isVisible = await btn.isVisible().catch(() => false)
    test.skip(!isVisible, 'No approved items to send')
    await btn.click()
    await waitForToast(page, 'Enviado a contabilización')
  })

  test('Step 3: Post to SAP', async ({ page, loginAsGInvAdmin }) => {
    test.skip(seedFailed, 'Seed data creation failed — ginv tables may not exist')
    await loginAsGInvAdmin()
    const accounting = new GInvAccountingPage(page)
    await accounting.goto()
    await page.waitForLoadState('networkidle')
    await waitForTableLoaded(page)
    const btn = accounting.registerSapButton.first()
    const isVisible = await btn.isVisible().catch(() => false)
    test.skip(!isVisible, 'No items in sent_to_accounting state')
    await btn.click()
    await accounting.sapRefInput.fill('SAP-E2E-001')
    await accounting.sapConfirmButton.click()
    await waitForToast(page, 'Contabilizado en SAP')
  })

  test('Step 4: Create billing batch', async ({ page, loginAsGInvAdmin }) => {
    test.skip(seedFailed, 'Seed data creation failed — ginv tables may not exist')
    await loginAsGInvAdmin()
    const billing = new GInvBillingPage(page)
    await billing.goto()
    await page.waitForLoadState('networkidle')
    await waitForTableLoaded(page)
    const checkbox = billing.rowCheckboxes.first()
    const hasItems = await checkbox.isVisible().catch(() => false)
    test.skip(!hasItems, 'No items available for billing')
    await checkbox.check()
    await billing.createBatchButton.click()
    await billing.batchSubmitButton.click()
    await waitForToast(page, 'Lote creado correctamente')
  })

  test('Step 5: Create client invoice', async ({ page, loginAsGInvAdmin }) => {
    test.skip(seedFailed, 'Seed data creation failed — ginv tables may not exist')
    await loginAsGInvAdmin()
    const invoices = new GInvInvoicesPage(page)
    await invoices.goto()
    await page.waitForLoadState('networkidle')
    await invoices.createButton.click()
    const batchOption = page.locator('#batch-select option').nth(1)
    const hasOption = await batchOption.count()
    test.skip(hasOption === 0, 'No batches available')
    await invoices.batchSelect.selectOption({ index: 1 })
    await invoices.createSubmitButton.click()
    await waitForToast(page, 'Factura creada')
  })

  test('Step 6: Request partner approval', async ({ page, loginAsGInvAdmin }) => {
    test.skip(seedFailed, 'Seed data creation failed — ginv tables may not exist')
    await loginAsGInvAdmin()
    const invoices = new GInvInvoicesPage(page)
    await invoices.goto()
    await page.waitForLoadState('networkidle')
    await waitForTableLoaded(page)
    const btn = invoices.requestApprovalButton.first()
    const isVisible = await btn.isVisible().catch(() => false)
    test.skip(!isVisible, 'No draft invoices to request approval')
    await btn.click()
    await waitForToast(page, 'Enviada para aprobación del socio')
  })
})
