import { test, expect } from '../fixtures/auth.fixture'
import { LiquidationsPage } from '../pages/liquidations.page'

test.describe('Liquidation Wizard', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin()
  })

  test('should open wizard dialog when clicking Nueva liquidación', async ({ page }) => {
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await liqPage.createButton.click()
    // Dialog uses native <dialog> element
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    // Dialog title
    await expect(dialog.getByText('Nueva liquidación').first()).toBeVisible()
    // Step description visible
    await expect(dialog.getByText(/Paso 1 de 3/i)).toBeVisible()
  })

  test('should display step 1: select correspondent', async ({ page }) => {
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await liqPage.createButton.click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    // Correspondent label and select
    await expect(dialog.getByText('Corresponsal', { exact: false }).first()).toBeVisible()
    await expect(dialog.locator('#correspondent_id')).toBeVisible()
    // Should have "Seleccionar corresponsal" default option
    await expect(dialog.locator('#correspondent_id option').first()).toHaveText('Seleccionar corresponsal')
  })

  test('should validate correspondent before advancing', async ({ page }) => {
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await liqPage.createButton.click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    // Try to advance without selecting correspondent
    await dialog.getByRole('button', { name: /Siguiente/i }).click()
    // Should stay on step 1 (dialog still visible, step text unchanged)
    await expect(dialog.getByText(/Paso 1 de 3/i)).toBeVisible()
  })

  test('should cancel wizard with Cancelar button', async ({ page }) => {
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await liqPage.createButton.click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    await dialog.getByRole('button', { name: /Cancelar/i }).click()
    await expect(dialog).not.toBeVisible()
  })

  test('should close wizard with X button', async ({ page }) => {
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await liqPage.createButton.click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    // Use .first() — dialog close button renders before any InfoPanel dismiss buttons
    await dialog.getByLabel('Cerrar').first().click()
    await expect(dialog).not.toBeVisible()
  })

  test('should advance to step 2 after selecting correspondent', async ({ page }) => {
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await liqPage.createButton.click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    const select = dialog.locator('#correspondent_id')
    const options = select.locator('option')
    const count = await options.count()
    test.skip(count <= 1, 'No correspondents available for selection')
    // Select first real correspondent (index 1, since index 0 is placeholder)
    await select.selectOption({ index: 1 })
    await dialog.getByRole('button', { name: /Siguiente/i }).click()
    // Should now be on step 2
    await expect(dialog.getByText(/Paso 2 de 3/i)).toBeVisible({ timeout: 5_000 })
    // Step 2 fields
    await expect(dialog.locator('#amount')).toBeVisible()
    await expect(dialog.locator('#currency')).toBeVisible()
    await expect(dialog.locator('#concept')).toBeVisible()
    await expect(dialog.locator('#reference')).toBeVisible()
  })

  test('should validate step 2 fields before advancing', async ({ page }) => {
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await liqPage.createButton.click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    const select = dialog.locator('#correspondent_id')
    const options = select.locator('option')
    const count = await options.count()
    test.skip(count <= 1, 'No correspondents available for selection')
    await select.selectOption({ index: 1 })
    await dialog.getByRole('button', { name: /Siguiente/i }).click()
    await expect(dialog.getByText(/Paso 2 de 3/i)).toBeVisible({ timeout: 5_000 })
    // On step 2, try to advance without filling required fields
    await dialog.getByRole('button', { name: /Siguiente/i }).click()
    // Should stay on step 2
    await expect(dialog.getByText(/Paso 2 de 3/i)).toBeVisible()
  })

  test('should advance to step 3: confirm and submit', async ({ page }) => {
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await liqPage.createButton.click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    // Step 1: select correspondent
    const select = dialog.locator('#correspondent_id')
    const options = select.locator('option')
    const count = await options.count()
    test.skip(count <= 1, 'No correspondents available for selection')
    await select.selectOption({ index: 1 })
    await dialog.getByRole('button', { name: /Siguiente/i }).click()
    await expect(dialog.getByText(/Paso 2 de 3/i)).toBeVisible({ timeout: 5_000 })
    // Step 2: fill data
    await dialog.locator('#amount').fill('10000')
    await dialog.locator('#concept').fill('E2E Test Concept')
    await dialog.getByRole('button', { name: /Siguiente/i }).click()
    // Step 3: review summary
    await expect(dialog.getByText(/Paso 3 de 3/i)).toBeVisible({ timeout: 5_000 })
    // Should show the Crear liquidación submit button
    await expect(dialog.getByRole('button', { name: /Crear liquidación/i })).toBeVisible()
    // Review data visible
    await expect(dialog.getByText('E2E Test Concept')).toBeVisible()
  })

  test('should go back from step 2 to step 1', async ({ page }) => {
    const liqPage = new LiquidationsPage(page)
    await liqPage.goto()
    await liqPage.createButton.click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    const select = dialog.locator('#correspondent_id')
    const options = select.locator('option')
    const count = await options.count()
    test.skip(count <= 1, 'No correspondents available for selection')
    await select.selectOption({ index: 1 })
    await dialog.getByRole('button', { name: /Siguiente/i }).click()
    await expect(dialog.getByText(/Paso 2 de 3/i)).toBeVisible({ timeout: 5_000 })
    // Go back
    await dialog.getByRole('button', { name: /Atrás/i }).click()
    await expect(dialog.getByText(/Paso 1 de 3/i)).toBeVisible()
  })
})
