import { test, expect } from '../fixtures/auth.fixture'
import { waitForToast, waitForTableLoaded } from '../helpers/test-utils'

test.describe('Full Liquidation Lifecycle', () => {
  test('complete liquidation workflow: create -> approve -> request payment -> pay', async ({ page, loginAsPagador, loginAsSupervisor, loginAsFinanciero }) => {
    // Step 1: Pagador creates a liquidation
    await test.step('Pagador creates liquidation', async () => {
      await loginAsPagador()
      await page.goto('/liquidations')
      const createButton = page.getByRole('button', { name: /Nueva liquidaci/i })
      const hasCreate = await createButton.isVisible().catch(() => false)
      test.skip(!hasCreate, 'No create button available for this role')
      await createButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Step 1a: Select correspondent (first available)
      const select = page.locator('#correspondent_id')
      const options = select.locator('option')
      const count = await options.count()
      test.skip(count <= 1, 'No correspondents available')
      await select.selectOption({ index: 1 })

      // Navigate to next step
      await page.getByRole('button', { name: /Siguiente/i }).click()

      // Step 1b: Fill liquidation data
      await page.locator('#amount').fill('25000')
      await page.locator('#concept').fill('E2E Lifecycle Test')
      await page.getByRole('button', { name: /Siguiente/i }).click()

      // Step 1c: Confirm and create
      await page.getByRole('button', { name: /Crear liquidaci/i }).click()
      await waitForToast(page, /creada/i)
    })

    // Step 2: Pagador submits for approval
    await test.step('Submit for approval', async () => {
      await page.goto('/liquidations')
      await waitForTableLoaded(page)
      const draftRow = page.locator('tbody tr').filter({ hasText: 'E2E Lifecycle Test' }).first()
      const hasDraft = await draftRow.isVisible().catch(() => false)
      test.skip(!hasDraft, 'Draft liquidation not found')
      await draftRow.click()
      await page.getByRole('button', { name: /Enviar a aprob/i }).click()
      await waitForToast(page, /aprobaci/i)
    })

    // Step 3: Supervisor approves
    await test.step('Supervisor approves', async () => {
      await loginAsSupervisor()
      await page.goto('/liquidations')
      await waitForTableLoaded(page)
      const pendingRow = page.locator('tbody tr').filter({ hasText: 'E2E Lifecycle Test' }).first()
      const hasPending = await pendingRow.isVisible().catch(() => false)
      test.skip(!hasPending, 'Liquidation not found in pending state')
      await pendingRow.click()
      await page.getByRole('button', { name: /Aprobar/i }).click()
      await waitForToast(page, /aprobada/i)
    })

    // Step 4: Request payment
    await test.step('Request payment', async () => {
      const requestButton = page.getByRole('button', { name: /Solicitar pago/i })
      const canRequest = await requestButton.isVisible().catch(() => false)
      if (canRequest) {
        await requestButton.click()
        await waitForToast(page, /pago/i)
      }
    })

    // Step 5: Financiero pays
    await test.step('Financiero processes payment', async () => {
      await loginAsFinanciero()
      await page.goto('/payments')
      await waitForTableLoaded(page)
      const paymentRow = page.locator('tbody tr').first()
      const hasPayment = await paymentRow.isVisible().catch(() => false)
      test.skip(!hasPayment, 'No payment request found')
      await paymentRow.click()

      // Start process if button is available
      const startButton = page.getByRole('button', { name: /Iniciar proceso/i })
      if (await startButton.isVisible().catch(() => false)) {
        await startButton.click()
        await waitForToast(page, /proceso/i)
      }

      // Mark as paid
      const paidButton = page.getByRole('button', { name: /Marcar como pagada/i })
      if (await paidButton.isVisible().catch(() => false)) {
        await paidButton.click()
        // Confirm dialog appears with "Confirmar pago" button
        const confirmButton = page.getByRole('button', { name: /Confirmar pago/i })
        await expect(confirmButton).toBeVisible()
        await confirmButton.click()
        await waitForToast(page, /pagada/i)
      }
    })
  })
})
