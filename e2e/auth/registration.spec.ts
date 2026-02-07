import { test, expect } from '../fixtures/auth.fixture'

test.describe('Registration', () => {
  test('should display registration form in portal mode', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByLabel(/Nombre del despacho/i)).toBeVisible()
    await expect(page.getByLabel(/Pais/i)).toBeVisible()
    await expect(page.getByLabel(/NIF.*Tax ID/i)).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel(/Contrasena/i)).toBeVisible()
  })

  test('should validate required fields on submit', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('button', { name: /Solicitar acceso/i }).click()
    // Expect validation errors or HTML5 prevents submission
    await expect(page).toHaveURL(/\/register/)
  })

  test('should navigate to register from login portal mode', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('tab', { name: 'Corresponsal' }).click()
    await page.getByRole('link', { name: /Registrate/i }).click()
    await expect(page).toHaveURL(/\/register/)
  })

  test('should show registration link only in portal mode', async ({ page }) => {
    await page.goto('/login')
    // Internal mode - no register link
    await expect(page.getByRole('link', { name: /Registrate/i })).not.toBeVisible()
    // Portal mode - register link visible
    await page.getByRole('tab', { name: 'Corresponsal' }).click()
    await expect(page.getByRole('link', { name: /Registrate/i })).toBeVisible()
  })
})
