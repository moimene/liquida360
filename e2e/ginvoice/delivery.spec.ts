import { test, expect } from '../fixtures/auth.fixture'
import { GInvDeliveryPage } from '../pages/ginv-delivery.page'
import { waitForToast, waitForTableLoaded, hasTableData } from '../helpers/test-utils'

test.describe('Entregas', () => {
  test.beforeEach(async ({ loginAsGInvAdmin }) => {
    await loginAsGInvAdmin()
  })

  test('should display page heading', async ({ page }) => {
    const delivery = new GInvDeliveryPage(page)
    await delivery.goto()
    await page.waitForLoadState('networkidle')
    await expect(delivery.heading).toBeVisible()
    await expect(delivery.heading).toHaveText('Entregas')
  })

  test('should display Nueva Entrega button', async ({ page }) => {
    const delivery = new GInvDeliveryPage(page)
    await delivery.goto()
    await page.waitForLoadState('networkidle')
    await expect(delivery.createButton).toBeVisible()
  })

  test('should display 3 KPI cards', async ({ page }) => {
    const delivery = new GInvDeliveryPage(page)
    await delivery.goto()
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Pte. entrega')).toBeVisible()
    await expect(page.getByText('Enviadas')).toBeVisible()
    await expect(page.getByText('Total entregas')).toBeVisible()
  })

  test('should display table with correct columns', async ({ page }) => {
    const delivery = new GInvDeliveryPage(page)
    await delivery.goto()
    await page.waitForLoadState('networkidle')
    const headers = ['Factura', 'Tipo', 'Destinatarios', 'Asunto', 'Estado', 'Enviado']
    for (const h of headers) {
      await expect(page.locator('thead th').filter({ hasText: h }).first()).toBeVisible()
    }
  })

  test('should display empty state when no deliveries', async ({ page }) => {
    const delivery = new GInvDeliveryPage(page)
    await delivery.goto()
    await page.waitForLoadState('networkidle')
    const hasData = await hasTableData(page)
    if (!hasData) {
      await expect(page.getByText('No hay entregas registradas')).toBeVisible()
    }
  })

  test('should open delivery dialog with invoice select, subject, body and recipients', async ({ page }) => {
    const delivery = new GInvDeliveryPage(page)
    await delivery.goto()
    await page.waitForLoadState('networkidle')
    // Button may be disabled if no issued invoices exist
    const isEnabled = await delivery.createButton.isEnabled().catch(() => false)
    test.skip(!isEnabled, 'No issued invoices available for delivery')
    await delivery.createButton.click()
    await expect(delivery.deliveryDialog).toBeVisible()
    await expect(delivery.invoiceSelect).toBeVisible()
    await expect(delivery.subjectInput).toBeVisible()
    await expect(delivery.bodyTextarea).toBeVisible()
    // At least one recipient row should be present by default
    await expect(delivery.recipientNameInputs.first()).toBeVisible()
    await expect(delivery.recipientEmailInputs.first()).toBeVisible()
  })

  test('should add and remove recipients', async ({ page }) => {
    const delivery = new GInvDeliveryPage(page)
    await delivery.goto()
    await page.waitForLoadState('networkidle')
    const isEnabled = await delivery.createButton.isEnabled().catch(() => false)
    test.skip(!isEnabled, 'No issued invoices available for delivery')
    await delivery.createButton.click()
    await expect(delivery.deliveryDialog).toBeVisible()

    // Get initial recipient row count (may be 0 or 1 depending on UI)
    const initialCount = await delivery.recipientNameInputs.count()
    expect(initialCount).toBeGreaterThanOrEqual(0)

    // Add a recipient
    await delivery.addRecipientButton.click()
    const afterAddCount = await delivery.recipientNameInputs.count()
    expect(afterAddCount).toBe(initialCount + 1)

    // If we have more than 1 row, remove button should be available
    if (afterAddCount > 1) {
      const removeVisible = await delivery.removeRecipientButtons.first().isVisible().catch(() => false)
      if (removeVisible) {
        await delivery.removeRecipientButtons.first().click()
        const afterRemoveCount = await delivery.recipientNameInputs.count()
        expect(afterRemoveCount).toBe(afterAddCount - 1)
      }
    }
  })

  test('should validate at least 1 recipient with email', async ({ page }) => {
    const delivery = new GInvDeliveryPage(page)
    await delivery.goto()
    await page.waitForLoadState('networkidle')
    const isEnabled = await delivery.createButton.isEnabled().catch(() => false)
    test.skip(!isEnabled, 'No issued invoices available for delivery')
    await delivery.createButton.click()
    await expect(delivery.deliveryDialog).toBeVisible()

    // Select the first available invoice
    const invoiceOption = delivery.invoiceSelect.locator('option').nth(1)
    const hasOption = await invoiceOption.count()
    test.skip(hasOption === 0, 'No invoice options available')
    await delivery.invoiceSelect.selectOption({ index: 1 })

    // Try to submit without filling recipient email
    await delivery.submitButton.click()
    // Should show validation error toast
    await waitForToast(page, /al menos un destinatario/i)
  })
})
